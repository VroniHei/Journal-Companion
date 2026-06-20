import { useEffect, useState } from "react";
import { Button, ToolCard } from "../components/ui";
import { useDailyRitual } from "../hooks/useData";
import { dayKey, upsertDailyRitual } from "../db/queries";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";

function isMorning(): boolean {
  return new Date().getHours() < 14;
}

function Badge({ tone }: { tone: "morning" | "evening" }) {
  const morning = tone === "morning";
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
      style={{
        background: morning ? "rgba(221,177,75,0.22)" : "rgba(155,163,131,0.24)",
        color: morning ? "#a9791c" : "#566042",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {morning ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
          </>
        ) : (
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </span>
  );
}

function Section({
  title,
  hint,
  active,
  tone,
  children,
}: {
  title: string;
  hint: string;
  active: boolean;
  tone: "morning" | "evening";
  children: React.ReactNode;
}) {
  return (
    <ToolCard className="space-y-4">
      <div className="flex items-start gap-3">
        <Badge tone={tone} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="serif text-xl font-semibold">{title}</h2>
            {active && (
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-text)]">
                Jetzt dran
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>
        </div>
      </div>
      {children}
    </ToolCard>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}

export function Ritual() {
  const date = dayKey();
  const ritual = useDailyRitual(date);
  const morning = isMorning();

  const [gratitude, setGratitude] = useState(["", "", ""]);
  const [makeGreat, setMakeGreat] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [goodDeed, setGoodDeed] = useState("");
  const [better, setBetter] = useState("");
  const [moments, setMoments] = useState(["", "", ""]);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);

  // Einmalig aus dem gespeicherten Tag befüllen, sobald geladen.
  useEffect(() => {
    if (ritual && !hydrated) {
      const g = ritual.gratitude ?? [];
      const m = ritual.goodMoments ?? [];
      setGratitude([g[0] ?? "", g[1] ?? "", g[2] ?? ""]);
      setMakeGreat(ritual.makeGreat ?? "");
      setAffirmation(ritual.affirmation ?? "");
      setGoodDeed(ritual.goodDeed ?? "");
      setBetter(ritual.better ?? "");
      setMoments([m[0] ?? "", m[1] ?? "", m[2] ?? ""]);
      setHydrated(true);
    }
  }, [ritual, hydrated]);

  function commit() {
    void upsertDailyRitual(date, {
      gratitude: gratitude.map((s) => s.trim()).filter(Boolean),
      makeGreat: makeGreat.trim() || undefined,
      affirmation: affirmation.trim() || undefined,
      goodDeed: goodDeed.trim() || undefined,
      better: better.trim() || undefined,
      goodMoments: moments.map((s) => s.trim()).filter(Boolean),
    });
    setSaved(true);
  }

  function setAt(
    arr: string[],
    set: (v: string[]) => void,
    i: number,
    v: string,
  ) {
    const next = [...arr];
    next[i] = v;
    set(next);
    setSaved(false);
  }

  const dateLabel = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const morningCard = (
    <Section
      title="Guten Morgen"
      hint="Drei Minuten, um den Tag bewusst zu beginnen."
      active={morning}
      tone="morning"
    >
      <Field label="Wofür bist du dankbar? (bis zu 3)">
        <div className="space-y-2">
          {gratitude.map((v, i) => (
            <input
              key={i}
              value={v}
              onChange={(e) => setAt(gratitude, setGratitude, i, e.target.value)}
              onBlur={commit}
              placeholder={`Dankbar für …`}
              className={inputClass}
            />
          ))}
        </div>
      </Field>
      <Field label="Was würde den heutigen Tag gut machen?">
        <input
          value={makeGreat}
          onChange={(e) => setMakeGreat(e.target.value)}
          onBlur={commit}
          placeholder="Eine Sache, auf die du dich ausrichtest …"
          className={inputClass}
        />
      </Field>
      <Field label="Ein guter Satz für dich heute">
        <input
          value={affirmation}
          onChange={(e) => setAffirmation(e.target.value)}
          onBlur={commit}
          placeholder="Ich bin …"
          className={inputClass}
        />
      </Field>
    </Section>
  );

  const eveningCard = (
    <Section
      title="Guten Abend"
      hint="Drei Minuten, um den Tag wertschätzend abzuschließen."
      active={!morning}
      tone="evening"
    >
      <Field label="Was hast du heute Gutes getan?">
        <input
          value={goodDeed}
          onChange={(e) => setGoodDeed(e.target.value)}
          onBlur={commit}
          placeholder="Für jemanden – oder für dich selbst …"
          className={inputClass}
        />
      </Field>
      <Field label="Was wäre heute noch besser gegangen?">
        <input
          value={better}
          onChange={(e) => setBetter(e.target.value)}
          onBlur={commit}
          placeholder="Ohne Härte – einfach ein Lernen …"
          className={inputClass}
        />
      </Field>
      <Field label="Schöne Momente heute (bis zu 3)">
        <div className="space-y-2">
          {moments.map((v, i) => (
            <input
              key={i}
              value={v}
              onChange={(e) => setAt(moments, setMoments, i, e.target.value)}
              onBlur={commit}
              placeholder="Etwas Schönes, das du erlebt hast …"
              className={inputClass}
            />
          ))}
        </div>
      </Field>
    </Section>
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="serif text-3xl font-semibold">Tagesritual</h1>
        <p className="mt-1 text-[var(--muted)]">
          {dateLabel} · Ein kleines Ritual für den Tag. Kein Muss. Fülle aus, was
          dir gerade leicht fällt, und sichere es mit „Speichern".
        </p>
      </div>

      {/* Tageszeit-abhängige Reihenfolge: das Relevante zuerst. */}
      {morning ? (
        <>
          {morningCard}
          {eveningCard}
        </>
      ) : (
        <>
          {eveningCard}
          {morningCard}
        </>
      )}

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={commit}>Speichern</Button>
          {saved && (
            <span className="text-sm text-[var(--muted)]">Gespeichert ✓</span>
          )}
        </div>
        <p className="text-xs text-[var(--muted)]">
          Deine Eingaben werden auch automatisch gesichert, sobald du ein Feld
          verlässt.
        </p>
      </div>
    </section>
  );
}
