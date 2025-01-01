import { AnthropicConfig } from "./models.js";

export const defaultConfig: AnthropicConfig = {
  apiKey: "",
  models: [
    {
      name: "claude-3-5-sonnet-latest",
      maxInputTokens: 200000,
      maxOutputTokens: 8192,
    },
    {
      name: "claude-3-5-haiku-latest",
      maxInputTokens: 200000,
      maxOutputTokens: 8192,
    },
  ],
  modelSettings: [
    {
      key: "claude-3-5-sonnet",
      modelKey: "claude-3-5-sonnet-latest",
      description: "Most capable Claude 3.5 model",
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
    },
    {
      key: "claude-3-5-haiku",
      modelKey: "claude-3-5-haiku-latest",
      description: "Fast and efficient Claude 3.5 model",
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
    },
  ],
};
