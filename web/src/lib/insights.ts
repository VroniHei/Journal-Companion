// Persönliche Auswertungen fürs Dashboard. Rein lokal aus den Dexie-Einträgen
// berechnet — ruhig, wertschätzend, ohne Bewertung. Inspiriert von Mustererkennung
// in Mood-Trackern (Daylio u.a.), aber bewusst nicht-klinisch.
import type { Decision, JournalEntry, OpenLoop } from "@journal/shared";

const DAY = 86_400_000;

function dkey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// Tagesritual-Einträge sind keine echten Stimmungs-Einträge und werden aus den
// Mood-Auswertungen herausgefiltert (zählen aber in die Serie/Listen mit).
function isMoodEntry(e: JournalEntry): boolean {
  return e.startIntent !== "tagesritual";
}

/** Aufeinanderfolgende Tage mit mindestens einem Eintrag (heute oder gestern als Start). */
export function computeStreak(entries: JournalEntry[]): number {
  if (!entries.length) return 0;
  const days = new Set(entries.map((e) => dkey(new Date(e.createdAt))));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dkey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dkey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dkey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface RecentStats {
  count: number;
  avgMood: number | null;
  avgIntensity: number | null;
}

/** Kennzahlen der letzten `days` Tage. */
export function recentStats(entries: JournalEntry[], days = 7): RecentStats {
  const since = Date.now() - days * DAY;
  const recent = entries.filter(
    (e) => isMoodEntry(e) && new Date(e.createdAt).getTime() >= since,
  );
  return {
    count: recent.length,
    avgMood: avg(recent.map((e) => e.mood)),
    avgIntensity: avg(recent.map((e) => e.intensity)),
  };
}

function moodLevel(m: number): number {
  if (m <= 3.5) return 0;
  if (m <= 5.5) return 1;
  if (m <= 7.5) return 2;
  return 3;
}

export interface MoodDay {
  day: string; // Wochentags-Kürzel
  level: number | null; // 0..3, null = kein Eintrag (für die Punkt-Visualisierung)
  value: number | null; // Tages-Durchschnitt 1..10 (für die Verlaufslinie)
}

/** Stimmung der letzten `days` Tage als Tageswerte (Punkte + Verlauf). */
export function moodByDay(entries: JournalEntry[], days = 7): MoodDay[] {
  const out: MoodDay[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = dkey(d);
    const dayMoods = entries
      .filter((e) => isMoodEntry(e) && dkey(new Date(e.createdAt)) === key)
      .map((e) => e.mood);
    const m = avg(dayMoods);
    out.push({
      day: d.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""),
      level: m === null ? null : moodLevel(m),
      value: m,
    });
  }
  return out;
}

/** Letzte `n` Stimmungswerte in chronologischer Reihenfolge (alt → neu). */
export function moodSeries(entries: JournalEntry[], n = 14): number[] {
  return [...entries]
    .filter(isMoodEntry)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-n)
    .map((e) => e.mood);
}

function moodOn(entries: JournalEntry[], pick: (e: JournalEntry) => boolean) {
  return avg(entries.filter(pick).map((e) => e.mood));
}

const WEEKDAYS = [
  "sonntags",
  "montags",
  "dienstags",
  "mittwochs",
  "donnerstags",
  "freitags",
  "samstags",
];

/**
 * Sanfte, persönliche Beobachtungen (max. 3). Spiegeln Muster, ohne Ratschläge
 * zu geben oder zu werten. Nur, wenn genug Daten da sind.
 */
export function buildInsights(entries: JournalEntry[]): string[] {
  const out: string[] = [];
  if (entries.length < 2) return out;

  // 1) Bewegung & Stimmung
  const moveYes = moodOn(entries, (e) => e.movementToday === true);
  const moveNo = moodOn(entries, (e) => e.movementToday === false);
  const moveYesN = entries.filter((e) => e.movementToday === true).length;
  const moveNoN = entries.filter((e) => e.movementToday === false).length;
  if (moveYes !== null && moveNo !== null && moveYesN >= 2 && moveNoN >= 2) {
    const diff = Math.round((moveYes - moveNo) * 10) / 10;
    if (diff >= 0.8) {
      out.push(
        `An Tagen mit Bewegung liegt deine Stimmung im Schnitt um ${diff} höher.`,
      );
    }
  }

  // 2) Draußen & Stimmung (nur wenn Bewegung nichts ergab, um Redundanz zu vermeiden)
  if (out.length === 0) {
    const outYes = moodOn(entries, (e) => e.outsideToday === true);
    const outNo = moodOn(entries, (e) => e.outsideToday === false);
    const oYesN = entries.filter((e) => e.outsideToday === true).length;
    const oNoN = entries.filter((e) => e.outsideToday === false).length;
    if (outYes !== null && outNo !== null && oYesN >= 2 && oNoN >= 2) {
      const diff = Math.round((outYes - outNo) * 10) / 10;
      if (diff >= 0.8) {
        out.push(
          `An Tagen draußen ist deine Stimmung im Schnitt um ${diff} leichter.`,
        );
      }
    }
  }

  // 3) Stimmungs-Trend: letzte 7 Tage vs. die 7 Tage davor
  const now = Date.now();
  const thisWeek = entries.filter(
    (e) => new Date(e.createdAt).getTime() >= now - 7 * DAY,
  );
  const lastWeek = entries.filter((e) => {
    const t = new Date(e.createdAt).getTime();
    return t < now - 7 * DAY && t >= now - 14 * DAY;
  });
  const aThis = avg(thisWeek.map((e) => e.mood));
  const aLast = avg(lastWeek.map((e) => e.mood));
  if (aThis !== null && aLast !== null && thisWeek.length >= 2 && lastWeek.length >= 2) {
    const diff = Math.round((aThis - aLast) * 10) / 10;
    if (diff >= 0.5) {
      out.push(`Diese Woche war deine Stimmung etwas leichter als letzte (+${diff}).`);
    } else if (diff <= -0.5) {
      out.push(
        `Diese Woche war deine Stimmung etwas schwerer als letzte (${diff}). Das darf sein.`,
      );
    }
  }

  // 4) Bester Wochentag (genug Streuung vorausgesetzt)
  if (out.length < 3) {
    const byDay = new Map<number, number[]>();
    for (const e of entries) {
      const wd = new Date(e.createdAt).getDay();
      const arr = byDay.get(wd) ?? [];
      arr.push(e.mood);
      byDay.set(wd, arr);
    }
    let best: { wd: number; m: number } | null = null;
    for (const [wd, moods] of byDay) {
      if (moods.length < 2) continue;
      const m = avg(moods);
      if (m === null) continue;
      if (!best || m > best.m) best = { wd, m };
    }
    if (best && byDay.size >= 3) {
      out.push(`${capitalize(WEEKDAYS[best.wd])} ist deine Stimmung im Schnitt am höchsten.`);
    }
  }

  // 5) Häufigstes Thema als Spiegel
  if (out.length < 3) {
    const counts = new Map<string, number>();
    for (const e of entries) for (const t of e.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) {
      out.push(`„${top[0]}" beschäftigt dich zurzeit besonders (${top[1]} Einträge).`);
    }
  }

  // 6) Häufigste Emotion als sanfter Spiegel
  if (out.length < 3) {
    const counts = new Map<string, number>();
    for (const e of entries)
      for (const em of e.emotions) counts.set(em, (counts.get(em) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) {
      out.push(`„${top[0]}" taucht zuletzt am häufigsten auf (${top[1]}-mal).`);
    }
  }

  // 7) Sanfter Fallback, damit die Karte mit etwas Datenlage nie leer bleibt.
  if (out.length === 0) {
    const m = avg(entries.map((e) => e.mood));
    if (m !== null) {
      out.push(`Deine Stimmung lag in den letzten Einträgen im Schnitt bei ${m}/10.`);
    }
  }

  return out.slice(0, 3);
}

export interface WordCount {
  word: string;
  count: number;
}

/** „Worte der Woche": häufigste Themen/Gefühle/Bedürfnisse im Zeitraum. */
export function wordsOfWeek(entries: JournalEntry[], max = 7): WordCount[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const w of [...e.topics, ...e.emotions, ...e.needs]) {
      const t = w.trim();
      if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word, count]) => ({ word, count }));
}

export interface Step {
  id: string;
  label: string;
  at: string; // ISO
}

/**
 * „Stabile Schritte" direkt aus vorhandenen Daten abgeleitet (nicht aus einem
 * separaten Aktions-Log) — so ist die Karte sofort gefüllt: reflektierte
 * Einträge, geklärte Schleifen, angeschaute Entscheidungen.
 */
export function recentSteps(
  entries: JournalEntry[],
  openLoops: OpenLoop[] = [],
  decisions: Decision[] = [],
): Step[] {
  const steps: Step[] = [];
  for (const e of entries) {
    if (e.aiReflection) {
      steps.push({
        id: `r-${e.id}`,
        label: "Eintrag reflektiert und sortiert",
        at: e.updatedAt ?? e.createdAt,
      });
    }
  }
  for (const l of openLoops) {
    if (l.status === "geklärt") {
      steps.push({
        id: `l-${l.id}`,
        label: "Offene Schleife geklärt",
        at: l.resolvedAt ?? l.updatedAt,
      });
    }
  }
  for (const d of decisions) {
    if (d.status === "reflektiert") {
      steps.push({
        id: `d-${d.id}`,
        label: "Entscheidung im Rückblick angeschaut",
        at: d.reviewedAt ?? d.updatedAt,
      });
    }
  }
  return steps.sort((a, b) => b.at.localeCompare(a.at));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface ThemeCluster {
  id: string;
  title: string;
  count: number;
  /** Mood-Farbe nach Durchschnittsstimmung (clay→gold→sage→grün). */
  color: string;
  /** Ruhiger Satz, was das Thema gerade macht (Trend). */
  note: string;
  /** Zeit-Chips: seit-wann + letztes Auftauchen. */
  tags: string[];
  firstAt: string;
  lastAt: string;
}

// Mood-Skala (App-Style §3): clay (schwer) → gold → sage → grün (leicht).
function moodHue(m: number): string {
  if (m <= 3.5) return "#CD8A5B";
  if (m <= 5.5) return "#DDB14B";
  if (m <= 7.5) return "#9BA383";
  return "#A8E84F";
}

function sinceLabel(firstAt: string): string {
  const weeks = Math.floor((Date.now() - new Date(firstAt).getTime()) / (7 * DAY));
  if (weeks <= 0) return "diese Woche";
  if (weeks === 1) return "seit 1 Woche";
  return `seit ${weeks} Wochen`;
}

function lastLabel(lastAt: string): string {
  const d = new Date(lastAt);
  const days = Math.floor((Date.now() - d.getTime()) / DAY);
  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
}

/**
 * „Roter Faden" (Markenkern): wiederkehrende Themen über die letzten Wochen —
 * nicht nur Wörter, sondern was sich durchzieht. Aus den `topics` der Einträge
 * geclustert: Häufigkeit, Stimmungs-Trend (wird es leichter?), Zeitraum.
 */
export function themeClusters(
  entries: JournalEntry[],
  opts: { weeks?: number; min?: number; max?: number } = {},
): ThemeCluster[] {
  const { weeks = 6, min = 2, max = 6 } = opts;
  const cutoff = Date.now() - weeks * 7 * DAY;
  const within = entries.filter((e) => new Date(e.createdAt).getTime() >= cutoff);

  type Acc = { dates: string[]; moods: number[] };
  const map = new Map<string, Acc>();
  for (const e of within) {
    for (const raw of e.topics) {
      const topic = raw.trim();
      if (!topic) continue;
      const key = topic.toLowerCase();
      const acc = map.get(key) ?? { dates: [], moods: [] };
      acc.dates.push(e.createdAt);
      acc.moods.push(e.mood);
      if (!map.has(key)) map.set(key, acc);
    }
  }

  const clusters: ThemeCluster[] = [];
  for (const [key, acc] of map) {
    if (acc.dates.length < min) continue;
    const sorted = [...acc.dates].sort();
    const firstAt = sorted[0];
    const lastAt = sorted[sorted.length - 1];
    const meanMood = avg(acc.moods) ?? 5;

    // Trend: Stimmung in der ersten vs. zweiten Hälfte der Treffer.
    const half = Math.floor(acc.moods.length / 2);
    const early = avg(acc.moods.slice(0, half || 1));
    const late = avg(acc.moods.slice(half));
    let note = "Taucht immer wieder auf.";
    if (early != null && late != null) {
      if (late - early >= 0.8) note = "Zuletzt klingst du dabei <em class=\"g\">leichter</em>.";
      else if (early - late >= 0.8) note = "Liegt dir gerade <em class=\"g\">schwerer</em> als zuvor.";
      else note = "Zieht sich <em class=\"g\">ruhig</em> durch.";
    }

    clusters.push({
      id: key,
      title: capitalize(key),
      count: acc.dates.length,
      color: moodHue(meanMood),
      note,
      tags: [sinceLabel(firstAt), lastLabel(lastAt)],
      firstAt,
      lastAt,
    });
  }

  return clusters.sort((a, b) => b.count - a.count).slice(0, max);
}

// ===== Verlauf („Wie habe ich mich verändert?") ==============================

export type TrendRange = 1 | 6 | 12; // Monate

export interface TrendBucket {
  label: string;
  value: number | null; // Ø Stimmung 1..10 im Bucket
}

const MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

/**
 * Stimmungs-Verlauf über einen Zeitraum, in gleichmäßige Buckets gelegt:
 * 1 Monat → Wochen-Buckets, 6/12 Monate → Monats-Buckets.
 */
export function moodTrend(entries: JournalEntry[], months: TrendRange): TrendBucket[] {
  const now = new Date();
  const buckets: { label: string; from: number; to: number }[] = [];

  if (months === 1) {
    // 6 Buckets à 5 Tage über die letzten 30 Tage.
    for (let i = 5; i >= 0; i--) {
      const to = now.getTime() - i * 5 * DAY;
      const from = to - 5 * DAY;
      const d = new Date(to);
      buckets.push({ label: `${d.getDate()}.`, from, to });
    }
  } else {
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({
        label: MONTHS_SHORT[start.getMonth()],
        from: start.getTime(),
        to: end.getTime(),
      });
    }
  }

  return buckets.map((b) => {
    const moods = entries
      .filter((e) => {
        const t = new Date(e.createdAt).getTime();
        return t >= b.from && t < b.to;
      })
      .map((e) => e.mood);
    return { label: b.label, value: avg(moods) };
  });
}

export interface ThemeShift {
  word: string;
  direction: "up" | "down";
  from: number; // Treffer pro Monat in der ersten Hälfte
  to: number; // Treffer pro Monat in der zweiten Hälfte
}

/**
 * Was sich verschoben hat: Themen/Gefühle, die in der zweiten Hälfte des
 * Zeitraums deutlich häufiger oder seltener auftauchen (pro Monat normiert).
 */
export function themeShifts(
  entries: JournalEntry[],
  months: TrendRange,
  max = 4,
): ThemeShift[] {
  const now = Date.now();
  const spanMs = months * 30 * DAY;
  const start = now - spanMs;
  const mid = now - spanMs / 2;
  const within = entries.filter((e) => new Date(e.createdAt).getTime() >= start);

  const first = new Map<string, number>();
  const second = new Map<string, number>();
  for (const e of within) {
    const t = new Date(e.createdAt).getTime();
    const bag = t < mid ? first : second;
    for (const w of [...e.topics, ...e.emotions, ...e.needs]) {
      const k = w.trim();
      if (k) bag.set(k, (bag.get(k) ?? 0) + 1);
    }
  }

  const halfMonths = months / 2;
  const words = new Set([...first.keys(), ...second.keys()]);
  const shifts: ThemeShift[] = [];
  for (const w of words) {
    const from = Math.round(((first.get(w) ?? 0) / halfMonths) * 10) / 10;
    const to = Math.round(((second.get(w) ?? 0) / halfMonths) * 10) / 10;
    if (Math.abs(to - from) < 1) continue; // nur deutliche Verschiebungen
    shifts.push({ word: capitalize(w), direction: to >= from ? "up" : "down", from, to });
  }

  return shifts
    .sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from))
    .slice(0, max);
}

export interface TrendStory {
  range: string; // z. B. „Januar – Juni"
  lead: string; // Lead mit <em class="g">…</em>
  conclusion: string;
}

/** Erzählende Zusammenfassung des Verlaufs (ruhig, ohne Bewertung). */
export function trendStory(entries: JournalEntry[], months: TrendRange): TrendStory {
  const buckets = moodTrend(entries, months).filter((b) => b.value != null);
  const now = new Date();
  const startD = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const range =
    months === 1
      ? "Letzter Monat"
      : `${startD.toLocaleDateString("de-DE", { month: "long" })} – ${now.toLocaleDateString("de-DE", { month: "long" })}`;

  if (buckets.length < 2) {
    return {
      range,
      lead: 'Noch zu wenig, um einen Verlauf zu zeichnen. Schreib weiter, dann zeigt sich, <em class="g">wohin</em> es geht.',
      conclusion: "Auch das ist Fortschritt: Du fängst an, hinzuschauen.",
    };
  }

  const first = buckets[0].value as number;
  const last = buckets[buckets.length - 1].value as number;
  const delta = last - first;
  let lead: string;
  if (delta >= 0.8) lead = 'Über den Zeitraum bist du spürbar <em class="g">ruhiger</em> geworden.';
  else if (delta <= -0.8) lead = 'Zuletzt war wieder <em class="g">mehr los</em> als am Anfang. Das darf sein.';
  else lead = 'Über den Zeitraum bist du ziemlich <em class="g">stabil</em> geblieben.';

  return {
    range,
    lead,
    conclusion:
      "Kurz: Das Tagebuch bringt dir was. Du erkennst deine Muster früher und gehst milder mit dir um.",
  };
}
