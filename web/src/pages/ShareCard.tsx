import { useMemo, useRef, useState } from "react";
import { useEntries } from "../hooks/useData";
import { entrySummaryText } from "../lib/entryCard";

// Zitat-Karte teilen: einen eigenen Satz als markenschöne Karte exportieren —
// ruhig, nie marktschreierisch. Format + Farbwelt wählbar, PNG-Export per
// Canvas (Web Share, sonst Download). Keine externen Abhängigkeiten.

type ThemeId = "tag" | "abend" | "natur" | "klar";
type FormatId = "story" | "post" | "quer";

interface Theme {
  id: ThemeId;
  label: string;
  swatch: string;
  bg: [string, string]; // Verlauf (oben → unten)
  quote: string;
  eyebrow: string;
  accent: string;
  meta: string;
  divider: string;
}

const THEMES: Theme[] = [
  {
    id: "tag",
    label: "Tag",
    swatch: "linear-gradient(140deg,#F0C36B,#CD8A5B)",
    bg: ["#F0C36B", "#CD8A5B"],
    quote: "#3a2a18",
    eyebrow: "#7a4f29",
    accent: "#6E4A23",
    meta: "rgba(58,42,24,.7)",
    divider: "rgba(58,42,24,.4)",
  },
  {
    id: "abend",
    label: "Abend",
    swatch: "linear-gradient(140deg,#CBBEF4,#9d8bc9)",
    bg: ["#CBBEF4", "#9d8bc9"],
    quote: "#2c2440",
    eyebrow: "#5b4c80",
    accent: "#4a3c70",
    meta: "rgba(44,36,64,.7)",
    divider: "rgba(44,36,64,.4)",
  },
  {
    id: "natur",
    label: "Natur",
    swatch: "linear-gradient(140deg,#8FB84B,#5b7d2a)",
    bg: ["#8FB84B", "#5b7d2a"],
    quote: "#ffffff",
    eyebrow: "rgba(255,255,255,.85)",
    accent: "#EBFFC6",
    meta: "rgba(255,255,255,.8)",
    divider: "rgba(255,255,255,.6)",
  },
  {
    id: "klar",
    label: "Klar",
    swatch: "linear-gradient(140deg,#3a4a2c,#23291a)",
    bg: ["#3a4a2c", "#23291a"],
    quote: "#F8F5EE",
    eyebrow: "#A8E84F",
    accent: "#A8E84F",
    meta: "rgba(248,245,238,.72)",
    divider: "rgba(248,245,238,.5)",
  },
];

const FORMATS: { id: FormatId; label: string; w: number; h: number; box: string }[] = [
  { id: "story", label: "Story", w: 1080, h: 1350, box: "w-5 h-[25px]" },
  { id: "post", label: "Post", w: 1080, h: 1080, box: "w-6 h-6" },
  { id: "quer", label: "Quer", w: 1920, h: 1080, box: "w-[26px] h-[18px]" },
];

function dateLabel(): string {
  return new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" });
}

export function ShareCard() {
  const entries = useEntries();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themeId, setThemeId] = useState<ThemeId>("tag");
  const [formatId, setFormatId] = useState<FormatId>("story");
  const [busy, setBusy] = useState(false);

  // Default-Satz: aus dem letzten Eintrag, sonst ruhiger Fallback.
  const defaultQuote = useMemo(() => {
    const latest = entries[0];
    const s = latest ? entrySummaryText(latest) : "";
    return s && s.length <= 140 ? s : "Es darf heute leicht sein. Nicht alles auf einmal.";
  }, [entries]);
  const [quote, setQuote] = useState(defaultQuote);

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];

  function drawCard(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
    g.addColorStop(0, theme.bg[0]);
    g.addColorStop(1, theme.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const pad = Math.round(w * 0.085);
    const font = (size: number, weight: number) =>
      `${weight} ${size}px Figtree, system-ui, sans-serif`;

    // Wortmarke oben links.
    ctx.fillStyle = theme.quote;
    ctx.font = font(Math.round(w * 0.03), 700);
    ctx.textBaseline = "top";
    ctx.fillText("innerline", pad, pad);

    // Eyebrow (über dem Zitat).
    const quoteSize = formatId === "quer" ? Math.round(h * 0.072) : Math.round(w * 0.066);
    const lineHeight = Math.round(quoteSize * 1.26);
    const maxWidth = w - pad * 2;

    // Zitat zeilenweise umbrechen (von unten her gesetzt).
    ctx.font = font(quoteSize, 600);
    const words = quote.trim().split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = word;
      } else cur = test;
    }
    if (cur) lines.push(cur);

    const metaY = h - pad;
    const dividerY = metaY - Math.round(h * 0.045);
    const quoteBottom = dividerY - Math.round(h * 0.04);
    let y = quoteBottom - lines.length * lineHeight;

    // Eyebrow.
    ctx.fillStyle = theme.eyebrow;
    ctx.font = font(Math.round(w * 0.026), 600);
    const eyebrow = "MEIN IMPULS FÜR HEUTE";
    ctx.fillText(eyebrow.split("").join(" "), pad, y - Math.round(h * 0.05));

    // Zitat.
    ctx.fillStyle = theme.quote;
    ctx.font = font(quoteSize, 600);
    for (const ln of lines) {
      ctx.fillText(ln, pad, y);
      y += lineHeight;
    }

    // Divider + Meta.
    ctx.strokeStyle = theme.divider;
    ctx.lineWidth = Math.max(2, Math.round(w * 0.002));
    ctx.beginPath();
    ctx.moveTo(pad, dividerY);
    ctx.lineTo(pad + Math.round(w * 0.07), dividerY);
    ctx.stroke();
    ctx.fillStyle = theme.meta;
    ctx.font = font(Math.round(w * 0.028), 500);
    ctx.textBaseline = "bottom";
    ctx.fillText(`aus meinem Tagebuch · ${dateLabel()}`, pad + Math.round(w * 0.09), dividerY + Math.round(h * 0.006));
  }

  async function exportCard(share: boolean) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    try {
      canvas.width = format.w;
      canvas.height = format.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawCard(ctx, format.w, format.h);
      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob((b) => res(b), "image/png", 0.95),
      );
      if (!blob) return;
      const file = new File([blob], "innerline-impuls.png", { type: "image/png" });

      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
      };
      if (share && nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: quote });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "innerline-impuls.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setBusy(false);
    }
  }

  // Live-Vorschau (DOM) — entspricht dem Canvas-Export.
  const aspect = `${format.w} / ${format.h}`;
  const quoteSizeCss = formatId === "quer" ? "5.5cqh" : "6.6cqw";

  return (
    <section className="space-y-5">
      <div>
        <h1 className="serif text-3xl font-semibold">Als Karte teilen</h1>
        <p className="lead mt-2 text-[16px] text-[var(--foreground)]">
          Ein Satz von dir, als <em className="g">schöne</em> Karte.
        </p>
      </div>

      {/* Vorschau */}
      <div
        className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[22px] shadow-[0_18px_40px_rgba(35,34,26,.16)] [container-type:size]"
        style={{ aspectRatio: aspect, background: `linear-gradient(140deg, ${theme.bg[0]}, ${theme.bg[1]})` }}
      >
        <div className="flex h-full flex-col justify-between p-[7%]">
          <span className="text-[3cqw] font-bold" style={{ color: theme.quote }}>
            innerline
          </span>
          <div>
            <div
              className="mb-[3%] inline-flex items-center gap-1.5 text-[2.6cqw] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.eyebrow }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.eyebrow }} />
              Mein Impuls für heute
            </div>
            <p
              className="font-semibold leading-[1.26] tracking-[-0.015em]"
              style={{ color: theme.quote, fontSize: quoteSizeCss }}
            >
              {quote}
            </p>
            <div className="mt-[3.5%] flex items-center gap-2.5">
              <span className="h-px w-[7%]" style={{ background: theme.divider }} />
              <span className="text-[2.8cqw] font-medium" style={{ color: theme.meta }}>
                aus meinem Tagebuch · {dateLabel()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Satz bearbeiten */}
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a917f]">
          Dein Satz
        </label>
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value.slice(0, 160))}
          rows={2}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-[15px] leading-[1.5] outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Format */}
      <div>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a917f]">
          Format
        </div>
        <div className="flex gap-[9px]">
          {FORMATS.map((f) => {
            const active = f.id === formatId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormatId(f.id)}
                className="flex flex-1 flex-col items-center gap-2 rounded-[14px] border py-3.5 transition"
                style={{
                  borderColor: active ? "#A8E84F" : "var(--border)",
                  borderWidth: active ? 1.5 : 1,
                  boxShadow: active ? "0 4px 14px rgba(110,155,44,.12)" : "none",
                }}
              >
                <span className={`rounded-[4px] border border-[rgba(35,34,26,.16)] bg-[var(--sand)] ${f.box}`} />
                <span
                  className="text-[12px]"
                  style={{
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--foreground)" : "var(--muted)",
                  }}
                >
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Farbwelt */}
      <div>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a917f]">
          Farbwelt
        </div>
        <div className="flex gap-3.5">
          {THEMES.map((t) => {
            const active = t.id === themeId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                className="flex flex-col items-center gap-[7px]"
              >
                <span
                  className="h-[38px] w-[38px] rounded-full"
                  style={{
                    background: t.swatch,
                    boxShadow: active
                      ? "0 0 0 2px var(--surface), 0 0 0 4px #A8E84F"
                      : "0 2px 8px rgba(35,34,26,.12)",
                  }}
                />
                <span className="text-[11px] font-medium text-[var(--muted)]">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aktionen */}
      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => exportCard(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-[14px] text-[15px] font-semibold text-[var(--accent-contrast)] shadow-[0_6px_16px_rgba(110,155,44,.3)] disabled:opacity-60"
          style={{ background: "linear-gradient(180deg,#B4ED63,#A8E84F)" }}
        >
          Teilen
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M12 16V3M7 8l5-5 5 5" />
          </svg>
        </button>
        <button
          type="button"
          disabled={busy}
          aria-label="Bild speichern"
          onClick={() => exportCard(false)}
          className="flex w-[50px] flex-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
            <path d="M8 4v5h7M8 14h8" />
          </svg>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </section>
  );
}
