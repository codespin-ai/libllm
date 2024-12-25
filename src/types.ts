import { AnthropicConfig } from "./api/anthropic.js";
import { OpenAIConfig } from "./api/openAI.js";
import { CompletionOptions } from "./CompletionOptions.js";
import { CompletionResult } from "./CompletionResult.js";

export type FileContent = {
  path: string;
  content: string;
};

export type ModelDescription = {
  name: string;
  alias?: string;
  provider: string;
  maxOutputTokens: number;
};

export type CompletionContentPartText = {
  type: "text";
  text: string;
};

export type CompletionContentPartImage = {
  type: "image";
  base64Data: string;
};

export type CompletionContentPart =
  | CompletionContentPartText
  | CompletionContentPartImage;

export type CompletionUserMessage = {
  role: "user";
  content: string | CompletionContentPart[];
};

export type CompletionAssistantMessage = {
  role: "assistant";
  content: string;
};

export type CompletionInputMessage =
  | CompletionUserMessage
  | CompletionAssistantMessage;

export type ParseFunc = (response: string) => Promise<FileContent[]>;

export type ResponseParsers = "file-block";

export type Logger = {
  writeError: (text?: string) => void;
  writeDebug: (text?: string) => void;
};

export type CompletionFunc = (
  messages: CompletionInputMessage[],
  options: CompletionOptions,
  reloadConfig?: boolean
) => Promise<CompletionResult>;

export type LLMAPI = {
  completion: CompletionFunc;
};

export type ConfigLoaders = {
  openAI: () => Promise<OpenAIConfig>;
  anthropic: () => Promise<AnthropicConfig>;
};
