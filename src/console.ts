export function writeError(text?: string) {
  console.error(text || "");
}

export function writeDebug(text: string) {
  console.log(text || "");
}
