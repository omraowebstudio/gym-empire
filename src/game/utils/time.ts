/** Local calendar date key, e.g. 2026-11-20. Daily systems reset at local midnight. */
export function dateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO-8601 week key based on the local calendar date, e.g. 2026-W47. */
export function weekKey(ms: number): string {
  const d = new Date(ms);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Monotonic week index (weeks since a fixed Monday) used for event rotation. */
export function weekIndex(ms: number): number {
  const d = new Date(ms);
  const utcMidnight = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const epochMonday = Date.UTC(2024, 0, 1); // a Monday
  return Math.floor((utcMidnight - epochMonday) / (7 * 86400000));
}

/** Milliseconds until the next local midnight. */
export function msUntilNextDay(ms: number): number {
  const d = new Date(ms);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return next.getTime() - ms;
}

/** Milliseconds until next local Monday 00:00. */
export function msUntilNextWeek(ms: number): number {
  const d = new Date(ms);
  const day = d.getDay() || 7; // 1..7, Monday = 1
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (8 - day));
  return next.getTime() - ms;
}

export function daysBetweenKeys(a: string, b: string): number {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  const da = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const db = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((db - da) / 86400000);
}
