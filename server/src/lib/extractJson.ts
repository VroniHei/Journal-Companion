/** Extrahiert ein JSON-Objekt, auch wenn es in ```-Fences oder Text eingebettet ist. */
export function extractJson(text: string): unknown {
  const fenced = text.replace(/```(?:json)?/gi, "");
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("kein JSON");
  return JSON.parse(fenced.slice(start, end + 1));
}
