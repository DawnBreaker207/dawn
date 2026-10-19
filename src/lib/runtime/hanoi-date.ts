// Logs use the local Hanoi calendar (UTC+7, no DST): +7h then read UTC fields.

const HANOI_OFFSET_MS = 7 * 60 * 60 * 1000;

export function hanoiDate(ms: number): string {
  return new Date(ms + HANOI_OFFSET_MS).toISOString().slice(0, 10);
}

export interface HanoiToday {
  date: string;
  startMs: number;
}

export function todayInHanoi(): HanoiToday {
  const date = hanoiDate(Date.now());
  return { date, startMs: Date.parse(`${date}T00:00:00+07:00`) };
}

// Inclusive lower-bound date string, `days` back from a day start (-6 => 7-day window).
export function hanoiStartDateOffset(startMs: number, days: number): string {
  return hanoiDate(startMs + days * 86_400_000);
}
