interface WeightEditorProps {
  weights: Record<string, number>;
  labels: Record<string, string>;
  onChange: (weights: Record<string, number>) => void;
  disabled?: boolean;
}

export function WeightEditor({ weights, labels, onChange, disabled }: WeightEditorProps) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  const setWeight = (key: string, value: number) => {
    onChange({ ...weights, [key]: value });
  };

  return (
    <div className="space-y-3.5">
      {Object.entries(weights).map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between text-[12.5px]">
            <span className="font-medium text-ink">{labels[key] ?? key}</span>
            <span className="num text-muted">{value.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={value}
            disabled={disabled}
            onChange={(event) => setWeight(key, Number(event.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal disabled:cursor-not-allowed"
            aria-label={labels[key] ?? key}
          />
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-line pt-2.5 text-[12px]">
        <span className={total === 100 ? "text-muted" : "font-medium text-amber-700"}>
          Total weight: {total.toFixed(0)}%
        </span>
        <span className="text-subtle">
          {total === 100 ? "Scores normalise automatically" : "Weights are normalised to 100"}
        </span>
      </div>
    </div>
  );
}
