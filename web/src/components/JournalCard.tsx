import { Link } from "react-router-dom";
import type { JournalEntry } from "@journal/shared";
import { entryMode, entrySummaryText, entryTitle } from "../lib/entryCard";

// Modus-Zeile (Punkt + Label) nach Bento-Handoff.
function modeInfo(e: JournalEntry): { label: string; dot: string } {
  const m = entryMode(e);
  if (m === "voice") return { label: "Sprach-Check-in", dot: "#CD8A5B" };
  if (m === "contact") return { label: "Kontaktimpuls", dot: "#CD8A5B" };
  if (m === "rumination") return { label: "Schleife", dot: "#CD8A5B" };
  return { label: "Freitext", dot: "#9BA383" };
}

// Status-Badge: Reflexion bereit (grün) / Nur Eintrag (neutral).
function statusBadge(e: JournalEntry): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  if (e.aiReflection)
    return {
      label: "Reflexion bereit",
      bg: "#edf7d9",
      text: "#447510",
      border: "rgba(168,232,79,.45)",
    };
  return {
    label: "Nur Eintrag",
    bg: "#fff",
    text: "#9a917f",
    border: "rgba(35,34,26,.12)",
  };
}

// Mood-Pille: getönter Hintergrund + lesbarer Textton + Punkt (Bento-Skala).
function moodInfo(v: number): {
  label: string;
  pillBg: string;
  pillText: string;
  dot: string;
} {
  if (v > 7.5)
    return { label: "Leicht", pillBg: "#edf7d9", pillText: "#447510", dot: "#6E9B2C" };
  if (v > 5.5)
    return {
      label: "Ruhig",
      pillBg: "rgba(155,163,131,.16)",
      pillText: "#4d5340",
      dot: "#9BA383",
    };
  if (v > 3.5)
    return {
      label: "Gemischt",
      pillBg: "rgba(205,138,91,.14)",
      pillText: "#8a4f2a",
      dot: "#CD8A5B",
    };
  return {
    label: "Schwer",
    pillBg: "rgba(205,138,91,.18)",
    pillText: "#8a4f2a",
    dot: "#CD8A5B",
  };
}

function timeLabel(iso: string): string {
  const startOf = (x: Date) => {
    const y = new Date(x);
    y.setHours(0, 0, 0, 0);
    return y;
  };
  const d = new Date(iso);
  const diff = Math.round(
    (startOf(new Date()).getTime() - startOf(d).getTime()) / 86_400_000,
  );
  const hm = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  let day: string;
  if (diff <= 0) day = "Heute";
  else if (diff === 1) day = "Gestern";
  else if (diff < 7)
    day = d.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");
  else day = d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  return `${day}, ${hm}`;
}

// Eintrags-Kachel nach Bento-Handoff: Modus-Zeile + Status-Badge, Titel, Snippet,
// Fuß mit Mood-Pille + Uhrzeit. Hover-Lift + grün getönter Rand.
export function JournalCard({ entry }: { entry: JournalEntry }) {
  const e = entry;
  const mode = modeInfo(e);
  const badge = statusBadge(e);
  const mood = moodInfo(e.mood);

  return (
    <Link to={`/eintrag/${e.id}`} className="block h-full">
      <div className="lift flex h-full flex-col rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-[20px_22px] shadow-[var(--shadow-card)] hover:border-[rgba(168,232,79,.5)] sm:p-[26px_28px]">
        {/* Modus + Status */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[13px] text-[var(--muted)]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: mode.dot }}
            />
            {mode.label}
          </span>
          <span
            className="rounded-full border px-[11px] py-[5px] text-[11.5px] font-semibold tracking-[0.04em]"
            style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
          >
            {e.crisisFlag ? "Schutzhinweis" : badge.label}
          </span>
        </div>

        {/* Titel + Snippet */}
        <h3 className="mb-[9px] text-[18px] font-[650] leading-[1.3] tracking-[-0.01em] text-[var(--foreground)]">
          {entryTitle(e)}
        </h3>
        <p className="mb-5 flex-1 text-[15px] leading-[1.6] text-[var(--muted)]">
          {entrySummaryText(e)}
        </p>

        {/* Fuß: Mood-Pille + Uhrzeit */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-[5px] text-[13px] font-semibold"
            style={{ background: mood.pillBg, color: mood.pillText }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: mood.dot }} />
            {mood.label}
          </span>
          <span className="text-[13px] text-[#9a917f]">{timeLabel(e.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
