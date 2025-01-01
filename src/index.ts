import { InvalidProviderError } from "./errors.js";
import * as anthropic from "./providers/anthropic/api.js";
import * as openai from "./providers/openai/api.js";
import { LLMProvider } from "./types.js";

export * as errors from "./errors.js";
export * as parsing from "./responseParsing/index.js";
export * as types from "./types.js";

export function getProvider(name: string): LLMProvider {
  if (name === "openai") {
    return openai;
  } else if (name === "anthropic") {
    return anthropic;
  } else {
    throw new InvalidProviderError(name);
  }
}

export function getProviders(): { [name: string]: LLMProvider } {
  return { openai, anthropic };
}

export async function getProviderForModel(
  model: string,
  configDir: string,
  globalConfigDir?: string
): Promise<LLMProvider | undefined> {
  // Get all provider APIs
  const providers = getProviders();

  // Check each provider's models
  for (const providerName of Object.keys(providers)) {
    const provider = providers[providerName];
    const api = provider.getAPI(configDir, globalConfigDir);
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
        await openai.reloadConfig(configDir, globalConfigDir);
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
      openai.reloadConfig(configDir, globalConfigDir),
      anthropic.reloadConfig(configDir, globalConfigDir),
    ]);
  }
}
