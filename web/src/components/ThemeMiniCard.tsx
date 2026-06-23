// Mini-Karten-Vorschau (Claude Design, Update Juni 2026): einheitlicher Stil an
// allen vier Stellen (Dashboard „Was sich zeigt" Desktop/Mobile, Muster
// Desktop/Mobile). Foto `zitat-weg.webp` + dunkelgrüner Verlauf, ein einzelnes
// Schlüsselwort in Newsreader-Italic (#A8E84F). Kein Logo, kein Subtext, kein Datum.
export function ThemeMiniCard({
  keyword,
  wordSize = 20,
  fill = false,
  className = "",
  style,
}: {
  keyword: string;
  /** Schriftgröße des Schlüsselworts in px (Desktop 3-Spalten: 30, sonst 16–20). */
  wordSize?: number;
  /** true: füllt die volle Zeilenhöhe (Dashboard-Desktop, 3-Spalten). */
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[12px] shadow-[0_6px_20px_rgba(28,33,22,.26)] ${
        fill ? "h-full min-h-[110px]" : ""
      } ${className}`}
      style={style}
    >
      <img
        src="/img/zitat-weg.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 58%" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(28,33,22,.16) 0%, rgba(28,33,22,.04) 30%, rgba(28,33,22,.86) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 px-3 py-2.5">
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: wordSize,
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            color: "#A8E84F",
          }}
        >
          {keyword}
        </div>
      </div>
    </div>
  );
}
