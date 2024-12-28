import { BaseModel, BaseModelSettings } from "../types.js";
import { ModelDescription } from "../../types.js";

export type OpenAIModel = BaseModel;

export type OpenAIModelSettings = BaseModelSettings & {
  frequencyPenalty?: number;
  presencePenalty?: number;
};

export type OpenAIConfig = {
  apiKey: string;
  models: OpenAIModel[];
  modelSettings: OpenAIModelSettings[];
};

export function mapToModelDescription(
  model: OpenAIModel,
  settings: OpenAIModelSettings
): ModelDescription {
  return {
    key: settings.key,
    name: model.key,
    provider: model.provider,
    maxOutputTokens: model.maxOutputTokens,
    description: settings.description,
  };
}
