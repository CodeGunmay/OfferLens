/** Formatting helpers. Currency is INR throughout the demo dataset. */

export const inr = (value: number | null | undefined, compact = false): string => {
  if (value === null || value === undefined) return "—";
  if (compact && Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

export const pct = (value: number | null | undefined, digits = 0): string =>
  value === null || value === undefined ? "—" : `${(value * 100).toFixed(digits)}%`;

export const pctRaw = (value: number | null | undefined, digits = 0): string =>
  value === null || value === undefined ? "—" : `${value.toFixed(digits)}%`;

export const confidence = (value: number | null | undefined): string =>
  value === null || value === undefined ? "—" : value.toFixed(3);

export const relativeTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMinutes = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export const titleCase = (value: string): string =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const labelForStatus = (status: string): string => {
  const map: Record<string, string> = {
    pending: "Awaiting review",
    approved: "Approved",
    rejected: "Rejected",
    separate: "Kept separate",
    confirmed: "Confirmed",
    proposed: "Proposed",
    "auto-matched": "Auto-matched",
    "awaiting review": "Awaiting review",
    unmapped: "Unmapped",
    "kept separate": "Kept separate",
  };
  return map[status] ?? titleCase(status);
};

/** True when a supplier attribute string expresses an inclusion, not an exclusion. */
export const isIncluded = (value: string | null | undefined): boolean => {
  if (!value) return false;
  const text = value.toLowerCase();
  if (text.includes("not included") || text.includes("room only")) return false;
  return text.includes("included") || text.includes("breakfast");
};

export const labelForDecision = (decision: string): string => {
  const map: Record<string, string> = {
    approve: "Approved",
    reject: "Rejected",
    separate: "Kept separate",
    reset: "Reset",
  };
  return map[decision] ?? titleCase(decision);
};
