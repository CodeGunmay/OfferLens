import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function QuickActionCard({
  to,
  title,
  detail,
  icon: Icon,
  meta,
  tone = "teal",
}: {
  to: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  meta?: string;
  tone?: "teal" | "ocean" | "navy" | "gold";
}) {
  const tones = {
    teal: { chip: "bg-teal-tint text-teal-dark", hover: "group-hover:bg-teal group-hover:text-white", ring: "hover:border-teal/40" },
    ocean: { chip: "bg-ocean-tint text-ocean-dark", hover: "group-hover:bg-ocean group-hover:text-white", ring: "hover:border-ocean/40" },
    navy: { chip: "bg-navy/[0.06] text-navy", hover: "group-hover:bg-navy group-hover:text-white", ring: "hover:border-navy/30" },
    gold: { chip: "bg-gold-tint text-gold-dark", hover: "group-hover:bg-gold group-hover:text-white", ring: "hover:border-gold/50" },
  }[tone];

  return (
    <Link
      to={to}
      className={`card group flex items-start gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised ${tones.ring}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${tones.chip} ${tones.hover}`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[13px] font-semibold text-ink">
          {title}
          <ArrowUpRight className="h-3.5 w-3.5 text-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ocean" />
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-4 text-muted">{detail}</span>
        {meta ? <span className="chip mt-2">{meta}</span> : null}
      </span>
    </Link>
  );
}
