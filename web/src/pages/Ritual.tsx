import { useEffect, useState } from "react";
import { Button, Card } from "../components/ui";
import { useDailyRitual } from "../hooks/useData";
import { dayKey, upsertDailyRitual } from "../db/queries";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";

function isMorning(): boolean {
  return new Date().getHours() < 14;
}

function Section({
  title,
  hint,
  active,
  children,
}: {
  title: string;
  hint: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="serif text-xl font-semibold">{title}</h2>
          {active && (
            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-text)]">
              Jetzt dran
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>
      </div>
      {children}
    </Card>
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
