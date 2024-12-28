import { ModelDescription } from "../../types.js";
import { BaseModelConfig } from "../types.js";

export type AnthropicModelConfig = BaseModelConfig & {
  topK?: number;
};

export type AnthropicConfig = {
  apiKey: string;
  models: AnthropicModelConfig[];
};

export function mapToModelDescription(
  config: AnthropicModelConfig
): ModelDescription {
  return {
    name: config.name,
    alias: config.alias,
    provider: config.provider,
    maxOutputTokens: config.maxOutputTokens,
    description: config.description,
  };
}
