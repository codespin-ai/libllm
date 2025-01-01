import { InvalidProviderError } from "./errors.js";
import * as anthropic from "./providers/anthropic/api.js";
import * as openAI from "./providers/openai/api.js";
import { LLMProvider, Logger } from "./types.js";

export * as types from "./types.js";
export * as parsing from "./responseParsing/index.js";
export * as errors from "./errors.js";

export function getAPI(
  name: string,
  configDir: string,
  globalConfigDir?: string,
  logger?: Logger
): LLMProvider {
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

export async function getProviderForModel(
  model: string,
  configDir: string,
  globalConfigDir?: string
): Promise<string | undefined> {
  // Get all provider APIs
  const providers = await getProviders();

  // Check each provider's models
  for (const provider of providers) {
    const api = getAPI(provider, configDir, globalConfigDir);
    const models = await api.getModels();

    // If we find the model in this provider's models, return the provider name
    if (models.find((m) => m.key === model)) {
      return provider;
    }
  }

  return undefined;
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
