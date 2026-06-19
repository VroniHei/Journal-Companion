import type { JournalEntry } from "@journal/shared";

export interface Aggregates {
  count: number;
  avgMood: number | null;
  avgIntensity: number | null;
  topEmotions: [string, number][];
  topTopics: [string, number][];
  topNeeds: [string, number][];
  highIntensity: JournalEntry[];
  contactImpulses: number;
  ruminations: number;
  movementDays: number;
  outsideDays: number;
  cannabisDays: number;
}

function tally(lists: string[][], limit = 6): [string, number][] {
  const counts = new Map<string, number>();
  for (const list of lists)
    for (const v of list) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function aggregate(entries: JournalEntry[]): Aggregates {
  return {
    count: entries.length,
    avgMood: avg(entries.map((e) => e.mood)),
    avgIntensity: avg(entries.map((e) => e.intensity)),
    topEmotions: tally(entries.map((e) => e.emotions)),
    topTopics: tally(entries.map((e) => e.topics)),
    topNeeds: tally(entries.map((e) => e.needs)),
    highIntensity: entries.filter((e) => e.intensity >= 8),
    contactImpulses: entries.filter((e) => e.impulse.includes("schreiben")).length,
    ruminations: entries.filter((e) => e.ruminationFlag).length,
    movementDays: entries.filter((e) => e.movementToday === true).length,
    outsideDays: entries.filter((e) => e.outsideToday === true).length,
    cannabisDays: entries.filter((e) => e.cannabisToday === true).length,
  };
}
