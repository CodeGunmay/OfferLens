import { Building2, ChevronRight, DoorOpen, ReceiptText } from "lucide-react";

const LAYERS = [
  {
    id: 1,
    icon: Building2,
    title: "Product identity",
    question: "Is this the same property or attraction?",
    detail: "Name, geography, address and attribute agreement resolve supplier listings into one canonical product.",
    accent: "from-ocean to-ocean-dark",
    tint: "bg-ocean-tint text-ocean-dark",
    ring: "border-ocean/40",
    glow: "shadow-[0_10px_30px_-16px_rgba(22,119,184,0.75)]",
  },
  {
    id: 2,
    icon: DoorOpen,
    title: "Configuration equivalence",
    question: "Is this the same room or the same tour?",
    detail: "Bed type, occupancy, view, duration, access and inclusions decide what is genuinely comparable.",
    accent: "from-teal to-teal-dark",
    tint: "bg-teal-tint text-teal-dark",
    ring: "border-teal/40",
    glow: "shadow-[0_10px_30px_-16px_rgba(22,184,166,0.75)]",
  },
  {
    id: 3,
    icon: ReceiptText,
    title: "Bookable offer",
    question: "Is this the same deal?",
    detail: "Meals, cancellation, payment terms and price differences stay attached to each supplier's offer.",
    accent: "from-gold to-gold-dark",
    tint: "bg-gold-tint text-gold-dark",
    ring: "border-gold/50",
    glow: "shadow-[0_10px_30px_-16px_rgba(232,182,92,0.8)]",
  },
];

/**
 * The three equivalence layers, drawn as a progression rather than three
 * unrelated boxes: identity resolves first, configuration is then comparable,
 * and only then can rate plans be compared.
 */
export function ThreeLayerExplainer({
  activeLayer,
  compact = false,
}: {
  activeLayer?: 1 | 2 | 3;
  compact?: boolean;
}) {
  return (
    <div className="relative grid gap-3 md:grid-cols-3">
      {/* connective rail */}
      <span
        className="pointer-events-none absolute left-[8%] right-[8%] top-[34px] hidden h-px bg-gradient-to-r from-ocean/40 via-teal/40 to-gold/40 md:block"
        aria-hidden="true"
      />
      {LAYERS.map((layer) => {
        const Icon = layer.icon;
        const isActive = activeLayer === layer.id;
        return (
          <div
            key={layer.id}
            className={`group relative rounded-xl border bg-white p-3.5 transition-all duration-200 ${
              isActive ? `${layer.ring} ${layer.glow}` : "border-line hover:-translate-y-0.5 hover:shadow-raised"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${layer.accent} text-[11.5px] font-semibold text-white shadow-sm`}
              >
                {layer.id}
              </span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${layer.tint}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <p className="text-[12.5px] font-semibold text-ink">{layer.title}</p>
              {layer.id < 3 ? (
                <ChevronRight className="ml-auto hidden h-3.5 w-3.5 text-subtle/60 md:block" aria-hidden="true" />
              ) : null}
            </div>
            <p className="mt-2.5 text-[12px] font-medium leading-4 text-ink/85">{layer.question}</p>
            {!compact ? <p className="mt-1 text-[11.5px] leading-4 text-muted">{layer.detail}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
