import type { ReactNode } from "react";

const ACCENTS: Record<1 | 2 | 3, { bar: string; chip: string; label: string }> = {
  1: { bar: "bg-ocean", chip: "bg-ocean text-white", label: "Identity" },
  2: { bar: "bg-teal", chip: "bg-teal text-white", label: "Configuration" },
  3: { bar: "bg-gold text-navy", chip: "bg-gold text-navy", label: "Bookable offer" },
};

/** Visual marker used above each equivalence-layer block in detail pages. */
export function LayerStrip({
  layer,
  title,
  detail,
  right,
}: {
  layer: 1 | 2 | 3;
  title: string;
  detail: string;
  right?: ReactNode;
}) {
  const accent = ACCENTS[layer];
  return (
    <div className="relative flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
      <span className={`absolute left-0 top-0 h-full w-[3px] ${accent.bar}`} aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11.5px] font-semibold shadow-sm ${accent.chip}`}
        >
          {layer}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13.5px] font-semibold leading-5 text-ink">{title}</p>
            <span className="pill border-line bg-[#F8FAFC] text-[9.5px] uppercase tracking-[0.06em] text-muted">
              Layer {layer} · {accent.label}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-[11.5px] leading-4 text-muted">{detail}</p>
        </div>
      </div>
      {right}
    </div>
  );
}
