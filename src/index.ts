import * as openai from "./api/openai.js";
import { InvalidProviderError } from "./errors.js";
import { ConfigLoaders, LLMAPI, Logger } from "./types.js";
export { AnthropicConfig } from "./api/anthropic.js";
export { OpenAIConfig } from "./api/openai.js";
export { extractFromMarkdownCodeBlock } from "./responseParsing/codeBlocks.js";
export { fileBlockParser } from "./responseParsing/fileBlockParser.js";
export { createStreamingFileParser } from "./responseParsing/streamingFileParser.js";
export * from "./types.js";

export function getAPI(name: string, configLoaders: ConfigLoaders, logger?: Logger): LLMAPI {
  if (name === "openai") {
    return openai.getAPI(configLoaders.openai);
  } else if (name === "anthropic") {
    return openai.getAPI(configLoaders.anthropic);
  } else {
    throw new InvalidProviderError();
  }
}
