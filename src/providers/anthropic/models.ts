import { BaseModel, BaseModelSettings } from "../types.js";
import { ModelDescription } from "../../types.js";

export type AnthropicModel = BaseModel;

export type AnthropicModelSettings = BaseModelSettings & {
  topK?: number;
};

export type AnthropicConfig = {
  apiKey: string;
  models: AnthropicModel[];
  modelSettings: AnthropicModelSettings[];
};

export function mapToModelDescription(
  model: AnthropicModel,
  settings: AnthropicModelSettings
): ModelDescription {
  return {
    key: settings.key,
    name: model.name,
    maxOutputTokens: model.maxOutputTokens,
    description: settings.description,
  };
}
