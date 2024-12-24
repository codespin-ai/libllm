import OpenAI, {
  AuthenticationError as OpenAIAuthenticationError,
} from "openai";
import { createStreamingFileParser } from "../responseParsing/streamingFileParser.js";
import { CompletionContentPart, CompletionInputMessage } from "../types.js";
import { CompletionOptions } from "../CompletionOptions.js";
import { CompletionResult } from "../CompletionResult.js";
import {
  ClientInitializationError,
  InvalidCredentialsError,
} from "../errors.js";
import { getLogger } from "../logger.js";

export type OpenAIConfig = {
  apiKey: string;
};

function convertContentToOpenAIFormat(
  content: string | CompletionContentPart[]
): string | Array<OpenAI.Chat.ChatCompletionContentPart> {
  if (typeof content === "string") {
    return content;
  }

  return content.map((part): OpenAI.Chat.ChatCompletionContentPart => {
    if (part.type === "text") {
      return {
        type: "text",
        text: part.text,
      };
    } else {
      return {
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${part.base64Data}`,
          detail: "auto",
        },
      };
    }
  });
}

function convertMessagesToOpenAIFormat(
  messages: CompletionInputMessage[]
): Array<OpenAI.Chat.ChatCompletionMessageParam> {
  return messages.map((msg) => {
    if (msg.role === "user") {
      return {
        role: "user" as const,
        content: convertContentToOpenAIFormat(msg.content),
      };
    } else {
      return {
        role: "assistant" as const,
        content: msg.content,
      };
    }
  });
}

export function getAPI(configLoader: () => Promise<OpenAIConfig>) {
  let config: OpenAIConfig | undefined;
  let openaiClient: OpenAI | undefined = undefined;

  async function completion(
    messages: CompletionInputMessage[],
    options: CompletionOptions,
    isDebug?: boolean,
    reloadConfig?: boolean
  ): Promise<CompletionResult> {
    const logger = getLogger(isDebug);

    if (!config || reloadConfig) {
      config = await configLoader();
      const apiKey = (process.env as any).ANTHROPIC_API_KEY ?? config?.apiKey;
      openaiClient = new OpenAI({ apiKey });
    }

    if (!openaiClient) {
      throw new ClientInitializationError("OPENAI");
    }

    logger.writeDebug(
      `OPENAI: model=${options.model.alias ?? options.model.name}`
    );
    const maxTokens = options.maxTokens ?? options.model.maxOutputTokens;
    if (maxTokens) {
      logger.writeDebug(`OPENAI: maxTokens=${maxTokens}`);
    }

    const transformedMessages = convertMessagesToOpenAIFormat(messages);

    let responseText = "";
    let finishReason: OpenAI.Chat.Completions.ChatCompletionChunk.Choice["finish_reason"] =
      null;

    try {
      const stream = await openaiClient.chat.completions.create({
        model: options.model.name,
        messages: transformedMessages,
        max_tokens: maxTokens,
        stream: true,
      });

      if (options.cancelCallback) {
        options.cancelCallback(() => {
          stream.controller.abort();
        });
      }

      const { processChunk, finish } = options.fileResultStreamCallback
        ? createStreamingFileParser(options.fileResultStreamCallback)
        : { processChunk: undefined, finish: undefined };

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        responseText += content;
        if (options.responseStreamCallback) {
          options.responseStreamCallback(content);
        }
        if (processChunk) {
          processChunk(content);
        }
        // Check for finish_reason
        finishReason = chunk.choices[0]?.finish_reason;
      }

      if (finish) {
        finish();
      }
    } catch (ex: any) {
      if (ex instanceof OpenAIAuthenticationError) {
        throw new InvalidCredentialsError("OPENAI");
      } else {
        throw ex;
      }
    }

    logger.writeDebug("---OPENAI RESPONSE---");
    logger.writeDebug(responseText);

    return {
      message: responseText,
      finishReason: finishReason === "length" ? "MAX_TOKENS" : "STOP",
    };
  }

  return { completion };
}
