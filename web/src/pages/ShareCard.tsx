import { Fragment, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntries } from "../hooks/useData";
import { entrySummaryText } from "../lib/entryCard";
import { DictationButton } from "../components/DictationButton";
import { DesktopModal } from "../components/DesktopModal";

// Zitat-Karte teilen: einen eigenen Satz als markenschöne Karte exportieren —
// ruhig, nie marktschreierisch. Format + Farbwelt wählbar, PNG-Export per
// Canvas (Web Share, sonst Download). Keine externen Abhängigkeiten.

type ThemeId = string; // mehrere Foto-Welten + Farbverläufe
type FormatId = "story" | "post" | "quer";

interface Theme {
  id: ThemeId;
  label: string;
  swatch: string;
  bg: [string, string]; // Verlauf (oben → unten); Fallback hinter dem Foto
  quote: string;
  eyebrow: string;
  accent: string;
  meta: string;
  divider: string;
  photo?: string; // Hintergrundbild (Claude Design: zitat-weg.webp)
  overlay?: [string, string]; // dunkles Overlay über dem Foto (Lesbarkeit)
}

// Master-Modell: die Karte zeigt IMMER dasselbe Foto (zitat-weg.webp); die
// Farbwelt wechselt nur das getönte Overlay + die Akzentfarbe. Quote/Meta bleiben
// hell (Foto ist dunkel getönt). Vier Welten: Tag · Abend · Natur · Klar.
const CARD_PHOTO = "/img/zitat-weg.webp";

function world(
  id: ThemeId,
  label: string,
  swatch: string,
  overlay: [string, string],
  accent: string,
  eyebrow: string,
): Theme {
  return {
    id,
    label,
    swatch,
    bg: ["#3a4a2c", "#23291a"],
    photo: CARD_PHOTO,
    overlay,
    quote: "#F8F5EE",
    eyebrow,
    accent,
    meta: "rgba(248,245,238,.78)",
    divider: "rgba(248,245,238,.6)",
  };
}

const THEMES: Theme[] = [
  world(
    "tag",
    "Tag",
    "linear-gradient(140deg,#F0C36B,#CD8A5B)",
    ["rgba(54,38,18,.30)", "rgba(40,26,10,.68)"],
    "#F0C36B",
    "rgba(248,238,222,.92)",
  ),
  world(
    "abend",
    "Abend",
    "linear-gradient(140deg,#CBBEF4,#9d8bc9)",
    ["rgba(42,33,62,.34)", "rgba(28,22,46,.70)"],
    "#CBBEF4",
    "rgba(238,234,248,.92)",
  ),
  world(
    "natur",
    "Natur",
    "linear-gradient(140deg,#8FB84B,#5b7d2a)",
    ["rgba(28,42,18,.30)", "rgba(20,30,12,.68)"],
    "#A8E84F",
    "rgba(240,244,230,.92)",
  ),
  world(
    "klar",
    "Klar",
    "linear-gradient(140deg,#3a4a2c,#23291a)",
    ["rgba(24,30,18,.34)", "rgba(12,16,9,.72)"],
    "#A8E84F",
    "#A8E84F",
  ),
];

// Quote in Wörter zerlegen; ein *mit Sternchen* markiertes Wort ist der Akzent.
interface QuoteWord {
  text: string;
  accent: boolean;
}
function quoteWords(quote: string): QuoteWord[] {
  return quote
    .trim()
    .split(/\s+/)
    .map((w) => {
      const accent = w.startsWith("*") && w.endsWith("*") && w.length > 2;
      return { text: w.replace(/^\*+|\*+$/g, ""), accent };
    });
}

const FORMATS: { id: FormatId; label: string; w: number; h: number; box: string }[] = [
  { id: "story", label: "Story", w: 1080, h: 1350, box: "w-5 h-[25px]" },
  { id: "post", label: "Post", w: 1080, h: 1080, box: "w-6 h-6" },
  { id: "quer", label: "Quer", w: 1920, h: 1080, box: "w-[26px] h-[18px]" },
];

function dateLabel(): string {
  return new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" });
}

// Bild-Cache fürs Canvas-Rendering (Hintergrundfotos der Karte).
const imgCache: Record<string, HTMLImageElement> = {};
function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imgCache[src];
  if (cached?.complete) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => {
      imgCache[src] = im;
      resolve(im);
    };
    im.onerror = reject;
    im.src = src;
  });
}

export function ShareCard() {
  const navigate = useNavigate();
  const entries = useEntries();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themeId, setThemeId] = useState<ThemeId>("tag");
  const [formatId, setFormatId] = useState<FormatId>("story");
  const [busy, setBusy] = useState(false);

  // Default-Satz: aus dem letzten Eintrag, sonst ruhiger Fallback mit Akzentwort.
  const defaultQuote = useMemo(() => {
    const latest = entries[0];
    const s = latest ? entrySummaryText(latest) : "";
    return s && s.length <= 140
      ? s
      : "Es darf heute *leicht* sein. Nicht alles auf einmal.";
  }, [entries]);
  const [quote, setQuote] = useState(defaultQuote);

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];

  async function drawCard(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Hintergrund: Foto (Claude Design) mit dunklem Overlay, sonst Verlauf.
    let drewPhoto = false;
    if (theme.photo) {
      try {
        const im = await loadImage(theme.photo);
        const ir = im.width / im.height;
        const cr = w / h;
        let sw: number, sh: number, sx: number, sy: number;
        if (ir > cr) {
          sh = im.height;
          sw = sh * cr;
          sx = (im.width - sw) / 2;
          sy = 0;
        } else {
          sw = im.width;
          sh = sw / cr;
          sx = 0;
          sy = (im.height - sh) * 0.6; // object-position center 60%
        }
        ctx.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
        const ov = ctx.createLinearGradient(0, 0, 0, h);
        ov.addColorStop(0, theme.overlay?.[0] ?? "rgba(18,15,9,.25)");
        ov.addColorStop(1, theme.overlay?.[1] ?? "rgba(18,15,9,.6)");
        ctx.fillStyle = ov;
        ctx.fillRect(0, 0, w, h);
        drewPhoto = true;
      } catch {
        // Fällt unten auf den Verlauf zurück.
      }
    }
    if (!drewPhoto) {
      const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
      g.addColorStop(0, theme.bg[0]);
      g.addColorStop(1, theme.bg[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

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

    // Zitat zeilenweise umbrechen (von unten her gesetzt); Akzentwort getrennt.
    ctx.font = font(quoteSize, 600);
    const spaceW = ctx.measureText(" ").width;
    const wordsArr = quoteWords(quote);
    const lines: QuoteWord[][] = [];
    let curLine: QuoteWord[] = [];
    let curW = 0;
    for (const wd of wordsArr) {
      const ww = ctx.measureText(wd.text).width;
      const add = curLine.length ? spaceW + ww : ww;
      if (curW + add > maxWidth && curLine.length) {
        lines.push(curLine);
        curLine = [wd];
        curW = ww;
      } else {
        curLine.push(wd);
        curW += add;
      }
    }
    if (curLine.length) lines.push(curLine);

    const metaY = h - pad;
    const dividerY = metaY - Math.round(h * 0.045);
    const quoteBottom = dividerY - Math.round(h * 0.04);
    let y = quoteBottom - lines.length * lineHeight;

    // Eyebrow.
    ctx.fillStyle = theme.eyebrow;
    ctx.font = font(Math.round(w * 0.026), 600);
    const eyebrow = "MEIN IMPULS FÜR HEUTE";
    ctx.fillText(eyebrow.split("").join(" "), pad, y - Math.round(h * 0.05));

    // Zitat, Wort für Wort (Akzentwort in Akzentfarbe + Newsreader-Italic).
    for (const ln of lines) {
      let x = pad;
      for (const wd of ln) {
        ctx.fillStyle = wd.accent ? theme.accent : theme.quote;
        ctx.font = wd.accent
          ? `italic 600 ${quoteSize}px Newsreader, Figtree, serif`
          : font(quoteSize, 600);
        ctx.fillText(wd.text, x, y);
        x += ctx.measureText(wd.text).width + spaceW;
      }
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
      await drawCard(ctx, format.w, format.h);
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
    <DesktopModal onClose={() => navigate("/")} maxWidth={620}>
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="serif text-3xl font-semibold">Als Karte teilen</h1>
          <p className="lead mt-2 text-[16px] text-[var(--foreground)]">
            Ein Satz von dir, als <em className="g">schöne</em> Karte.
          </p>
        </div>
        <button
          type="button"
          aria-label="Schließen"
          onClick={() => navigate("/")}
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {/* Vorschau */}
      <div
        className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-[22px] shadow-[0_18px_40px_rgba(35,34,26,.16)] [container-type:size]"
        style={{ aspectRatio: aspect, background: `linear-gradient(140deg, ${theme.bg[0]}, ${theme.bg[1]})` }}
      >
        {theme.photo && (
          <>
            <img
              src={theme.photo}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: "center 60%" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${theme.overlay?.[0] ?? "rgba(18,15,9,.25)"}, ${theme.overlay?.[1] ?? "rgba(18,15,9,.6)"})`,
              }}
            />
          </>
        )}
        <div className="relative flex h-full flex-col justify-between p-[7%]">
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
              {quote.split(/(\*[^*]+\*)/g).map((part, i) =>
                part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
                  <em key={i} className="g" style={{ color: theme.accent }}>
                    {part.slice(1, -1)}
                  </em>
                ) : (
                  <Fragment key={i}>{part}</Fragment>
                ),
              )}
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
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[12px] text-[#9a917f]">
            Ein Wort mit *Sternchen* wird hervorgehoben.
          </span>
          <DictationButton
            value={quote}
            onChange={(v) => setQuote(v.slice(0, 160))}
          />
        </div>
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
    </DesktopModal>
  );
}
