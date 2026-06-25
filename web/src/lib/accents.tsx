import { Fragment, type ReactNode } from "react";

// *Wort* → behutsamer Newsreader-Italic-Akzent (Innerline-Signatur).
//
// SICHER: rendert Text als React-Textknoten (kein dangerouslySetInnerHTML),
// daher kein XSS-Risiko und kein Bedarf an HTML-Escaping. Ersetzt die früheren
// `<em class="g">…</em>`-HTML-Strings + `escapeHtml`-Krücke.
export function withAccents(text: string, keyBase = "a"): ReactNode {
  return text.split(/(\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={`${keyBase}-${i}`} className="g">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={`${keyBase}-${i}`}>{part}</Fragment>;
  });
}
