import Anthropic, {
  AuthenticationError as AnthropicAuthenticationError,
} from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import path from "path";
import {
  InvalidCredentialsError
} from "../../errors.js";
import { createStreamingFileParser } from "../../responseParsing/streamingFileParser.js";
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
  AnthropicConfig,
  AnthropicModel,
  AnthropicModelSettings,
  mapToModelDescription,
} from "./models.js";

const FILE_PATH_PREFIX = "File path:";

let configCache:
  | CachedConfig<AnthropicModel, AnthropicModelSettings>
  | undefined;

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

async function loadConfig(
  configDir: string,
  globalConfigDir?: string
): Promise<AnthropicConfig> {
  if (configCache) {
    return configCache.config;
  }

  let config = { ...defaultConfig, apiKey: "" }; // Start with empty API key

  // Load global config to get API key if provided
  if (globalConfigDir) {
    try {
      const globalConfigPath = path.join(globalConfigDir, "anthropic.json");
      const globalConfigContent = await readFile(globalConfigPath, "utf-8");
      const globalConfig = JSON.parse(globalConfigContent) as AnthropicConfig;
      config.apiKey = globalConfig.apiKey;
    } catch (error) {
      // If global config doesn't exist, continue without apiKey
    }
  }

  // Load local config, allowing it to override everything including apiKey
  try {
    const configPath = path.join(configDir, "anthropic.json");
    const configContent = await readFile(configPath, "utf-8");
    const localConfig = JSON.parse(configContent) as AnthropicConfig;
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
  let anthropicClient: Anthropic | undefined;

  async function init(options?: {
    storeKeysGlobally?: boolean;
    force?: boolean;
  }) {
    return initializeConfig("anthropic", defaultConfig, configDir, {
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
    const apiKey = process.env.ANTHROPIC_API_KEY ?? config.apiKey;

    if (!apiKey) {
      throw new InvalidCredentialsError("ANTHROPIC");
    }

    if (!anthropicClient || reloadConfig) {
      anthropicClient = new Anthropic({ apiKey });
    }

    const settings = config.modelSettings.find((s) => s.key === options.model);
    if (!settings) {
      throw new Error(`Model settings not found for key: ${options.model}`);
    }

    const model = config.models.find((m) => m.key === settings.modelKey);
    if (!model) {
      throw new Error(`Model not found for key: ${settings.modelKey}`);
    }

    logger?.writeDebug(`ANTHROPIC: model=${settings.key}`);

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
        model: model.key,
        max_tokens: options.maxTokens ?? model.maxOutputTokens,
        messages: sdkMessages,
        temperature: settings.temperature,
        top_k: settings.topK,
        top_p: settings.topP,
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
