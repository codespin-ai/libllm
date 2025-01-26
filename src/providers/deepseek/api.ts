import { readFile } from "fs/promises";
import path from "path";
import OpenAI, {
  AuthenticationError as OpenAIAuthenticationError,
} from "openai";
import { InvalidCredentialsError } from "../../errors.js";
import { createStreamingFileParser } from "../../responseParsing/streamingFileParser.js";
import { calculateApproxTokenUsage } from "../../tokens/tokenCounting.js";
import {
  CompletionContentPart,
  CompletionInputMessage,
  CompletionOptions,
  CompletionResult,
  Logger,
  ModelDescription,
} from "../../types.js";
import { initializeConfig } from "../initHelper.js";
import { CachedConfig } from "../types.js";
import { defaultConfig } from "./defaultConfig.js";
import {
  DeepseekConfig,
  DeepseekModel,
  DeepseekModelSettings,
  mapToModelDescription,
} from "./models.js";

const FILE_PATH_PREFIX = "File path:";

let configCache: CachedConfig<DeepseekModel, DeepseekModelSettings> | undefined;

function convertContentToDeepseekFormat(
  content: string | CompletionContentPart[]
): string | Array<OpenAI.Chat.ChatCompletionContentPart> {
  if (typeof content === "string") {
    return content;
  }

  return content.map((part) => {
    if (part.type === "text") {
      return { type: "text", text: part.text };
    }
    return {
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${part.base64Data}`,
        detail: "auto",
      },
    };
  });
}

async function loadConfig(
  configDir: string,
  globalConfigDir?: string
): Promise<DeepseekConfig> {
  if (configCache) {
    return configCache.config;
  }

  let config = { ...defaultConfig, apiKey: "" };

  // Load global config
  if (globalConfigDir) {
    try {
      const globalConfigPath = path.join(globalConfigDir, "deepseek.json");
      const globalConfigContent = await readFile(globalConfigPath, "utf-8");
      const globalConfig = JSON.parse(globalConfigContent) as DeepseekConfig;
      config.apiKey = globalConfig.apiKey;
    } catch (error) {}
  }

  // Load local config
  try {
    const configPath = path.join(configDir, "deepseek.json");
    const configContent = await readFile(configPath, "utf-8");
    const localConfig = JSON.parse(configContent) as DeepseekConfig;
    config = { ...config, ...localConfig };
  } catch (error) {}

  configCache = { config };
  return config;
}

export function getName() {
  return "deepseek";
}

export async function reloadConfig(
  configDir: string,
  globalConfigDir?: string
): Promise<void> {
  configCache = undefined;
  await loadConfig(configDir, globalConfigDir);
}

export function getAPI(
  configDir: string,
  globalConfigDir?: string,
  logger?: Logger
) {
  let deepseekClient: OpenAI | undefined;

  async function init(options?: {
    storeKeysGlobally?: boolean;
    force?: boolean;
  }) {
    return initializeConfig("deepseek", defaultConfig, configDir, {
      ...options,
      globalConfigDir,
    });
  }

  async function getModels(): Promise<ModelDescription[]> {
    const config = await loadConfig(configDir, globalConfigDir);
    return config.modelSettings.map((settings) => {
      const model = config.models.find((m) => m.name === settings.modelKey);
      if (!model) throw new Error(`Model not found: ${settings.modelKey}`);
      return mapToModelDescription(model, settings);
    });
  }

  async function completion(
    messages: CompletionInputMessage[],
    options: CompletionOptions,
    reload?: boolean
  ): Promise<CompletionResult> {
    const config = await loadConfig(configDir, globalConfigDir);
    const apiKey = process.env.DEEPSEEK_API_KEY ?? config.apiKey;

    if (!apiKey) throw new InvalidCredentialsError("DEEPSEEK");

    if (!deepseekClient || reload) {
      await reloadConfig(configDir, globalConfigDir);
      deepseekClient = new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey,
      });
    }

    const settings = config.modelSettings.find((s) => s.key === options.model);
    if (!settings) throw new Error(`Settings not found: ${options.model}`);

    const model = config.models.find((m) => m.name === settings.modelKey);
    if (!model) throw new Error(`Model not found: ${settings.modelKey}`);

    logger?.writeDebug(`DEEPSEEK: model=${settings.key}`);
    const maxTokens = options.maxTokens ?? model.maxOutputTokens;
    if (maxTokens) logger?.writeDebug(`maxTokens=${maxTokens}`);

    // Update the message transformation code to:
    const transformedMessages: Array<
      | OpenAI.Chat.ChatCompletionUserMessageParam
      | OpenAI.Chat.ChatCompletionAssistantMessageParam
    > = messages.map((msg) => {
      if (msg.role === "user") {
        return {
          role: "user",
          content: convertContentToDeepseekFormat(msg.content),
        };
      }
      return {
        role: "assistant",
        content: msg.content,
      };
    });

    let responseText = "";
    let finishReason: OpenAI.Chat.Completions.ChatCompletionChunk.Choice["finish_reason"] =
      null;

    try {
      const stream = await deepseekClient.chat.completions.create({
        model: model.name,
        messages: transformedMessages,
        max_tokens: maxTokens,
        temperature: settings.temperature,
        top_p: settings.topP,
        stream: true,
      });

      if (options.cancelCallback) {
        options.cancelCallback(() => stream.controller.abort());
      }

      const { processChunk, finish } = options.fileResultStreamCallback
        ? createStreamingFileParser(
            options.fileResultStreamCallback,
            FILE_PATH_PREFIX,
            undefined
          )
        : { processChunk: undefined, finish: undefined };

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        responseText += content;
        options.responseStreamCallback?.(content);
        processChunk?.(content);
        finishReason = chunk.choices[0]?.finish_reason;
      }

      finish?.();
    } catch (ex: any) {
      if (ex instanceof OpenAIAuthenticationError) {
        throw new InvalidCredentialsError("DEEPSEEK");
      }
      throw ex;
    }

    logger?.writeDebug("---DEEPSEEK RESPONSE---");
    logger?.writeDebug(responseText);

    let usage = undefined;
    if (options.tokenCounting !== "disabled") {
      const inputText = transformedMessages
        .map((msg) =>
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content)
        )
        .join("\n");
      usage = calculateApproxTokenUsage(inputText, responseText);
      logger?.writeDebug(JSON.stringify(usage, null, 2));
    }

    return {
      message: responseText,
      finishReason: finishReason === "length" ? "MAX_TOKENS" : "STOP",
      usage,
    };
  }

  return { completion, getModels, init, getProviderName: getName };
}
