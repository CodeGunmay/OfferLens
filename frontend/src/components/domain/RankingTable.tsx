import { AlertTriangle, ArrowDown, ArrowUp, ChevronDown, Minus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RankingRow } from "../../types";
import { inr } from "../../utils/format";
import { ScoreBar } from "../ui/Meter";

/**
 * Previous ordering, kept at module scope so it survives the loading state that
 * replaces the table while a new weighting is being scored.
 */
let previousPositions: Record<string, number> = {};

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  const [openRow, setOpenRow] = useState<string | null>(rows[0]?.id ?? null);

  // Before/after positions: the previous ordering makes a weight change visibly move rows.
  const previous = useRef<Record<string, number>>(previousPositions);
  const signature = rows.map((row) => `${row.id}:${row.position}`).join("|");
  const deltas: Record<string, number> = {};
  for (const row of rows) {
    const before = previous.current[row.id];
    deltas[row.id] = before === undefined ? 0 : before - row.position;
  }
  useEffect(() => {
    // Snapshot only once the ordering has settled, so the chips keep showing the
    // movement caused by the last weight change rather than resetting on every refetch.
    const timer = setTimeout(() => {
      previous.current = Object.fromEntries(rows.map((row) => [row.id, row.position]));
      previousPositions = previous.current;
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div className="divide-y divide-line">
      {rows.map((row) => {
        const isOpen = openRow === row.id;
        return (
          <div key={row.id}>
            <button
              type="button"
              onClick={() => setOpenRow(isOpen ? null : row.id)}
              className="grid w-full grid-cols-[36px_52px_1fr_auto] items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#F8FAFC] sm:grid-cols-[36px_52px_1.4fr_1fr_120px_150px_20px]"
              aria-expanded={isOpen}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-semibold ${
                  row.position === 1 ? "bg-teal text-white" : "bg-navy/[0.07] text-navy"
                }`}
              >
                {row.position}
              </span>
              <DeltaChip delta={deltas[row.id] ?? 0} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink">{row.supplier_name}</span>
                <span className="block truncate text-[11px] text-muted">{row.room_or_activity}</span>
              </span>
              <span className="hidden text-[11.5px] text-muted sm:block">
                <span className="block text-ink">{row.meal_plan}</span>
                <span className="block">{row.cancellation}</span>
              </span>
              <span className="hidden text-right sm:block">
                <span className="num block text-[12.5px] font-medium text-ink">{inr(row.effective_price)}</span>
                <span className="num block text-[10.5px] text-subtle">listed {inr(row.listed_price)}</span>
              </span>
              <span className="hidden sm:block">
                <ScoreBar score={row.score} />
              </span>
              <ChevronDown className={`h-4 w-4 text-subtle transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen ? (
              <div className="animate-fade-in grid gap-4 border-t border-line bg-[#FBFCFE] px-5 py-4 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <p className="section-label mb-2">Score breakdown</p>
                  <table className="w-full text-[11.5px]">
                    <thead>
                      <tr>
                        <th className="pb-1 text-left font-medium text-subtle">Component</th>
                        <th className="pb-1 text-right font-medium text-subtle">Weight</th>
                        <th className="pb-1 text-right font-medium text-subtle">Score</th>
                        <th className="pb-1 text-right font-medium text-subtle">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(row.components).map(([key, component]) => (
                        <tr key={key} className="border-t border-line/60">
                          <td className="py-1.5 text-ink">{component.label}</td>
                          <td className="num py-1.5 text-right text-muted">{component.weight}%</td>
                          <td className="num py-1.5 text-right text-muted">{component.score}</td>
                          <td className="num py-1.5 text-right font-semibold text-ink">
                            {component.contribution.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-line">
                        <td className="pt-1.5 font-semibold text-ink">Total</td>
                        <td />
                        <td />
                        <td className="num pt-1.5 text-right font-semibold text-ink">{row.score.toFixed(1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="section-label mb-1.5">Why this position</p>
                    <ul className="space-y-1">
                      {row.reasons.map((reason) => (
                        <li key={reason} className="text-[11.5px] leading-4 text-ink/80">
                          • {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {row.warnings.length > 0 ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-amber-800">
                        Confidence warnings
                      </p>
                      <ul className="mt-1 space-y-1">
                        {row.warnings.map((warning) => (
                          <li key={warning} className="flex items-start gap-1 text-[11px] leading-4 text-amber-900">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Shows how a row moved relative to the previous weighting. */
function DeltaChip({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="hidden items-center gap-0.5 text-[10px] font-medium text-subtle sm:inline-flex">
        <Minus className="h-2.5 w-2.5" /> held
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`hidden items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold sm:inline-flex ${
        up ? "border-teal/40 bg-teal-tint text-teal-dark" : "border-coral/40 bg-coral-tint text-coral-dark"
      }`}
      title={`Moved ${Math.abs(delta)} place${Math.abs(delta) === 1 ? "" : "s"} ${up ? "up" : "down"} after the last weight change`}
    >
      {up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {Math.abs(delta)}
    </span>
  );
}
