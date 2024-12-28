import { ModelDescription } from "../types.js";

export type ProviderConfig<T> = {
  apiKey: string;
  models: T[];
};

export type BaseModelConfig = ModelDescription & {
  maxInputTokens: number;
  temperature?: number;
  topP?: number;
};

export type CachedConfig<T> = {
  config: ProviderConfig<T>;
};
