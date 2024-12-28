import { OpenAIConfig } from "./models.js";

export const defaultConfig: OpenAIConfig = {
  apiKey: "",
  models: [
    {
      key: "gpt-4o",
      name: "gpt-4o",
      provider: "openai",
      maxInputTokens: 128000,
      maxOutputTokens: 16384,
      description:
        "Versatile, high-intelligence flagship model with text and image capabilities",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    {
      key: "gpt-4o-mini",
      name: "gpt-4o-mini",
      provider: "openai",
      maxInputTokens: 128000,
      maxOutputTokens: 16384,
      description: "Fast, affordable small model for focused tasks",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    {
      key: "o1",
      name: "o1",
      provider: "openai",
      maxInputTokens: 200000,
      maxOutputTokens: 100000,
      description: "Advanced reasoning model for complex problem-solving",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    {
      key: "o1-mini",
      name: "o1-mini",
      provider: "openai",
      maxInputTokens: 128000,
      maxOutputTokens: 65536,
      description: "Fast and affordable reasoning model for specialized tasks",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  ],
};