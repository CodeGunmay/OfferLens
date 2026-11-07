import type { ReactNode } from "react";
import type { ConfidenceBand } from "../../types";
import { BAND_COPY, statusTone } from "../../utils/confidence";
import { labelForStatus } from "../../utils/format";

export function Badge({
  children,
  tone = "border-line bg-slate-50 text-slate-600",
  className = "",
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return <span className={`pill ${tone} ${className}`}>{children}</span>;
}

export function BandBadge({ band, compact = false }: { band: ConfidenceBand; compact?: boolean }) {
  const copy = BAND_COPY[band];
  return (
    <Badge tone={copy.tone}>
      <span className={`h-1.5 w-1.5 rounded-full ${copy.dot}`} />
      {compact ? `${band[0].toUpperCase()}${band.slice(1)}` : copy.label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? "border-line bg-slate-50 text-slate-600"}>{labelForStatus(status)}</Badge>;
}

export function SourceTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-dashed border-line bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-subtle">
      {children}
    </span>
  );
}

export function DemoDataTag({ label = "Demo data" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-700">
      {label}
    </span>
  );
}
