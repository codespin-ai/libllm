import { BaseModel, BaseModelSettings } from "../types.js";
import { ModelDescription } from "../../types.js";

export type DeepseekModel = BaseModel;

export type DeepseekModelSettings = BaseModelSettings & {
  topP?: number;
};

export type DeepseekConfig = {
  apiKey: string;
  models: DeepseekModel[];
  modelSettings: DeepseekModelSettings[];
};

export function mapToModelDescription(
  model: DeepseekModel,
  settings: DeepseekModelSettings
): ModelDescription {
  return {
    key: settings.key,
    name: model.name,
    maxOutputTokens: model.maxOutputTokens,
    description: settings.description,
  };
}
