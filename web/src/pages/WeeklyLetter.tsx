import { Fragment, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WeeklyLetterResponse } from "@journal/shared";
import { useEntries, useSettings } from "../hooks/useData";
import { toDigest } from "../db/queries";
import { toPrefs } from "../lib/settings";
import { postWeeklyLetter } from "../lib/apiClient";

// *Wort* → behutsamer Newsreader-Italic-Akzent (Innerline-Signatur).
function withAccents(text: string, keyBase: string) {
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

function rangeLabel(days: number): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1));
  const f = (d: Date) => d.toLocaleDateString("de-DE", { day: "numeric", month: "short" }).replace(".", "");
  return `${f(start)}. – ${f(now)}.`;
}

// Wochen-Brief: warmer KI-Brief in Vronis Stimme statt Statistik-Wand.
export function WeeklyLetter() {
  const settings = useSettings();
  const entries = useEntries();
  const navigate = useNavigate();
  const days = 7;

  const [letter, setLetter] = useState<WeeklyLetterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const name = settings.userName?.trim();
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  const inRange = entries.filter((e) => e.createdAt >= start.toISOString());

  useEffect(() => {
    if (started.current || entries.length === 0) return;
    started.current = true;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  const noData = inRange.length === 0;

  async function generate() {
    // Ohne Einträge kein „Fehler", sondern der ruhige Leer-Hinweis (siehe unten).
    if (inRange.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await postWeeklyLetter({
        periodStart: start.toISOString(),
        periodEnd: now.toISOString(),
        digests: inRange.map(toDigest),
        prefs: toPrefs(settings),
      });
      setLetter(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  function speak() {
    if (!letter || typeof window === "undefined" || !window.speechSynthesis) return;
    const text = `${name ? `Liebe ${name}, ` : ""}${letter.body} ${letter.question}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="serif text-3xl font-semibold">Dein Wochen-Brief</h1>
        <p className="lead mt-2 text-[16px] text-[var(--foreground)]">
          Kein Statistik-Berg, sondern ein paar <em className="g">ehrliche</em> Zeilen.
        </p>
      </div>

      {loading && (
        <p className="text-[15px] text-[var(--muted)]">
          Ich lese deine Woche noch einmal in Ruhe durch …
        </p>
      )}

      {noData && !loading && !letter && (
        <div
          className="relative overflow-hidden rounded-[22px] border p-[22px] shadow-[0_16px_36px_rgba(120,86,52,.13)]"
          style={{
            borderColor: "rgba(205,138,91,.22)",
            background: "linear-gradient(160deg,#FBF4E8 0%,#F8F3EA 100%)",
          }}
        >
          <p className="text-[15.5px] leading-[1.6] text-[#4a4034]">
            Sobald ein paar Tage da sind, schreibe ich dir hier deinen{" "}
            <em className="g">Brief</em>.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="space-y-3">
          <p className="text-[15px] text-[var(--muted)]">{error}</p>
          {inRange.length > 0 && (
            <button
              type="button"
              onClick={() => generate()}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-contrast)]"
            >
              Nochmal versuchen
            </button>
          )}
        </div>
      )}

      {letter && !loading && (
        <>
          <div
            className="relative overflow-hidden rounded-[22px] border p-[22px_22px] shadow-[0_16px_36px_rgba(120,86,52,.13)]"
            style={{
              borderColor: "rgba(205,138,91,.22)",
              background: "linear-gradient(160deg,#FBF4E8 0%,#F8F3EA 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute -right-6 -top-10 h-[150px] w-[150px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(224,170,80,.24), transparent 68%)",
                filter: "blur(28px)",
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9c6b3f]">
                Woche · {rangeLabel(days)}
              </div>
              <p className="mb-3.5 text-[17px] leading-[1.6] text-[#3a2e22]">
                {name ? `Liebe ${name},` : "Hallo,"}
              </p>
              {letter.body.split(/\n\n+/).map((para, i) => (
                <p key={i} className="mb-3.5 text-[15.5px] leading-[1.65] text-[#4a4034]">
                  {withAccents(para, `p${i}`)}
                </p>
              ))}
              {letter.question && (
                <div
                  className="mt-1 rounded-[14px] border p-[15px_16px]"
                  style={{
                    background: "rgba(255,255,255,.6)",
                    borderColor: "rgba(205,138,91,.2)",
                  }}
                >
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9c6b3f]">
                    Eine Frage für nächste Woche
                  </div>
                  <p className="lead text-[15.5px] leading-[1.5] text-[var(--foreground)]">
                    {withAccents(letter.question, "q")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() =>
                navigate(`/neu?prompt=${encodeURIComponent(letter.question || "")}`)
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-[13px] text-[15px] font-semibold text-[var(--accent-contrast)] shadow-[0_6px_16px_rgba(110,155,44,.3)]"
              style={{ background: "linear-gradient(180deg,#B4ED63,#A8E84F)" }}
            >
              Darauf antworten
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M8 3v10M3 8h10" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Vorlesen"
              onClick={speak}
              className="flex w-12 flex-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M11 5 6 9H3v6h3l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12" />
              </svg>
            </button>
          </div>
        </>
      )}
    </section>
  );
}
