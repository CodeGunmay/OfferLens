import { ArrowUpRight, Info, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { RoomClass } from "../../types";
import { inr } from "../../utils/format";

export function RoomClassPanel({ classes, groupCode }: { classes: RoomClass[]; groupCode: string }) {
  return (
    <div className="divide-y divide-line">
      {classes.map((roomClass) => {
        const prices = roomClass.entries.flatMap((entry) => entry.rate_plans.map((plan) => plan.base_price));
        return (
          <div key={roomClass.equivalence_class} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13.5px] font-semibold text-ink">{roomClass.label}</p>
                  <span className="chip">{roomClass.supplier_count} suppliers</span>
                  <span className="mono text-[10.5px] text-subtle">class: {roomClass.equivalence_class}</span>
                </div>
                <p className="mt-1 text-[11.5px] text-muted">
                  {roomClass.comparable
                    ? "Comparable room configuration — safe to compare rate plans across suppliers."
                    : "Only one supplier maps to this room configuration, so no cross-supplier comparison is shown."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-subtle">Base price band</p>
                  <p className="num text-[12.5px] font-semibold text-ink">
                    {prices.length ? `${inr(Math.min(...prices))} – ${inr(Math.max(...prices))}` : "—"}
                  </p>
                </div>
                <Link
                  to={`/compare?group=${groupCode}&class=${roomClass.equivalence_class}`}
                  className="btn-secondary btn-sm"
                >
                  Compare offers <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {roomClass.entries.map((entry) => (
                <div key={`${roomClass.equivalence_class}-${entry.listing_id}-${entry.id}`} className="rounded-lg border border-line bg-[#FBFCFE] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-semibold text-ink">{entry.supplier.replace("Supplier ", "")}</span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: entry.supplier_accent }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-1 text-[12px] font-medium text-ink">{entry.room_category}</p>
                  <p className="text-[11px] leading-4 text-muted">
                    {entry.bed_type} · {entry.view}
                    {entry.size_sqm ? ` · ${entry.size_sqm} m²` : ""}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
                    <Users className="h-3 w-3" /> up to {entry.max_occupancy} guests
                  </p>
                  <div className="mt-2 space-y-1 border-t border-line pt-2">
                    {entry.rate_plans.map((plan) => (
                      <div key={plan.id} className="flex items-baseline justify-between gap-2">
                        <span className="text-[10.5px] text-muted">
                          {plan.meal_plan} · {plan.refundable ? `free cancel ${plan.cancellation_deadline_hours}h` : "non-refundable"}
                        </span>
                        <span className="num text-[12px] font-semibold text-ink">{inr(plan.base_price)}</span>
                      </div>
                    ))}
                  </div>
                  {entry.extraction_note ? (
                    <p className="mt-2 flex items-start gap-1 text-[10px] leading-3.5 text-subtle">
                      <Info className="mt-0.5 h-2.5 w-2.5 shrink-0" /> {entry.extraction_note}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            {roomClass.differences.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {roomClass.differences.map((difference) => (
                  <li key={difference} className="pill border-amber-200 bg-amber-50 text-amber-800">
                    {difference}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2.5 text-[11px] text-emerald-700">
                Room attributes agree across suppliers after normalization.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
