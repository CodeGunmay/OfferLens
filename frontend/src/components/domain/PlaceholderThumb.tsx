import { BedDouble, Camera } from "lucide-react";

/**
 * Illustrative placeholder tile used wherever a real image would go.
 * These are generated gradients with a glyph - they are NOT supplier
 * photographs and must never be labelled as such.
 */
const GRADIENTS = [
  "from-[#102A43] via-[#16496F] to-[#1677B8]",
  "from-[#102A43] via-[#123F5A] to-[#16B8A6]",
  "from-[#173D5C] via-[#1C5A7A] to-[#5AA9D6]",
  "from-[#0F2E45] via-[#155E6B] to-[#16B8A6]",
  "from-[#1B3A55] via-[#2A6E8F] to-[#7FB6D8]",
  "from-[#12314A] via-[#1B4F63] to-[#3FA896]",
];

function hash(value: string): number {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) total = (total * 31 + value.charCodeAt(index)) % 9973;
  return total;
}

export function PlaceholderThumb({
  seed,
  kind = "hotel",
  size = "md",
  className = "",
}: {
  seed: string;
  kind?: "hotel" | "sightseeing";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const gradient = GRADIENTS[hash(seed) % GRADIENTS.length];
  const Icon = kind === "hotel" ? BedDouble : Camera;
  const box =
    size === "sm" ? "h-9 w-9 rounded-md" : size === "md" ? "h-11 w-11 rounded-lg" : "h-16 w-16 rounded-xl";
  const glyph = size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div
      aria-hidden="true"
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${gradient} ${box} ${className}`}
    >
      <span className="absolute inset-0 grid-lines opacity-[0.18]" />
      <span className="absolute -bottom-3 -right-3 h-8 w-8 rounded-full bg-white/10" />
      <Icon className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 ${glyph}`} />
    </div>
  );
}
