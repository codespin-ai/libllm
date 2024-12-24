export function getLogger(isDebug?: boolean) {
  function writeError(text?: string) {
    console.error(text || "");
  }

  function writeDebug(text: string) {
    if (isDebug) {
      console.log(text || "");
    }
  }

  return {
    writeError,
    writeDebug,
  };
}
