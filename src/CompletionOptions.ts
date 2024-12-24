import { StreamingFileParseResult } from "./responseParsing/streamingFileParser.js";
import { ModelDescription } from "./types.js";

export type CompletionOptions = {
  model: ModelDescription;
  maxTokens: number | undefined;
  reloadConfig?: boolean;
  cancelCallback?: (cancel: () => void) => void;
  responseStreamCallback?: (data: string) => void;
  fileResultStreamCallback?: (data: StreamingFileParseResult) => void;
};
