// Message Types for LLM Communication
// Represents different parts of a message that can be sent to an LLM

// Text part of a message
export type CompletionContentPartText = {
  type: "text";
  text: string;
};

// Image part of a message (base64 encoded)
export type CompletionContentPartImage = {
  type: "image";
  base64Data: string;
};

// Union type of all possible message content parts
export type CompletionContentPart =
  | CompletionContentPartText
  | CompletionContentPartImage;

// User message that can contain text and/or images
export type CompletionUserMessage = {
  role: "user";
  content: string | CompletionContentPart[];
};

// Assistant (LLM) response message, always text
export type CompletionAssistantMessage = {
  role: "assistant";
  content: string;
};

// Union type of all message types in a conversation
export type CompletionInputMessage =
  | CompletionUserMessage
  | CompletionAssistantMessage;

// File Handling Types
// Core type representing a source code file
export type FileContent = {
  path: string; // Relative path to the file
  content: string; // File contents
};

// Streaming parser events for processing LLM responses containing code files
export type StreamingFileParseResult =
  | { type: "text"; content: string } // Raw text chunk
  | { type: "end-file-block"; file: FileContent } // Complete file found
  | { type: "start-file-block"; path: string } // Start of a file block
  | { type: "text-block"; content: string }; // Non-file content block

// Model Configuration Types
// Describes an LLM model's capabilities and constraints
export type ModelDescription = {
  key: string; // Unique identifier for this configuration
  name?: string; // Model identifier (e.g. "gpt-4")
  provider: string; // LLM provider ("openai" or "anthropic")
  maxOutputTokens: number; // Maximum allowed response length
  description?: string; // Description of the model's capabilities
};

// Configuration Types for API Access
export type ConfigLoaders = {
  configDir: string;
};

// API Types for LLM Communication
// Primary function type for sending completion requests
export type CompletionFunc = (
  messages: CompletionInputMessage[],
  options: CompletionOptions,
  reloadConfig?: boolean
) => Promise<CompletionResult>;

// Interface implemented by LLM providers
export type InitResult = {
  created: string[];
  skipped: string[];
};

export type LLMAPI = {
  completion: CompletionFunc;
  getModels: () => Promise<ModelDescription[]>;
  init: (options?: {
    storeKeysGlobally?: boolean;
    force?: boolean;
  }) => Promise<InitResult>;
};

// Options for controlling completion behavior
export type CompletionOptions = {
  model: string; // Just the key that references the model settings
  maxTokens?: number;
  reloadConfig?: boolean;
  cancelCallback?: (cancel: () => void) => void;
  responseStreamCallback?: (data: string) => void;
  fileResultStreamCallback?: (data: StreamingFileParseResult) => void;
  tokenCounting?: "approx" | "disabled";
};

// Result of a completion request
export type CompletionResult = {
  message: string;
  finishReason: "STOP" | "MAX_TOKENS"; // Why generation ended
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
};

// Parser Types
export type ParseFunc = (response: string) => Promise<FileContent[]>;
export type ResponseParsers = "file-block";

// Logging Interface
export type Logger = {
  writeError: (text: string) => void;
  writeDebug: (text: string) => void;
};
