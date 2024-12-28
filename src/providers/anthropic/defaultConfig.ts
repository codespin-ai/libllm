import { AnthropicConfig } from "./models.js";

export const defaultConfig: AnthropicConfig = {
  apiKey: "",
  models: [
    {
      name: "claude-3-5-sonnet-20241022",
      alias: "claude-3-5-sonnet",
      provider: "anthropic",
      maxInputTokens: 200000,
      maxOutputTokens: 8192,
      description: "Most capable Claude 3.5 model",
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
    },
    {
      name: "claude-3-5-haiku-20241022",
      alias: "claude-3-5-haiku",
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
