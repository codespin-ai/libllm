import * as openAI from "./api/openAI.js";
import * as anthropic from "./api/anthropic.js";
import { InvalidProviderError } from "./errors.js";
import { ConfigLoaders, LLMAPI, Logger } from "./types.js";
export { AnthropicConfig } from "./api/anthropic.js";
export { OpenAIConfig } from "./api/openAI.js";
export { extractFromMarkdownCodeBlock } from "./responseParsing/codeBlocks.js";
export { fileBlockParser } from "./responseParsing/fileBlockParser.js";
export { createStreamingFileParser } from "./responseParsing/streamingFileParser.js";
export * from "./types.js";

export function getAPI(
  name: string,
  configLoaders: ConfigLoaders,
  logger?: Logger
): LLMAPI {
  if (name === "openai") {
    return openAI.getAPI(configLoaders.openAI, logger);
  } else if (name === "anthropic") {
    return anthropic.getAPI(configLoaders.anthropic, logger);
  } else {
    throw new InvalidProviderError();
  }
}
