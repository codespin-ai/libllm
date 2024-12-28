import { OpenAIConfig } from "./models.js";

export const defaultConfig: OpenAIConfig = {
  apiKey: "",
  models: [
    {
      name: "gpt-4o-2024-08-06",
      alias: "gpt-4o",
      provider: "openai",
      maxInputTokens: 128000,
      maxOutputTokens: 16384,
      description: "Versatile, high-intelligence flagship model with text and image capabilities",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    },
    {
      name: "gpt-4o-mini-2024-07-18",
      alias: "gpt-4o-mini",
      provider: "openai",
      maxInputTokens: 128000,
      maxOutputTokens: 16384,
      description: "Fast, affordable small model for focused tasks",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    },
    {
      name: "o1-2024-12-17",
      alias: "o1",
      provider: "openai",
      maxInputTokens: 200000,
      maxOutputTokens: 100000,
      description: "Advanced reasoning model for complex problem-solving",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    },
    {
      name: "o1-mini-2024-09-12",
      alias: "o1-mini",
      provider: "openai",
      maxInputTokens: 128000,
      maxOutputTokens: 65536,
      description: "Fast and affordable reasoning model for specialized tasks",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  ]
};