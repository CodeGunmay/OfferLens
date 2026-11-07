import { Meter } from "../ui/Meter";

export function EvidenceBar({
  label,
  value,
  detail,
  tone = "bg-teal",
  compact = false,
}: {
  label: string;
  value: number;
  detail?: string;
  tone?: string;
  compact?: boolean;
}) {
  return (
    <div>
      <div className={`flex items-baseline justify-between gap-2 ${compact ? "mb-0" : "mb-1"}`}>
        <span className={`font-medium text-ink ${compact ? "text-[10.5px]" : "text-[12px]"}`}>{label}</span>
        <span className={`num text-muted ${compact ? "text-[10px]" : "text-[11.5px]"}`}>{(value * 100).toFixed(1)}%</span>
      </div>
      <Meter value={value} tone={tone} height={compact ? "h-1" : "h-1.5"} />
      {detail ? <p className="mt-1 text-[11px] leading-4 text-subtle">{detail}</p> : null}
    </div>
  );
}
