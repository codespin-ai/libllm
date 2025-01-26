import { InvalidProviderError, UnknownModelError } from "./errors.js";
import * as anthropic from "./providers/anthropic/api.js";
import * as openai from "./providers/openai/api.js";
import * as deepseek from "./providers/deepseek/api.js";
import { LLMAPI, LLMProvider } from "./types.js";

export * as errors from "./errors.js";
export * as parsing from "./responseParsing/index.js";
export * as types from "./types.js";

const providers: LLMProvider[] = [openai, anthropic, deepseek];

export function getProvider(name: string): LLMProvider {
  const provider = providers.find((x) => x.getName() === name);
  if (provider) {
    return provider;
  } else {
    throw new InvalidProviderError(name);
  }
}

export function getProviders(): LLMProvider[] {
  return providers;
}

export async function getAPIForModel(
  model: string,
  configDir: string,
  globalConfigDir?: string
): Promise<LLMAPI> {
  // Get all provider APIs
  const providers = getProviders();

  // Check each provider's models
  for (const provider of providers) {
    const api = provider.getAPI(configDir, globalConfigDir);
    const models = await api.getModels();

    // If we find the model in this provider's models, return the provider name
    if (models.find((m) => m.key === model)) {
      return api;
    }
  }

  throw new UnknownModelError(model);
}
