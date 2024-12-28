import { readFile, writeFile } from "fs/promises";
import path from "path";
import Anthropic, {
  AuthenticationError as AnthropicAuthenticationError,
} from "@anthropic-ai/sdk";
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
  MissingAnthropicEnvVarError,
} from "../../errors.js";
import { defaultConfig } from "./defaultConfig.js";
import {
  AnthropicConfig,
  AnthropicModelConfig,
  mapToModelDescription,
} from "./models.js";
import { CachedConfig } from "../types.js";

const FILE_PATH_PREFIX = "File path:";

let configCache: CachedConfig<AnthropicModelConfig> | undefined;

function convertToSDKFormat(
  content: string | CompletionContentPart[]
):
  | string
  | Array<
      Anthropic.Messages.TextBlockParam | Anthropic.Messages.ImageBlockParam
    > {
  if (typeof content === "string") {
    return content;
  }

  return content.map((part) => {
    if (part.type === "text") {
      return {
        type: "text",
        text: part.text,
      };
    }
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: part.base64Data,
      },
    };
  });
}

async function loadConfig(configDir: string): Promise<AnthropicConfig> {
  if (configCache) {
    return configCache.config;
  }

  const configPath = path.join(configDir, "anthropic.json");
  try {
    const configContent = await readFile(configPath, "utf-8");
    const config = JSON.parse(configContent) as AnthropicConfig;
    configCache = { config };
    return config;
  } catch (error) {
    throw new Error(`Failed to load Anthropic config: ${error}`);
  }
}

async function reloadConfig(configDir: string): Promise<void> {
  configCache = undefined;
  await loadConfig(configDir);
}

export function getAPI(configDir: string, logger?: Logger) {
  let anthropicClient: Anthropic | undefined;

  async function init(): Promise<void> {
    const configPath = path.join(configDir, "anthropic.json");
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
    const apiKey = process.env.ANTHROPIC_API_KEY ?? config.apiKey;

    if (!apiKey) {
      throw new MissingAnthropicEnvVarError();
    }

    if (!anthropicClient || reloadConfig) {
      anthropicClient = new Anthropic({ apiKey });
    }

    logger?.writeDebug(
      `ANTHROPIC: model=${options.model.alias ?? options.model.name}`
    );

    if (options.maxTokens) {
      logger?.writeDebug(`ANTHROPIC: maxTokens=${options.maxTokens}`);
    }

    const sdkMessages = messages.map((msg) => ({
      role: msg.role,
      content: convertToSDKFormat(msg.content),
    }));

    let responseText = "";
    let fullMessage: Anthropic.Messages.Message;

    try {
      const stream = await anthropicClient.messages.stream({
        model: options.model.name,
        max_tokens: options.maxTokens ?? options.model.maxOutputTokens,
        messages: sdkMessages,
      });

      if (options.cancelCallback) {
        options.cancelCallback(() => {
          stream.abort();
        });
      }

      const { processChunk, finish } = options.fileResultStreamCallback
        ? createStreamingFileParser(
            options.fileResultStreamCallback,
            FILE_PATH_PREFIX,
            undefined
          )
        : { processChunk: undefined, finish: undefined };

      stream.on("text", (text) => {
        responseText += text;
        if (options.responseStreamCallback) {
          options.responseStreamCallback(text);
        }
        if (processChunk) {
          processChunk(text);
        }
      });

      fullMessage = await stream.finalMessage();

      if (finish) {
        finish();
      }
    } catch (ex: any) {
      if (ex instanceof AnthropicAuthenticationError) {
        throw new InvalidCredentialsError("ANTHROPIC");
      } else {
        throw ex;
      }
    }

    logger?.writeDebug("---ANTHROPIC RESPONSE---");
    logger?.writeDebug(responseText);

    return {
      message: responseText,
      finishReason:
        fullMessage.stop_reason === "max_tokens" ? "MAX_TOKENS" : "STOP",
    };
  }

  return { completion, getModels, init };
}

export const anthropicProvider = {
  reloadConfig,
};
