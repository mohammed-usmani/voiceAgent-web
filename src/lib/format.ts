export const DASH = "—";

// toFixed(2) rounds 0.725 down (binary float); round half up on the scaled value instead.
const fixed2 = (v: number) => (Math.round(v * 100) / 100).toFixed(2);

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function formatUsd(v: number | null | undefined): string {
  return v == null ? DASH : usd.format(v);
}

export function formatScore(v: number | null | undefined): string {
  return v == null ? DASH : fixed2(v);
}

export function formatPercent(v: number | null | undefined): string {
  return v == null ? DASH : `${Math.round(v * 100)}%`;
}

export function formatMetric(v: number | boolean | null | undefined): string {
  if (v == null) return DASH;
  if (typeof v === "boolean") return v ? "yes" : "no";
  return Number.isInteger(v) ? String(v) : fixed2(v);
}

export function formatDelta(v: number | null | undefined): string {
  if (v == null) return DASH;
  if (v === 0) return "±0";
  // A count (wrong invites caught) changes by whole numbers: "+3", not "+3.000".
  const size = Math.abs(v);
  return `${v > 0 ? "+" : "−"}${Number.isInteger(size) ? size : size.toFixed(3)}`;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const ss = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function formatClock(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso));
}

function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatRelative(iso: string, now: number): string {
  const seconds = Math.round((now - Date.parse(iso)) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return formatDay(iso);
}

export function humanize(s: string): string {
  const words = s.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
