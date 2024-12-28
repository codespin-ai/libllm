import * as openAI from "./providers/openai/api.js";
import * as anthropic from "./providers/anthropic/api.js";
import { InvalidProviderError } from "./errors.js";
import { CompletionOptions, ConfigLoaders, LLMAPI, Logger } from "./types.js";
export { AnthropicConfig } from "./providers/anthropic/models.js";
export { OpenAIConfig } from "./providers/openai/models.js";
export { ModelDescription } from "./types.js";
export { extractFromMarkdownCodeBlock } from "./responseParsing/codeBlocks.js";
export { fileBlockParser } from "./responseParsing/fileBlockParser.js";
export { createStreamingFileParser } from "./responseParsing/streamingFileParser.js";
export * from "./types.js";

const providers = {
  openai: openAI,
  anthropic: anthropic,
};

let globalConfigDir: string;

export function getAPI(
  name: string,
  configDir: string,
  logger?: Logger
): LLMAPI {
  globalConfigDir = configDir;
  if (name === "openai") {
    return openAI.getAPI(configDir, logger);
  } else if (name === "anthropic") {
    return anthropic.getAPI(configDir, logger);
  } else {
    throw new InvalidProviderError();
  }
}

export async function getModels() {
  if (!globalConfigDir) {
    throw new Error("Must call getAPI first to set config directory");
  }

  const allModels = [];
  for (const [name, provider] of Object.entries(providers)) {
    const api = provider.getAPI(globalConfigDir);
    const models = await api.getModels();
    allModels.push(...models);
  }
  return allModels;
}

export async function reloadConfig(provider?: string) {
  if (!globalConfigDir) {
    throw new Error("Must call getAPI first to set config directory");
  }

  if (provider) {
    // Reload specific provider
    switch (provider) {
      case "openai":
        await openAI.openaiProvider.reloadConfig(globalConfigDir);
        break;
      case "anthropic":
        await anthropic.anthropicProvider.reloadConfig(globalConfigDir);
        break;
      default:
        throw new InvalidProviderError();
    }
  } else {
    // Reload all providers
    await Promise.all([
      openAI.openaiProvider.reloadConfig(globalConfigDir),
      anthropic.anthropicProvider.reloadConfig(globalConfigDir),
    ]);
  }
}
