export type FileContent = {
  path: string;
  content: string;
};

export type ModelDescription = {
  name: string;
  alias?: string;
  provider: string;
  maxOutputTokens: number;
};

export type CompletionContentPartText = {
  type: "text";
  text: string;
};

export type CompletionContentPartImage = {
  type: "image";
  base64Data: string;
};

export type CompletionContentPart =
  | CompletionContentPartText
  | CompletionContentPartImage;

export type CompletionUserMessage = {
  role: "user";
  content: string | CompletionContentPart[];
};

export type CompletionAssistantMessage = {
  role: "assistant";
  content: string;
};

export type CompletionInputMessage =
  | CompletionUserMessage
  | CompletionAssistantMessage;

export type ParseFunc = (response: string) => Promise<FileContent[]>;

export type ResponseParsers = "file-block";
