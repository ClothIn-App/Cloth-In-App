/**
 * Pure helpers for streak stats. Accept date strings as parameters; no JSON or side effects.
 */

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateKey(key: string): Date {
  const [y, m, day] = key.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function previousDayKey(key: string): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() - 1);
  return toDateKey(d);
}

function nextDayKey(key: string): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + 1);
  return toDateKey(d);
}

export type StreakStats = {
  currentStreak: number;
  longestStreak: number;
};

/**
 * Compute current and longest streak from an array of date keys (YYYY-MM-DD).
 * Current streak: consecutive days with a post counting backward from today (0 if no post today).
 * Longest streak: maximum consecutive calendar days with at least one post in history.
 */
export function computeStreakStats(dateKeys: string[]): StreakStats {
  const set = new Set(dateKeys);
  if (set.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const todayKey = toDateKey(new Date());
  let currentStreak = 0;
  if (set.has(todayKey)) {
    currentStreak = 1;
    let d = previousDayKey(todayKey);
    while (set.has(d)) {
      currentStreak++;
      d = previousDayKey(d);
    }
  }

  const sorted = [...set].sort();
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (nextDayKey(sorted[i - 1]) === sorted[i]) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 1;
    }
  }

  return { currentStreak, longestStreak };
}
