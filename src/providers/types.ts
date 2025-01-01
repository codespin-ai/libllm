export type BaseModel = {
  name: string;
  maxInputTokens: number;
  maxOutputTokens: number;
};

export type BaseModelSettings = {
  key: string;
  modelKey: string;
  description: string;
  temperature?: number;
  topP?: number;
};

export type ProviderConfig<
  TModel extends BaseModel,
  TSettings extends BaseModelSettings
> = {
  apiKey: string;
  models: TModel[];
  modelSettings: TSettings[];
};

export type CachedConfig<
  TModel extends BaseModel,
  TSettings extends BaseModelSettings
> = {
  config: ProviderConfig<TModel, TSettings>;
};
