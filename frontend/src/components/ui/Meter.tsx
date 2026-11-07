export function Meter({
  value,
  tone = "bg-teal",
  height = "h-1.5",
  label,
}: {
  value: number;
  tone?: string;
  height?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div>
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`} title={label}>
        <div className={`${height} rounded-full ${tone} transition-[width] duration-300`} style={{ width: `${clamped * 100}%` }} />
      </div>
    </div>
  );
}

export function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const ratio = Math.max(0, Math.min(1, score / max));
  const tone = ratio > 0.75 ? "bg-teal" : ratio > 0.45 ? "bg-sky-500" : "bg-slate-300";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="num text-[12px] font-semibold text-ink">{score.toFixed(1)}</span>
    </div>
  );
}
