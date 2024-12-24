import * as openai from "./api/openai.js";
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
  openai: () => Promise<openai.OpenAIConfig>;
  anthropic: () => Promise<anthropic.AnthropicConfig>;
};

export function getAPI(name: string, configLoaders: ConfigLoaders): LLMAPI {
  if (name === "openai") {
    return openai.getAPI(configLoaders.openai);
  } else if (name === "anthropic") {
    return openai.getAPI(configLoaders.anthropic);
  } else {
    throw new InvalidProviderError();
  }
}
