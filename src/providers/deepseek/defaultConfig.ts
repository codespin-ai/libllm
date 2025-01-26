import { DeepseekConfig } from "./models.js";

export const defaultConfig: DeepseekConfig = {
  apiKey: "",
  models: [
    {
      name: "deepseek-chat",
      maxInputTokens: 64000,
      maxOutputTokens: 8000,
    },
    {
      name: "deepseek-reasoner",
      maxInputTokens: 64000,
      maxOutputTokens: 8000,
    },
  ],
  modelSettings: [
    {
      key: "deepseek-chat",
      modelKey: "deepseek-chat",
      description: "General purpose conversational model",
      temperature: 0.7,
      topP: 0.95,
    },
    {
      key: "deepseek-reasoner",
      modelKey: "deepseek-reasoner",
      description: "Advanced reasoning model for complex problem solving",
      temperature: 0.3,
      topP: 0.85,
    },
  ],
};
