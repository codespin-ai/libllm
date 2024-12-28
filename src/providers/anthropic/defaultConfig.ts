import { AnthropicConfig } from "./models.js";

export const defaultConfig: AnthropicConfig = {
  apiKey: "",
  models: [
    {
      key: "claude-3-5-sonnet",
      name: "claude-3-5-sonnet-20241022",
      provider: "anthropic",
      maxInputTokens: 200000,
      maxOutputTokens: 8192,
      description: "Most capable Claude 3.5 model",
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
    },
    {
      key: "claude-3-5-haiku",
      name: "claude-3-5-haiku-20241022",
      provider: "anthropic",
      maxInputTokens: 200000,
      maxOutputTokens: 8192,
      description: "Fast and efficient Claude 3.5 model",
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
    },
  ],
};