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
    key: config.key,
    name: config.name,
    provider: config.provider,
    maxOutputTokens: config.maxOutputTokens,
    description: config.description,
  };
}
