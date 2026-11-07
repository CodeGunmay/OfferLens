import type { ConfidenceBand } from "../types";

export const BAND_COPY: Record<ConfidenceBand, { label: string; hint: string; tone: string; dot: string }> = {
  high: {
    label: "High confidence",
    hint: "Suitable for automatic match suggestion",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Medium confidence",
    hint: "Requires human review",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low confidence",
    hint: "Keep listings separate",
    tone: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
};

export const statusTone: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  separate: "border-slate-200 bg-slate-100 text-slate-600",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  proposed: "border-sky-200 bg-sky-50 text-sky-800",
  "auto-matched": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "awaiting review": "border-amber-200 bg-amber-50 text-amber-800",
  unmapped: "border-slate-200 bg-slate-50 text-slate-600",
  "kept separate": "border-slate-200 bg-slate-100 text-slate-600",
};

export const CHART_COLORS = ["#16B8A6", "#0F2A44", "#3B82F6", "#8B5CF6", "#94A3B8"];
