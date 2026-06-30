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

/**
 * Aufeinanderfolgende Tage mit mindestens einem Eintrag (heute oder gestern als
 * Start). Eingelöste Pausentage (`restDays`, Datum „YYYY-MM-DD") zählen als
 * abgedeckt — so schützt ein Ruhetag die Serie, ohne sie zu unterbrechen.
 */
export function computeStreak(
  entries: JournalEntry[],
  restDays: string[] = [],
): number {
  if (!entries.length && !restDays.length) return 0;
  const days = new Set(entries.map((e) => dkey(new Date(e.createdAt))));
  for (const d of restDays) {
    const dt = new Date(`${d}T00:00:00`);
    if (!Number.isNaN(dt.getTime())) days.add(dkey(dt));
  }
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

/**
 * Verfügbare Pausentage: je 7 aufeinanderfolgende Tage wird einer verdient,
 * höchstens 1 gleichzeitig (kein Horten), abzüglich der bereits eingelösten.
 * Nach dem Einlösen braucht es entsprechend 7 neue Tage für den nächsten.
 */
export function pauseDaysAvailable(streak: number, redeemed: number): number {
  const earned = Math.floor(streak / 7);
  return Math.max(0, Math.min(1, earned - redeemed));
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
 * Gefühle, die wir guten Gewissens *feiern* dürfen. Liegt das häufigste Gefühl
 * hier, wird es als Ressource gespiegelt; sonst akzeptierend (s. u.). Bewusst
 * konservativ — im Zweifel wird ein Gefühl sanft (akzeptierend) statt euphorisch
 * gerahmt, nie umgekehrt. Vergleich erfolgt klein­geschrieben.
 */
const POSITIVE_EMOTIONS = new Set([
  "freude",
  "freudig",
  "glück",
  "glücklich",
  "dankbarkeit",
  "dankbar",
  "ruhe",
  "gelassenheit",
  "zufriedenheit",
  "zufrieden",
  "zuversicht",
  "zuversichtlich",
  "hoffnung",
  "hoffnungsvoll",
  "stolz",
  "liebe",
  "verbundenheit",
  "verbunden",
  "geborgenheit",
  "leichtigkeit",
  "neugier",
  "vorfreude",
  "erleichterung",
  "motivation",
  "motiviert",
  "energie",
  "lebendigkeit",
  "mut",
  "freiheit",
  "klarheit",
  "frieden",
  "begeisterung",
  "optimismus",
  "optimistisch",
  "froh",
  "fröhlich",
  "heiter",
  "ausgeglichen",
  "entspannt",
  "entspannung",
  "erholt",
  "ruhig",
  "gelassen",
  "geborgen",
  "vertrauen",
  "zuneigung",
  "liebevoll",
  "inspiriert",
  "wach",
  "präsent",
  "verspielt",
  "neugierig",
  "wärme",
  "stärke",
  "lebensfreude",
]);

/**
 * „Was sich zeigt"-Einsicht für die Dashboard-/Muster-Karte: datengetrieben,
 * mit einem `*Wort*`-Akzent und **täglich rotierend**, damit nicht tagelang
 * derselbe Satz steht.
 *
 * Haltung (gestützt auf SFBT & ACT, vgl. CLAUDE.md):
 * - **Ressourcen führen** (SFBT „start with what's going well"): Aussagen werden
 *   in `bright` (Stärken/Ressourcen/Werte/Fortschritt) und `tender` (schwierige
 *   Themen/Gefühle) getrennt. Gibt es ≥2 helle Aussagen, rotiert die Kachel nur
 *   unter ihnen — ein belastendes Wort wird gar nicht erst zur Schlagzeile.
 * - **Schwieriges akzeptierend spiegeln, nicht verstärken** (ACT): tender-Sätze
 *   geben dem Thema *Raum* und schaffen Distanz („begleitet dich gerade" ≠
 *   Identität), statt das häufigste Negativwort nackt hervorzuheben — kein
 *   Wegdrücken, aber auch kein Sog nach unten (Rumination/Negativitäts-Bias).
 *
 * Gibt eine Zeichenkette mit `*Akzent*`-Markern zurück (oder null bei zu wenig
 * Daten); das Rendering setzt die Akzente sicher als Textknoten (`withAccents`).
 */
export function showcaseInsight(entries: JournalEntry[], seed = 0): string | null {
  if (entries.length < 2) return null;
  const bright: string[] = []; // Ressourcen, Stärken, Werte, Fortschritt
  const tender: string[] = []; // Schwieriges — sanft, akzeptierend gerahmt

  // Bewegung & Stimmung (Ressource)
  const moveYes = moodOn(entries, (e) => e.movementToday === true);
  const moveNo = moodOn(entries, (e) => e.movementToday === false);
  if (
    moveYes != null &&
    moveNo != null &&
    entries.filter((e) => e.movementToday === true).length >= 2 &&
    entries.filter((e) => e.movementToday === false).length >= 2 &&
    moveYes - moveNo >= 0.8
  ) {
    bright.push('An Tagen mit Bewegung liegt deine Stimmung im Schnitt *höher*.');
  }

  // Draußen & Stimmung (Ressource)
  const outYes = moodOn(entries, (e) => e.outsideToday === true);
  const outNo = moodOn(entries, (e) => e.outsideToday === false);
  if (
    outYes != null &&
    outNo != null &&
    entries.filter((e) => e.outsideToday === true).length >= 2 &&
    entries.filter((e) => e.outsideToday === false).length >= 2 &&
    outYes - outNo >= 0.8
  ) {
    bright.push('An Tagen draußen ist deine Stimmung im Schnitt *leichter*.');
  }

  // Wochen-Trend (diese vs. letzte Woche)
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
  if (aThis != null && aLast != null && thisWeek.length >= 2 && lastWeek.length >= 2) {
    if (aThis - aLast >= 0.5)
      bright.push('Diese Woche war deine Stimmung etwas *leichter* als letzte.');
    else if (aLast - aThis >= 0.5)
      // Validierend, nicht wertend (ACT: darf sein) + Stärke (SFBT: du hältst fest).
      tender.push(
        'Diese Woche fühlte sich etwas *schwerer* an als letzte. Das darf sein — du hältst trotzdem fest.',
      );
  }

  // Anspannungs-Trend (Intensität diese vs. letzte Woche). Ruhiger werden ist
  // hier die Ressource (Nervensystem beruhigen); steigende Anspannung wird
  // akzeptierend gespiegelt, nicht alarmierend.
  const iThis = avg(thisWeek.map((e) => e.intensity));
  const iLast = avg(lastWeek.map((e) => e.intensity));
  if (iThis != null && iLast != null && thisWeek.length >= 2 && lastWeek.length >= 2) {
    if (iLast - iThis >= 0.8)
      bright.push('Die Anspannung war diese Woche im Schnitt etwas *ruhiger* als letzte.');
    else if (iThis - iLast >= 0.8)
      tender.push('Die Anspannung war zuletzt etwas *höher*. Gut, dass du hinschaust.');
  }

  // Bester Wochentag (Ressource)
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
    if (m == null) continue;
    if (!best || m > best.m) best = { wd, m };
  }
  if (best && byDay.size >= 3) {
    bright.push(
      `${capitalize(WEEKDAYS[best.wd])} ist deine Stimmung im Schnitt am *höchsten*.`,
    );
  }

  // Tageszeit-Muster (Ressource): wann die Stimmung im Schnitt leichter ist.
  const morning = moodOn(entries, (e) => new Date(e.createdAt).getHours() < 12);
  const evening = moodOn(entries, (e) => new Date(e.createdAt).getHours() >= 17);
  const morningN = entries.filter((e) => new Date(e.createdAt).getHours() < 12).length;
  const eveningN = entries.filter((e) => new Date(e.createdAt).getHours() >= 17).length;
  if (morning != null && evening != null && morningN >= 2 && eveningN >= 2) {
    if (morning - evening >= 0.8)
      bright.push('Morgens ist deine Stimmung im Schnitt *leichter* als abends.');
    else if (evening - morning >= 0.8)
      bright.push('Abends ist deine Stimmung im Schnitt *leichter* als morgens.');
  }

  // Wochenende vs. Werktag (Ressource): Muster über die Woche sichtbar machen.
  const isWeekend = (e: JournalEntry) => {
    const d = new Date(e.createdAt).getDay();
    return d === 0 || d === 6;
  };
  const wend = moodOn(entries, isWeekend);
  const wday = moodOn(entries, (e) => !isWeekend(e));
  const wendN = entries.filter(isWeekend).length;
  const wdayN = entries.filter((e) => !isWeekend(e)).length;
  if (wend != null && wday != null && wendN >= 2 && wdayN >= 2) {
    if (wend - wday >= 0.8)
      bright.push('Am Wochenende ist deine Stimmung im Schnitt *leichter*.');
    else if (wday - wend >= 0.8)
      bright.push('An Werktagen ist deine Stimmung im Schnitt *leichter*.');
  }

  // Häufigstes Bedürfnis (ACT: Bedürfnisse zeigen Werte/Richtung → Ressource)
  const nCounts = new Map<string, number>();
  for (const e of entries)
    for (const nd of e.needs) {
      const k = nd.trim();
      if (k) nCounts.set(k, (nCounts.get(k) ?? 0) + 1);
    }
  const topNeed = [...nCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topNeed && topNeed[1] >= 2) {
    bright.push(`Ein Bedürfnis zeigt sich immer wieder: *${topNeed[0]}* — ein leiser Wegweiser.`);
  }

  // Schreib-Konstanz dieser Woche (SFBT-Kompliment: Dranbleiben sichtbar machen)
  const daysThisWeek = new Set(
    thisWeek.map((e) => new Date(e.createdAt).toDateString()),
  ).size;
  if (daysThisWeek >= 3) {
    bright.push(`Diese Woche hast du an *${daysThisWeek} Tagen* etwas festgehalten.`);
  }

  // Häufigste Emotion: positive feiern (Ressource), schwierige akzeptierend (ACT)
  const eCounts = new Map<string, number>();
  for (const e of entries)
    for (const em of e.emotions) {
      const k = em.trim();
      if (k) eCounts.set(k, (eCounts.get(k) ?? 0) + 1);
    }
  const topEmo = [...eCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topEmo && topEmo[1] >= 2) {
    if (POSITIVE_EMOTIONS.has(topEmo[0].toLowerCase()))
      bright.push(`*${capitalize(topEmo[0])}* hat dich zuletzt oft begleitet — schön, dass auch das da ist.`);
    else
      // ACT: Raum geben statt wegdrücken; Defusion über „durfte … da sein".
      tender.push(`Auch *${topEmo[0]}* durfte zuletzt oft da sein — du musst nichts an dem Gefühl ändern.`);
  }

  // Häufigstes Thema: akzeptierend spiegeln, nicht als nacktes Negativwort
  const tCounts = new Map<string, number>();
  for (const e of entries)
    for (const t of e.topics) {
      const k = t.trim();
      if (k) tCounts.set(k, (tCounts.get(k) ?? 0) + 1);
    }
  const topTopic = [...tCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topTopic && topTopic[1] >= 2) {
    // ACT-Defusion („begleitet dich gerade" = vorübergehend, nicht Identität) +
    // SFBT-Kompliment fürs Hinschauen — statt „taucht oft dasselbe Wort auf".
    tender.push(`Ein Thema begleitet dich gerade oft: *${topTopic[0]}*. Dass du ihm Raum gibst, zählt.`);
  }

  // Sanfter Fallback, falls (noch) nichts Konkretes zutrifft.
  if (bright.length === 0 && tender.length === 0) {
    const m = avg(entries.map((e) => e.mood));
    if (m == null) return null;
    return `Deine Stimmung lag zuletzt im Schnitt bei *${m}/10*. Schon das hinzusehen zählt.`;
  }

  // Ressourcen führen: Gibt es ≥2 helle Aussagen, rotiert die Kachel NUR unter
  // ihnen — Schweres wird nicht zur Schlagzeile. Sonst (höchstens eine helle)
  // kommt Schweres dazu, aber akzeptierend gerahmt, damit die Ansage trotzdem
  // täglich wechselt und das Erleben nicht verleugnet wird.
  const pool = bright.length >= 2 ? bright : [...bright, ...tender];

  // Ein täglich rotierender Primärsatz ist die Basis (seed → pool[i]). Ein
  // zweiter Satz ergänzt ihn zu einem volleren Block — aber NUR ab drei Aussagen
  // im Pool: bei genau zweien enthielte „primary + secondary" Tag für Tag beide
  // (nur die Reihenfolge tauschte) und änderte sich nie sichtbar.
  const len = pool.length;
  const i = ((seed % len) + len) % len;
  const primary = pool[i];
  if (len <= 2) return primary;
  const secondary = pool[(i + 1) % len];
  return `${primary} ${secondary}`;
}

export interface WordCount {
  word: string;
  count: number;
}

/**
 * Gemeinsamer Seed für die „Was sich zeigt"-/Showcase-Inhalte: Tag + Datenmenge.
 * EINE Quelle, damit Dashboard, Muster (und weitere Stellen) zum selben Zeitpunkt
 * dasselbe zeigen — und sich der Inhalt sichtbar ändert, sobald sich die Einträge
 * ändern, nicht nur täglich.
 */
export function showcaseSeed(entries: JournalEntry[]): number {
  return Math.floor(Date.now() / 86_400_000) + entries.length;
}

/**
 * Schlüsselwort für die Teilen-/Mini-Karte. Rotiert mit `showcaseSeed` durch die
 * Top-Themen — überall identisch berechnet, damit die Vorschau-Karten auf allen
 * Seiten dasselbe Wort zeigen.
 */
export function showcaseKeyword(entries: JournalEntry[], fallback = "Heute"): string {
  const words = wordsOfWeek(entries, 4).map((w) => w.word);
  if (!words.length) return fallback;
  return words[showcaseSeed(entries) % words.length];
}

/** „Worte der Woche": häufigste Themen/Gefühle/Bedürfnisse im Zeitraum. */
export function wordsOfWeek(entries: JournalEntry[], max = 7): WordCount[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const w of [...e.topics, ...e.emotions, ...e.needs]) {
      const t = w.trim();
      // Nur echte Worte/kurze Begriffe zählen — keine ganzen Sätze. Freie
      // Bedürfnis-/Themen-Eingaben können Sätze sein; die gehören nicht in
      // eine „Worte"-Wolke (max. 2 Worte, höchstens 24 Zeichen).
      if (t && t.split(/\s+/).length <= 2 && t.length <= 24) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
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
  /** Anzahl Einträge, in denen das Thema vorkommt (im Fenster). */
  count: number;
  /** An wie vielen verschiedenen Tagen das Thema auftauchte (= „roter Faden"). */
  days: number;
  /**
   * Randfarbe = emotionaler Grundton des Themas: die Durchschnittsstimmung der
   * Einträge, in denen es vorkommt, auf das Marken-Farbsystem gemappt
   * (clay = schwer → gold = gemischt → sage = okay → grün = leicht).
   */
  color: string;
  /** Ruhiger, datengetriebener Satz, was das Thema gerade macht. */
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

// Eine Quelle der Wahrheit für die Farb-Legende (Roter-Faden-Seite): so bleibt
// die Erklärung der Randfarben mit `moodHue` synchron.
export const TONE_LEGEND: { color: string; label: string }[] = [
  { color: "#CD8A5B", label: "schwer" },
  { color: "#DDB14B", label: "gemischt" },
  { color: "#9BA383", label: "okay" },
  { color: "#A8E84F", label: "leicht" },
];

function sinceLabel(firstAt: string): string {
  const weeks = Math.floor((Date.now() - new Date(firstAt).getTime()) / (7 * DAY));
  if (weeks <= 0) return "diese Woche";
  if (weeks === 1) return "seit 1 Woche";
  return `seit ${weeks} Wochen`;
}

// Stabiler Index aus dem Thema-Schlüssel — damit zwei gleich „aktive" Themen
// nicht denselben Satz bekommen, sondern eine andere (gleichwertige) Formulierung.
function phraseIndex(key: string, n: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % n;
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
 * nicht nur Wörter, sondern was sich durchzieht.
 *
 * Logik (bewusst transparent, damit die Karten nachvollziehbar sind):
 *
 *  • Fenster   – nur Einträge der letzten `weeks` Wochen (Default 6). Rollt
 *                live mit: ältere Themen fallen heraus, neue kommen dazu.
 *  • Quelle    – die `topics` der Einträge (deine eigenen Worte), normalisiert.
 *  • Auswahl   – ein Thema ist erst ein „Faden", wenn es an **mindestens `min`
 *                verschiedenen Tagen** auftaucht (Default 2). So zählt echte
 *                Wiederkehr über die Zeit, nicht ein einzelner voller Tag.
 *  • Reihung   – nach „Stärke" = Tage (×2) + Häufigkeit + Aktualitäts-Bonus.
 *                Aktuelle, oft wiederkehrende Themen stehen oben; `max` Stück.
 *  • Titel     – das Thema selbst (deine Formulierung), groß geschrieben.
 *  • Randfarbe – der emotionale Grundton (Ø Stimmung) auf dem Marken-Farbsystem
 *                clay→gold→sage→grün. Zeigt, *wie sich das Thema anfühlt*.
 *  • Notiz     – ein datengetriebener Satz: Stimmungs-Trend (wird es leichter/
 *                schwerer?), Abklingen, begleitende Emotion oder Häufigkeit.
 */
// Kuratierte Synonym-/Grundform-Zuordnung: führt gängige Synonyme auf ein
// gemeinsames Leitwort zusammen, damit dasselbe Thema in EINEM Faden landet.
const TOPIC_SYNONYMS: Record<string, string> = {
  job: "arbeit",
  beruf: "arbeit",
  arbeiten: "arbeit",
  büro: "arbeit",
  finanzen: "geld",
  finanz: "geld",
  geldsorgen: "geld",
  partnerschaft: "beziehung",
  partner: "beziehung",
  freunde: "freundschaft",
  freund: "freundschaft",
  freundin: "freundschaft",
  schlafen: "schlaf",
  schlaflosigkeit: "schlaf",
  eltern: "familie",
  ängste: "angst",
  angstgefühl: "angst",
  zukunftsangst: "zukunft",
  selbstwertgefühl: "selbstwert",
};

// Konservatives Entbeugen: nur gängige Plural-/Beugungs-Endungen abtrennen und
// nur, wenn der Rest noch ≥ 4 Zeichen hat (schützt kurze Wörter, vermeidet
// falsche Zusammenführungen). So treffen sich „Trennung"/„Trennungen",
// „Sorge"/„Sorgen", „Gedanke"/„Gedanken" im selben Schlüssel.
function stemTopic(w: string): string {
  for (const suf of ["en", "n", "e"]) {
    if (w.length - suf.length >= 4 && w.endsWith(suf)) {
      return w.slice(0, -suf.length);
    }
  }
  return w;
}

// Normalisierter Gruppierungs-Schlüssel eines Themas (klein, entbeugt, Synonyme
// zusammengeführt). Der angezeigte Titel bleibt davon unberührt — dort steht
// weiter die häufigste Original-Formulierung der Nutzerin.
export function normalizeTopic(raw: string): string {
  const base = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!base) return "";
  if (TOPIC_SYNONYMS[base]) return TOPIC_SYNONYMS[base];
  const stemmed = stemTopic(base);
  return TOPIC_SYNONYMS[stemmed] ?? stemmed;
}

export function themeClusters(
  entries: JournalEntry[],
  opts: { weeks?: number; min?: number; max?: number } = {},
): ThemeCluster[] {
  const { weeks = 6, min = 2, max = 5 } = opts;
  const cutoff = Date.now() - weeks * 7 * DAY;
  const within = entries.filter((e) => new Date(e.createdAt).getTime() >= cutoff);

  type Acc = {
    dates: string[];
    days: Set<string>;
    moods: number[];
    emotions: string[];
    surfaces: Map<string, number>;
  };
  const map = new Map<string, Acc>();
  for (const e of within) {
    const dk = dkey(new Date(e.createdAt));
    for (const raw of e.topics) {
      const topic = raw.trim();
      if (!topic) continue;
      const key = normalizeTopic(topic);
      if (!key) continue;
      let acc = map.get(key);
      if (!acc) {
        acc = { dates: [], days: new Set(), moods: [], emotions: [], surfaces: new Map() };
        map.set(key, acc);
      }
      acc.dates.push(e.createdAt);
      acc.days.add(dk);
      acc.moods.push(e.mood);
      acc.emotions.push(...e.emotions);
      // Original-Formulierung zählen, damit der Titel die häufigste eigene
      // Schreibweise der Nutzerin zeigt (nicht den entbeugten Schlüssel).
      acc.surfaces.set(topic, (acc.surfaces.get(topic) ?? 0) + 1);
    }
  }

  const scored: { cluster: ThemeCluster; strength: number }[] = [];
  for (const [key, acc] of map) {
    // „Roter Faden" = Wiederkehr über die Zeit: an ≥ `min` verschiedenen Tagen.
    const distinctDays = acc.days.size;
    if (distinctDays < min) continue;

    const sorted = [...acc.dates].sort();
    const firstAt = sorted[0];
    const lastAt = sorted[sorted.length - 1];
    const meanMood = avg(acc.moods) ?? 5;

    // Trend: Stimmung in der ersten vs. zweiten Hälfte der Treffer (nur bei
    // genügend Datenpunkten, sonst zu verrauscht).
    const half = Math.floor(acc.moods.length / 2);
    const early = avg(acc.moods.slice(0, half || 1));
    const late = avg(acc.moods.slice(half));
    const trend =
      acc.moods.length >= 4 && early != null && late != null
        ? late - early >= 0.8
          ? "up"
          : early - late >= 0.8
            ? "down"
            : "flat"
        : "flat";
    const daysSinceLast = Math.floor(
      (Date.now() - new Date(lastAt).getTime()) / DAY,
    );

    // Begleitende Emotion: häufigste Emotion in den Einträgen dieses Themas
    // (nur, wenn sie mindestens zweimal auftaucht — sonst nicht aussagekräftig).
    const emoCounts = new Map<string, number>();
    for (const em of acc.emotions) {
      const t = em.trim();
      if (t) emoCounts.set(t, (emoCounts.get(t) ?? 0) + 1);
    }
    const topEmotion = [...emoCounts.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Notiz aus mehreren Signalen, damit nicht überall dasselbe steht.
    let note: string;
    if (trend === "up") {
      note = 'Zuletzt fühlt sich das *leichter* an.';
    } else if (trend === "down") {
      note = 'Liegt gerade *schwerer* als zuvor.';
    } else if (daysSinceLast >= 14) {
      note = 'Zuletzt *seltener* geworden.';
    } else if (topEmotion) {
      note = `Oft begleitet von *${topEmotion}*.`;
    } else {
      // flach & aktuell: gleichwertige Formulierungen, je nach Häufigkeit,
      // pro Thema variiert (sonst klingen zwei Themen identisch).
      const pool =
        acc.dates.length >= 4
          ? [
              'Kommt *immer wieder*.',
              'Zieht sich durch die *Wochen*.',
              'Taucht *regelmäßig* auf.',
            ]
          : [
              'Gerade wieder *präsent*.',
              'Beschäftigt dich *aktuell*.',
              'Zieht sich *ruhig* durch.',
            ];
      note = pool[phraseIndex(key, pool.length)];
    }

    // Stärke: Wiederkehr (Tage) zählt doppelt, plus Häufigkeit, plus ein
    // Aktualitäts-Bonus (klingt über zwei Wochen aus). So stehen aktuelle,
    // sich durchziehende Themen oben — verblassende rutschen nach unten.
    const recency = Math.max(0, 14 - daysSinceLast) / 14;
    const strength = distinctDays * 2 + acc.dates.length + recency;

    // Titel: die häufigste Original-Schreibweise (bei Gleichstand die kürzeste,
    // meist die Grundform), groß geschrieben.
    const titleSurface =
      [...acc.surfaces.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].length - b[0].length,
      )[0]?.[0] ?? key;

    scored.push({
      cluster: {
        id: key,
        title: capitalize(titleSurface),
        count: acc.dates.length,
        days: distinctDays,
        color: moodHue(meanMood),
        note,
        tags: [sinceLabel(firstAt), lastLabel(lastAt)],
        firstAt,
        lastAt,
      },
      strength,
    });
  }

  return scored
    .sort((a, b) => b.strength - a.strength)
    .slice(0, max)
    .map((s) => s.cluster);
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
  lead: string; // Lead mit *…*
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
      lead: 'Noch zu wenig, um einen Verlauf zu zeichnen. Schreib weiter, dann zeigt sich, *wohin* es geht.',
      conclusion: "Auch das ist Fortschritt: Du fängst an, hinzuschauen.",
    };
  }

  const first = buckets[0].value as number;
  const last = buckets[buckets.length - 1].value as number;
  const delta = last - first;
  let lead: string;
  if (delta >= 0.8) lead = 'Über den Zeitraum bist du spürbar *ruhiger* geworden.';
  else if (delta <= -0.8) lead = 'Zuletzt war wieder *mehr los* als am Anfang. Das darf sein.';
  else lead = 'Über den Zeitraum bist du ziemlich *stabil* geblieben.';

  return {
    range,
    lead,
    conclusion:
      "Kurz: Das Tagebuch bringt dir was. Du erkennst deine Muster früher und gehst milder mit dir um.",
  };
}
