import Anthropic, {
  AuthenticationError as AnthropicAuthenticationError,
} from "@anthropic-ai/sdk";
import { CompletionOptions } from "../CompletionOptions.js";
import { CompletionResult } from "../CompletionResult.js";
import { CompletionInputMessage, CompletionContentPart } from "../types.js";
import { createStreamingFileParser } from "../responseParsing/streamingFileParser.js";
import {
  InvalidCredentialsError,
  MissingAnthropicEnvVarError,
} from "../errors.js";
import { Logger } from "../index.js";

export type AnthropicConfig = {
  apiKey: string;
};

function convertToSDKFormat(
  content: string | CompletionContentPart[]
):
  | string
  | Array<
      Anthropic.Messages.TextBlockParam | Anthropic.Messages.ImageBlockParam
    > {
  if (typeof content === "string") {
    return content;
  }

  return content.map((part) => {
    if (part.type === "text") {
      return {
        type: "text",
        text: part.text,
      };
    }
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: part.base64Data,
      },
    };
  });
}

export function getAPI(configLoader: () => Promise<AnthropicConfig>, logger? : Logger) {
  let config: AnthropicConfig | undefined;

  async function completion(
    messages: CompletionInputMessage[],
    options: CompletionOptions,
    reloadConfig?: boolean
  ): Promise<CompletionResult> {
    if (!config || reloadConfig) {
      config = await configLoader();
    }

    const apiKey = (process.env as any).ANTHROPIC_API_KEY ?? config?.apiKey;

    if (apiKey) {
      throw new MissingAnthropicEnvVarError();
    }

    logger?.writeDebug(`ANTHROPIC: model=${options.model.alias ?? options.model.name}`);

    if (options.maxTokens) {
      logger?.writeDebug(`ANTHROPIC: maxTokens=${options.maxTokens}`);
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    const sdkMessages = messages.map((msg) => ({
      role: msg.role,
      content: convertToSDKFormat(msg.content),
    }));

    let responseText = "";
    let fullMessage: Anthropic.Messages.Message;

    try {
      const stream = await anthropic.messages.stream({
        model: options.model.name,
        max_tokens: options.maxTokens ?? options.model.maxOutputTokens,
        messages: sdkMessages,
      });

      if (options.cancelCallback) {
        options.cancelCallback(() => {
          stream.abort();
        });
      }

      const { processChunk, finish } = options.fileResultStreamCallback
        ? createStreamingFileParser(options.fileResultStreamCallback)
        : { processChunk: undefined, finish: undefined };

      stream.on("text", (text) => {
        responseText += text;
        if (options.responseStreamCallback) {
          options.responseStreamCallback(text);
        }
        if (processChunk) {
          processChunk(text);
        }
      });

      fullMessage = await stream.finalMessage();

      if (finish) {
        finish();
      }
    } catch (ex: any) {
      if (ex instanceof AnthropicAuthenticationError) {
        throw new InvalidCredentialsError("ANTHROPIC");
      } else {
        throw ex;
      }
    }

    logger?.writeDebug("---ANTHROPIC RESPONSE---");
    logger?.writeDebug(responseText);

    return {
      message: responseText,
      finishReason:
        fullMessage.stop_reason === "max_tokens" ? "MAX_TOKENS" : "STOP",
    };
  }

  return { completion };
}
