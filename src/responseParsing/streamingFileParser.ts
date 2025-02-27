import { execRegexSafely } from "../execRegexSafely.js";
import { FileContent, StreamingFileParseResult } from "../types.js";

// Function to create regex for file blocks with backticks
function createStartFileRegexBackticks(filePathPrefix: string) {
  return new RegExp(
    `${filePathPrefix}\\s*([\\w./-]+)\\s*\\n\\s*\`\`\`(?:\\w*)\\n`,
    "g"
  );
}

// Regex to match the end of a file block with backticks
const endFileRegexBackticks = /\s*```\n?/g;

// Function to create start regex for XML tags
function createStartFileRegexXml(filePathPrefix: string, xmlElement: string) {
  return new RegExp(
    `${filePathPrefix}\\s*([\\w./-]+)\\s*\\n\\s*<${xmlElement}>(?:\\n)?`,
    "g"
  );
}

// Function to create end regex for XML tags
function createEndFileRegexXml(xmlElement: string) {
  return new RegExp(`\\s*</${xmlElement}>\\n?`, "g");
}

// Regex to match language identifier line
const languageLineRegex = /^\w+\n/;

export type StreamingFileParser = {
  processChunk: (chunk: string) => void;
  finish: () => void;
};

export function createStreamingFileParser(
  callback: (result: StreamingFileParseResult) => void,
  filePathPrefix: string,
  xmlCodeBlockElement: string | undefined
): StreamingFileParser {
  let buffer: string = ""; // Buffer to accumulate incoming text
  let insideFileBlock: boolean = false; // Flag to track if we're inside a file block
  let currentFilePath: string = ""; // Variable to store the current file path

  // Choose the appropriate regex based on whether XML mode is enabled
  const startFileRegex = xmlCodeBlockElement
    ? createStartFileRegexXml(filePathPrefix, xmlCodeBlockElement)
    : createStartFileRegexBackticks(filePathPrefix);

  const endFileRegex = xmlCodeBlockElement
    ? createEndFileRegexXml(xmlCodeBlockElement)
    : endFileRegexBackticks;

  function processChunk(chunk: string): void {
    // Emit the incoming chunk as a "text" event immediately and unconditionally
    callback({ type: "text", content: chunk });

    // Append the chunk to the buffer
    buffer += chunk;

    // Continuously process the buffer for all possible matches
    processBuffer();
  }

  function processBuffer(): void {
    while (true) {
      if (!insideFileBlock) {
        // Look for the start of a file block
        const startMatch = execRegexSafely(startFileRegex, buffer);

        if (startMatch) {
          const matchStartIndex = startMatch.index;
          const matchEndIndex = startFileRegex.lastIndex;

          // Emit any text before the start of the file block
          if (matchStartIndex > 0) {
            const textBlockContent = buffer.slice(0, matchStartIndex);
            if (textBlockContent.trim()) {
              callback({ type: "text-block", content: textBlockContent });
            }
          }

          // Extract the file path
          currentFilePath = startMatch[1];
          callback({ type: "start-file-block", path: currentFilePath });

          // Update the buffer to remove the processed part
          buffer = buffer.slice(matchEndIndex);

          // Emit the remaining as "text", but only up to the end marker if found
          if (buffer.length) {
            const endMatch = execRegexSafely(endFileRegex, buffer);

            if (endMatch) {
              callback({
                type: "text",
                content: buffer.slice(0, endMatch.index),
              });
            } else {
              callback({ type: "text", content: buffer });
            }
          }

          insideFileBlock = true;

          // Continue the loop to check for more matches
          continue;
        } else {
          // No more start matches; exit the loop
          break;
        }
      } else {
        // Inside a file block, look for the end
        const endMatch = execRegexSafely(endFileRegex, buffer);

        if (endMatch) {
          const matchStartIndex = endMatch.index;
          const matchEndIndex = endFileRegex.lastIndex;

          // Extract the file content up to the end of the block
          let fileContent = buffer.slice(0, matchStartIndex);

          // Strip out language identifier if not in XML mode
          if (!xmlCodeBlockElement) {
            const languageMatch = languageLineRegex.exec(fileContent);
            if (languageMatch) {
              fileContent = fileContent.slice(languageMatch[0].length);
            }
          }

          // Emit the end of the file block with the correct path
          const sourceFile: FileContent = {
            path: currentFilePath,
            content: fileContent.trim(), // Also trim any extra whitespace
          };
          callback({ type: "end-file-block", file: sourceFile });

          // Update the buffer to remove the processed part
          buffer = buffer.slice(matchEndIndex);

          // Reset the current file path
          currentFilePath = "";

          // Emit the remaining as "text", but only up to the start marker if found
          if (buffer.length) {
            const startMatch = execRegexSafely(startFileRegex, buffer);

            if (startMatch) {
              const text = buffer.slice(0, startMatch.index);
              if (text) {
                callback({
                  type: "text",
                  content: buffer.slice(0, startMatch.index),
                });
              }
            } else {
              callback({ type: "text", content: buffer });
            }
          }

          insideFileBlock = false;

          // Continue the loop to check for more matches
          continue;
        } else {
          // No end match found; wait for more chunks
          break;
        }
      }
    }
  }

  function finish() {
    if (buffer.trim() !== "") {
      callback({ type: "text-block", content: buffer });
    }
  }

  return {
    processChunk,
    finish,
  };
}
