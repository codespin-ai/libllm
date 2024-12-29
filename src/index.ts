import { InvalidProviderError } from "./errors.js";
import * as anthropic from "./providers/anthropic/api.js";
import * as openAI from "./providers/openai/api.js";
import { LLMAPI, Logger } from "./types.js";
export { AnthropicConfig } from "./providers/anthropic/models.js";
export { OpenAIConfig } from "./providers/openai/models.js";
export { extractFromMarkdownCodeBlock } from "./responseParsing/codeBlocks.js";
export { fileBlockParser } from "./responseParsing/fileBlockParser.js";
export { createStreamingFileParser } from "./responseParsing/streamingFileParser.js";
export * from "./types.js";
export { ModelDescription } from "./types.js";

export function getAPI(
  name: string,
  configDir: string,
  globalConfigDir?: string,
  logger?: Logger
): LLMAPI {
  if (name === "openai") {
    return openAI.getAPI(configDir, globalConfigDir, logger);
  } else if (name === "anthropic") {
    return anthropic.getAPI(configDir, globalConfigDir, logger);
  } else {
    throw new InvalidProviderError(name);
  }
}

export async function getProviders() {
  return ["openai", "anthropic"];
}

export async function reloadConfig(
  configDir: string,
  globalConfigDir?: string,
  provider?: string
) {
  if (provider) {
    // Reload specific provider
    switch (provider) {
      case "openai":
        await openAI.reloadConfig(configDir, globalConfigDir);
        break;
      case "anthropic":
        await anthropic.reloadConfig(configDir, globalConfigDir);
        break;
      default:
        throw new InvalidProviderError(provider);
    }
  } else {
    // Reload all providers
    await Promise.all([
      openAI.reloadConfig(configDir, globalConfigDir),
      anthropic.reloadConfig(configDir, globalConfigDir),
    ]);
  }
}
