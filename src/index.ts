import * as openAI from "./api/openai.js";
import * as anthropic from "./api/anthropic.js";
import { CompletionOptions } from "./CompletionOptions.js";
import { CompletionResult } from "./CompletionResult.js";
import { InvalidProviderError } from "./errors.js";
import { CompletionInputMessage } from "./types.js";
export { extractFromMarkdownCodeBlock } from "./responseParsing/codeBlocks.js";
export { fileBlockParser } from "./responseParsing/fileBlockParser.js";
export { createStreamingFileParser } from "./responseParsing/streamingFileParser.js";
export * from "./types.js";
export { OpenAIConfig } from "./api/openai.js";
export { AnthropicConfig } from "./api/anthropic.js";

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

export function getAPI(name: string, configLoaders: ConfigLoaders): LLMAPI {
  if (name === "openai") {
    return openAI.getAPI(configLoaders.openAI);
  } else if (name === "anthropic") {
    return openAI.getAPI(configLoaders.anthropic);
  } else {
    throw new InvalidProviderError();
  }
}
