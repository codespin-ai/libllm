/**
 * Parses a response string to extract a JSON block if it exists
 */
export function jsonParser<T>(response: string): T | undefined {
  // Match a JSON block between triple backticks with optional 'json' language specifier
  const jsonRegex = /^```(?:json)?\n([\s\S]*?)^```/gm;
  const match = jsonRegex.exec(response);

  if (!match || !match[1]) {
    return undefined;
  }

  try {
    const jsonContent = match[1].trim();
    return JSON.parse(jsonContent);
  } catch (error) {
    // If JSON parsing fails, return undefined
    return undefined;
  }
}
