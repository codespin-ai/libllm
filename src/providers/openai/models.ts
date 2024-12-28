import { ModelDescription } from "../../types.js";
import { BaseModelConfig } from "../types.js";

export type OpenAIModelConfig = BaseModelConfig & {
  frequencyPenalty?: number;
  presencePenalty?: number;
};

export type OpenAIConfig = {
  apiKey: string;
  models: OpenAIModelConfig[];
};

export function mapToModelDescription(
  config: OpenAIModelConfig
): ModelDescription {
  return {
    name: config.name,
    alias: config.alias,
    provider: config.provider,
    maxOutputTokens: config.maxOutputTokens,
    description: config.description,
  };
}
