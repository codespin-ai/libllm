import * as openAI from "./api/openai/completion.js";
import * as anthropic from "./api/anthropic/completion.js";
import { CompletionOptions } from "./CompletionOptions.js";
import { CompletionResult } from "./CompletionResult.js";
import { InvalidProviderError } from "./errors.js";
import { CompletionInputMessage } from "./types.js";

export type CompletionFunc = (
  messages: CompletionInputMessage[],
  options: CompletionOptions,
  reloadConfig?: boolean
) => Promise<CompletionResult>;

export type LLMAPI = {
  completion: CompletionFunc;
};

export type ConfigLoaders = {
  openAI: () => Promise<openAI.OpenAIConfig>;
  anthropic: () => Promise<anthropic.AnthropicConfig>;
};

export function getCompletionAPI(
  name: string,
  configLoaders: ConfigLoaders
): LLMAPI {
  if (name === "openai") {
    return openAI.getAPI(configLoaders.openAI);
  } else if (name === "anthropic") {
    return openAI.getAPI(configLoaders.anthropic);
  } else {
    throw new InvalidProviderError();
  }
}
