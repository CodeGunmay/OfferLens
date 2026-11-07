import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const TONES: Record<string, { chip: string; icon: string; bar: string }> = {
  navy: { chip: "bg-navy/[0.06]", icon: "text-navy", bar: "bg-navy" },
  ocean: { chip: "bg-ocean-tint", icon: "text-ocean-dark", bar: "bg-ocean" },
  teal: { chip: "bg-teal-tint", icon: "text-teal-dark", bar: "bg-teal" },
  gold: { chip: "bg-gold-tint", icon: "text-gold-dark", bar: "bg-gold" },
  coral: { chip: "bg-coral-tint", icon: "text-coral-dark", bar: "bg-coral" },
};

export function StatCard({
  label,
  value,
  unit,
  context,
  icon: Icon,
  tone = "navy",
  footer,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  context?: string;
  icon?: LucideIcon;
  accent?: string;
  /** Visual tone for the icon chip and the hairline accent. */
  tone?: keyof typeof TONES | string;
  footer?: ReactNode;
  hint?: string;
}) {
  const palette = TONES[tone] ?? TONES.navy;
  return (
    <div className="card card-hover group relative overflow-hidden p-4">
      <span className={`absolute inset-x-0 top-0 h-[2px] ${palette.bar} opacity-70`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">{label}</p>
        {Icon ? (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${palette.chip}`}>
            <Icon className={`h-4 w-4 ${palette.icon}`} strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <p className="mt-2.5 flex items-baseline gap-1.5">
        <span className="kpi-value">{value}</span>
        {unit ? <span className="text-[11.5px] font-medium text-muted">{unit}</span> : null}
      </p>
      {context ? <p className="mt-1.5 text-[11px] leading-4 text-muted">{context}</p> : null}
      {hint ? <p className="mt-1 text-[10.5px] font-medium text-gold-dark">{hint}</p> : null}
      {footer ? <div className="mt-2.5 border-t border-line pt-2">{footer}</div> : null}
    </div>
  );
}
