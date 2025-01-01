# LIBLLM

A TypeScript library for interacting with LLM APIs (OpenAI, Anthropic) with response parsing utilities.

## Installation

```bash
npm install libllm
```

## Features

### Completion Messages

Messages support both text and images:

```ts
type CompletionContentPart =
  | { type: "text"; text: string }
  | { type: "image"; base64Data: string };

type CompletionInputMessage = {
  role: "user" | "assistant";
  content: string | CompletionContentPart[];
};
```

### Completion Options

```ts
type CompletionOptions = {
  // Model identifier (e.g. "claude-3-5-sonnet", "gpt-4o")
  model: string;

  // Maximum tokens to generate (defaults to model max)
  maxTokens?: number;

  // Force reload of config
  reloadConfig?: boolean;

  // Called with cancel function when stream starts
  cancelCallback?: (cancel: () => void) => void;

  // Called for each response chunk
  responseStreamCallback?: (data: string) => void;

  // Called with parsed file results while streaming
  fileResultStreamCallback?: (data: StreamingFileParseResult) => void;
};
```

### Response Types

Completion results:

```ts
type CompletionResult = {
  message: string;
  finishReason: "STOP" | "MAX_TOKENS";
};
```

File parsing results:

```ts
type FileContent = {
  path: string; // Relative file path
  content: string; // File contents
};

type StreamingFileParseResult =
  | { type: "text"; content: string }
  | { type: "end-file-block"; file: FileContent }
  | { type: "start-file-block"; path: string }
  | { type: "text-block"; content: string };
```

## Usage

### Initialize Configuration

```ts
import { getAPI } from "libllm";

const api = getAPI(
  "openai", // Provider name
  "./config", // Config directory
  "/global", // Optional global config directory
  logger // Optional logger
);

// Create default config files
await api.init({
  storeKeysGlobally: true, // Store API keys in global config
  force: false, // Don't overwrite existing configs
});
```

### Run Completions

Basic completion:

```ts
const messages = [
  {
    role: "user",
    content: "Generate a TypeScript interface",
  },
];

const result = await api.completion(messages, {
  model: "claude-3-5-sonnet",
});
```

Streaming with file parsing:

```ts
const result = await api.completion(messages, {
  model: "claude-3-5-sonnet",
  responseStreamCallback: (chunk) => {
    console.log("Raw chunk:", chunk);
  },
  fileResultStreamCallback: (result) => {
    if (result.type === "end-file-block") {
      console.log("File:", result.file.path);
      console.log(result.file.content);
    }
  },
});
```

### Parse Responses

File block parser:

````ts
import { fileBlockParser } from "libllm";

// Parses responses containing file blocks like:
// File path: src/index.ts
// ```ts
// content
// ```

const files = await fileBlockParser(
  response,
  "File path:", // Prefix that marks file paths
  undefined // Optional XML element name
);
````

JSON parser:

````ts
import { jsonParser } from "libllm";

// Parses responses containing JSON blocks like:
// ```json
// { "key": "value" }
// ```

const data = jsonParser<MyType>(response);
````

## Configuration

Configuration files contain model definitions and settings.

OpenAI config (`openai.json`):

```json
{
  "apiKey": "...",
  "models": [
    {
      "key": "gpt-4o",
      "provider": "openai",
      "maxInputTokens": 128000,
      "maxOutputTokens": 16384
    }
  ],
  "modelSettings": [
    {
      "key": "gpt-4o",
      "modelKey": "gpt-4o",
      "description": "GPT-4",
      "temperature": 0.7,
      "topP": 1,
      "frequencyPenalty": 0,
      "presencePenalty": 0
    }
  ]
}
```

Anthropic config (`anthropic.json`):

```json
{
  "apiKey": "...",
  "models": [
    {
      "key": "claude-3-5-sonnet-latest",
      "provider": "anthropic",
      "maxInputTokens": 200000,
      "maxOutputTokens": 8192
    }
  ],
  "modelSettings": [
    {
      "key": "claude-3-5-sonnet",
      "modelKey": "claude-3-5-sonnet-latest",
      "description": "Claude 3.5 Sonnet",
      "temperature": 0.7,
      "topK": 40,
      "topP": 0.9
    }
  ]
}
```

Configs can be stored:

- Globally in a system-wide location for API keys
- Per-project for model settings

## License

MIT
