import { FileContent } from "../types.js";
import { execRegexSafely } from "../execRegexSafely.js";

export async function fileBlockParser(
  response: string,
  xmlCodeBlockElement: string | undefined
): Promise<FileContent[]> {
  if (xmlCodeBlockElement) {
    return parseXmlContent(response, xmlCodeBlockElement);
  }
  return parseFileContent(response);
}

const filePathRegex =
  /File path:\s*([\w./-]+)\s*\n^```(?:\w*\n)?([\s\S]*?)^```/gm;

// This regex captures anything that looks like "File path: path" format
const filePathExtractor = /File path:\s*([\w./-]+)/;

function parseFileContent(input: string): FileContent[] {
  const results: FileContent[] = [];
  let remainingInput = input;

  while (remainingInput.trim() !== "") {
    const match = execRegexSafely(filePathRegex, remainingInput);
    if (match) {
      const path = match[1]?.trim();
      const content = match[2]?.trim();

      if (path && content) {
        results.push({ path: path, content: content });
      }

      // Move the start position past the current match to search for the next block
      remainingInput = remainingInput.substring(match.index + match[0].length);
    } else {
      break; // No more matches, exit the loop
    }
  }

  return results;
}

function parseXmlContent(input: string, xmlElement: string): FileContent[] {
  const results: FileContent[] = [];

  // Create a regex that matches the XML tags and captures their content
  const xmlRegex = new RegExp(
    `<${xmlElement}>([\\s\\S]*?)</${xmlElement}>`,
    "g"
  );

  let match;
  while ((match = xmlRegex.exec(input)) !== null) {
    const content = match[1]?.trim();
    if (!content) continue;

    // Split input into lines and look backwards from the match for the file path
    const upToMatch = input.substring(0, match.index);
    const lines = upToMatch.split("\n");

    // Find the last non-empty line before the XML block
    let pathLine = "";
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line) {
        pathLine = line;
        break;
      }
    }

    // Extract the file path using the existing pattern
    const pathMatch = filePathExtractor.exec(pathLine);
    if (pathMatch) {
      const path = pathMatch[1].trim();
      results.push({ path, content: content });
    }
  }

  return results;
}
