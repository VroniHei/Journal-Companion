import type { ReactNode } from "react";

// Leichtgewichtiges Rendering eines kleinen, kontrollierten Markdown-Subsets
// (Absätze, Überschriften, **fett**, *kursiv*, Aufzählungen, nummerierte Listen).
// Bewusst ohne Abhängigkeit/HTML-Injection: es werden nur React-Elemente gebaut.

function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null = re.exec(text);
  while (m !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <strong key={`${keyBase}-b${i}`} className="font-semibold">
          {m[1]}
        </strong>,
      );
    } else {
      const italic = m[2] ?? m[3] ?? "";
      out.push(
        <em key={`${keyBase}-i${i}`} className="italic">
          {italic}
        </em>,
      );
    }
    last = re.lastIndex;
    i++;
    m = re.exec(text);
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const BOLD_LINE = /^\*\*(.+?)\*\*:?\s*$/;
const BULLET = /^[-*•]\s+(.*)$/;
const NUMBERED = /^(\d+)\.\s+(.*)$/;

export function FormattedText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (para.length === 0) return;
    const joined = para.join(" ");
    blocks.push(<p key={`p${key}`}>{renderInline(joined, `p${key}`)}</p>);
    key++;
    para = [];
  };

  let idx = 0;
  while (idx < lines.length) {
    const raw = lines[idx].trim();

    if (raw === "") {
      flushPara();
      idx++;
      continue;
    }

    // Trennlinie (--- / *** / ___) → feine Hairline statt sichtbarer Striche.
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(raw)) {
      flushPara();
      blocks.push(
        <hr
          key={`hr${key}`}
          className="border-0 border-t border-[var(--border)]"
        />,
      );
      key++;
      idx++;
      continue;
    }

    const heading = HEADING.exec(raw);
    const boldLine = BOLD_LINE.exec(raw);
    if (heading || boldLine) {
      flushPara();
      const label = (heading ? heading[2] : (boldLine?.[1] ?? "")).replace(/:$/, "");
      blocks.push(
        <p
          key={`h${key}`}
          className="text-[0.95em] font-semibold leading-snug text-[var(--foreground)] [&:not(:first-child)]:mt-4"
        >
          {label}
        </p>,
      );
      key++;
      idx++;
      continue;
    }

    if (BULLET.test(raw)) {
      flushPara();
      const items: string[] = [];
      while (idx < lines.length) {
        const match = BULLET.exec(lines[idx].trim());
        if (!match) break;
        items.push(match[1]);
        idx++;
      }
      blocks.push(
        <ul key={`ul${key}`} className="space-y-2">
          {items.map((it, n) => (
            <li key={`ul${key}-${n}`} className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              <span>{renderInline(it, `ul${key}-${n}`)}</span>
            </li>
          ))}
        </ul>,
      );
      key++;
      continue;
    }

    if (NUMBERED.test(raw)) {
      flushPara();
      const items: { num: number; text: string }[] = [];
      while (idx < lines.length) {
        const match = NUMBERED.exec(lines[idx].trim());
        if (!match) break;
        items.push({ num: Number(match[1]), text: match[2] });
        idx++;
      }
      blocks.push(
        <ol key={`ol${key}`} className="list-decimal space-y-2 pl-5">
          {items.map((it, n) => (
            // value erhält die echte Nummer aus dem Text — sonst startet jede
            // durch Leerzeilen getrennte Einzel-Liste wieder bei 1.
            <li key={`ol${key}-${n}`} value={it.num}>
              {renderInline(it.text, `ol${key}-${n}`)}
            </li>
          ))}
        </ol>,
      );
      key++;
      continue;
    }

    para.push(raw);
    idx++;
  }
  flushPara();

  return (
    <div className={`space-y-3.5 leading-7 ${className}`}>{blocks}</div>
  );
}
