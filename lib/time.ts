/**
 * "3 days ago" / "in 2 weeks" with the browser's Intl.RelativeTimeFormat, so
 * the app doesn't ship a date library for relative times. Rounds the way
 * people say it (the largest whole unit).
 */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "always" });

function pick(seconds: number): [Intl.RelativeTimeFormatUnit, number] {
  const abs = Math.abs(seconds);
  for (const [unit, size] of UNITS) {
    if (abs >= size || unit === "second") return [unit, Math.round(seconds / size)];
  }
  return ["second", Math.round(seconds)];
}

/** Relative to now: "3 days ago", "in 5 hours". */
export function timeAgo(date: Date | string, now: Date = new Date()): string {
  const seconds = (new Date(date).getTime() - now.getTime()) / 1000;
  const [unit, value] = pick(seconds);
  return rtf.format(value, unit);
}

/** A duration without direction: "3 months", "1 day". */
export function duration(from: Date | string, now: Date = new Date()): string {
  const seconds = Math.abs(now.getTime() - new Date(from).getTime()) / 1000;
  const [unit, value] = pick(seconds);
  const n = Math.abs(value);
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}
