import { readFile, writeFile } from "fs/promises";
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
  OpenAIModelConfig,
  mapToModelDescription,
} from "./models.js";
import { CachedConfig } from "../types.js";

const FILE_PATH_PREFIX = "File path:";

let configCache: CachedConfig<OpenAIModelConfig> | undefined;

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

async function loadConfig(configDir: string): Promise<OpenAIConfig> {
  if (configCache) {
    return configCache.config;
  }

  const configPath = path.join(configDir, "openai.json");
  try {
    const configContent = await readFile(configPath, "utf-8");
    const config = JSON.parse(configContent) as OpenAIConfig;
    configCache = { config };
    return config;
  } catch (error) {
    throw new Error(`Failed to load OpenAI config: ${error}`);
  }
}

async function reloadConfig(configDir: string): Promise<void> {
  configCache = undefined;
  await loadConfig(configDir);
}

export function getAPI(configDir: string, logger?: Logger) {
  let openaiClient: OpenAI | undefined;

  async function init(): Promise<void> {
    const configPath = path.join(configDir, "openai.json");
    await writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
  }

  async function getModels(): Promise<ModelDescription[]> {
    const config = await loadConfig(configDir);
    return config.models.map(mapToModelDescription);
  }

  async function completion(
    messages: CompletionInputMessage[],
    options: CompletionOptions,
    reloadConfig?: boolean
  ): Promise<CompletionResult> {
    const config = await loadConfig(configDir);
    const apiKey = process.env.OPENAI_API_KEY ?? config.apiKey;

    if (!apiKey) {
      throw new ClientInitializationError("OPENAI");
    }

    if (!openaiClient || reloadConfig) {
      openaiClient = new OpenAI({ apiKey });
    }

    // Find the model config based on the key
    const modelConfig = config.models.find(m => m.key === options.model.key);
    if (!modelConfig) {
      throw new Error(`Model configuration not found for key: ${options.model.key}`);
    }

    logger?.writeDebug(
      `OPENAI: model=${options.model.key}`
    );
    const maxTokens = options.maxTokens ?? modelConfig.maxOutputTokens;
    if (maxTokens) {
      logger?.writeDebug(`OPENAI: maxTokens=${maxTokens}`);
    }

    const transformedMessages = convertMessagesToOpenAIFormat(messages);

    let responseText = "";
    let finishReason: OpenAI.Chat.Completions.ChatCompletionChunk.Choice["finish_reason"] =
      null;

    try {
      const stream = await openaiClient.chat.completions.create({
        model: modelConfig.name ?? modelConfig.key,
        messages: transformedMessages,
        max_tokens: maxTokens,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        frequency_penalty: modelConfig.frequencyPenalty,
        presence_penalty: modelConfig.presencePenalty,
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
        // Check for finish_reason
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

export const openaiProvider = {
  reloadConfig,
};