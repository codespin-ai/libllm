export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export function approximateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export function calculateApproxTokenUsage(
  input: string, 
  output: string
): TokenUsage {
  return {
    inputTokens: approximateTokenCount(input),
    outputTokens: approximateTokenCount(output)
  };
}