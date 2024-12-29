import { readFile } from "fs/promises";
import path from "path";
import OpenAI, {
  AuthenticationError as OpenAIAuthenticationError,
} from "openai";
import {
  CompletionInputMessage,
  CompletionContentPart,
  CompletionOptions,
  CompletionResult,
  ModelDescription,
  Logger,
} from "../../types.js";
import { createStreamingFileParser } from "../../responseParsing/streamingFileParser.js";
import {
  InvalidCredentialsError,
  ClientInitializationError,
} from "../../errors.js";
import { defaultConfig } from "./defaultConfig.js";
import {
  OpenAIConfig,
  OpenAIModel,
  OpenAIModelSettings,
  mapToModelDescription,
} from "./models.js";
import { CachedConfig } from "../types.js";
import { initializeConfig } from "../initHelper.js";

const FILE_PATH_PREFIX = "File path:";

let configCache: CachedConfig<OpenAIModel, OpenAIModelSettings> | undefined;

function convertContentToOpenAIFormat(
  content: string | CompletionContentPart[]
): string | Array<OpenAI.Chat.ChatCompletionContentPart> {
  if (typeof content === "string") {
    return content;
  }

  return content.map((part): OpenAI.Chat.ChatCompletionContentPart => {
    if (part.type === "text") {
      return {
        type: "text",
        text: part.text,
      };
    } else {
      return {
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${part.base64Data}`,
          detail: "auto",
        },
      };
    }
  });
}

function convertMessagesToOpenAIFormat(
  messages: CompletionInputMessage[]
): Array<OpenAI.Chat.ChatCompletionMessageParam> {
  return messages.map((msg) => {
    if (msg.role === "user") {
      return {
        role: "user" as const,
        content: convertContentToOpenAIFormat(msg.content),
      };
    } else {
      return {
        role: "assistant" as const,
        content: msg.content,
      };
    }
  });
}

async function loadConfig(
  configDir: string,
  globalConfigDir?: string
): Promise<OpenAIConfig> {
  if (configCache) {
    return configCache.config;
  }

  let config = { ...defaultConfig, apiKey: "" }; // Start with empty API key

  // Load global config to get API key if provided
  if (globalConfigDir) {
    try {
      const globalConfigPath = path.join(globalConfigDir, "openai.json");
      const globalConfigContent = await readFile(globalConfigPath, "utf-8");
      const globalConfig = JSON.parse(globalConfigContent) as OpenAIConfig;
      config.apiKey = globalConfig.apiKey;
    } catch (error) {
      // If global config doesn't exist, continue without apiKey
    }
  }

  // Load local config, allowing it to override everything including apiKey
  try {
    const configPath = path.join(configDir, "openai.json");
    const configContent = await readFile(configPath, "utf-8");
    const localConfig = JSON.parse(configContent) as OpenAIConfig;
    config = { ...config, ...localConfig };
  } catch (error) {
    // If local config doesn't exist, use what we have
  }

  configCache = { config };
  return config;
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
  let openaiClient: OpenAI | undefined;

  async function init(options?: {
    storeKeysGlobally?: boolean;
    force?: boolean;
  }) {
    return initializeConfig("openai", defaultConfig, configDir, {
      ...options,
      globalConfigDir,
    });
  }

  async function getModels(): Promise<ModelDescription[]> {
    const config = await loadConfig(configDir, globalConfigDir);
    return config.modelSettings.map((settings) => {
      const model = config.models.find((m) => m.key === settings.modelKey);
      if (!model) {
        throw new Error(`Model not found for key: ${settings.modelKey}`);
      }
      return mapToModelDescription(model, settings);
    });
  }

  async function completion(
    messages: CompletionInputMessage[],
    options: CompletionOptions,
    reloadConfig?: boolean
  ): Promise<CompletionResult> {
    const config = await loadConfig(configDir, globalConfigDir);
    const apiKey = process.env.OPENAI_API_KEY ?? config.apiKey;

    if (!apiKey) {
      throw new ClientInitializationError("OPENAI");
    }

    if (!openaiClient || reloadConfig) {
      openaiClient = new OpenAI({ apiKey });
    }

    const settings = config.modelSettings.find((s) => s.key === options.model);
    if (!settings) {
      throw new Error(`Model settings not found for key: ${options.model}`);
    }

    const model = config.models.find((m) => m.key === settings.modelKey);
    if (!model) {
      throw new Error(`Model not found for key: ${settings.modelKey}`);
    }

    logger?.writeDebug(`OPENAI: model=${settings.key}`);

    const maxTokens = options.maxTokens ?? model.maxOutputTokens;
    if (maxTokens) {
      logger?.writeDebug(`OPENAI: maxTokens=${maxTokens}`);
    }

    const transformedMessages = convertMessagesToOpenAIFormat(messages);

    let responseText = "";
    let finishReason: OpenAI.Chat.Completions.ChatCompletionChunk.Choice["finish_reason"] =
      null;

    try {
      const stream = await openaiClient.chat.completions.create({
        model: model.key,
        messages: transformedMessages,
        max_tokens: maxTokens,
        temperature: settings.temperature,
        top_p: settings.topP,
        frequency_penalty: settings.frequencyPenalty,
        presence_penalty: settings.presencePenalty,
        stream: true,
      });

      if (options.cancelCallback) {
        options.cancelCallback(() => {
          stream.controller.abort();
        });
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
        if (options.responseStreamCallback) {
          options.responseStreamCallback(content);
        }
        if (processChunk) {
          processChunk(content);
        }
        finishReason = chunk.choices[0]?.finish_reason;
      }

      if (finish) {
        finish();
      }
    } catch (ex: any) {
      if (ex instanceof OpenAIAuthenticationError) {
        throw new InvalidCredentialsError("OPENAI");
      } else {
        throw ex;
      }
    }

    logger?.writeDebug("---OPENAI RESPONSE---");
    logger?.writeDebug(responseText);

    return {
      message: responseText,
      finishReason: finishReason === "length" ? "MAX_TOKENS" : "STOP",
    };
  }

  return { completion, getModels, init };
}
