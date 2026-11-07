import { ArrowUpRight, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { ActivityClass } from "../../types";
import { inr } from "../../utils/format";

export function ActivityClassPanel({ classes, groupCode }: { classes: ActivityClass[]; groupCode: string }) {
  return (
    <div className="divide-y divide-line">
      {classes.map((activityClass) => {
        const prices = activityClass.entries.flatMap((entry) => entry.offers.map((offer) => offer.price));
        return (
          <div key={activityClass.equivalence_class} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13.5px] font-semibold text-ink">{activityClass.label}</p>
                  <span className="chip">{activityClass.supplier_count} suppliers</span>
                </div>
                <p className="mt-1 text-[11.5px] text-muted">
                  Same attraction, but tour formats differ. Compare inclusions before quoting.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-subtle">Price band / person</p>
                  <p className="num text-[12.5px] font-semibold text-ink">
                    {prices.length ? `${inr(Math.min(...prices))} – ${inr(Math.max(...prices))}` : "—"}
                  </p>
                </div>
                <Link to={`/compare?group=${groupCode}&class=${activityClass.equivalence_class}`} className="btn-secondary btn-sm">
                  Compare offers <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {activityClass.entries.map((entry) => (
                <div key={`${entry.equivalence_class}-${entry.id}`} className="rounded-lg border border-line bg-[#FBFCFE] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-semibold text-ink">{entry.supplier.replace("Supplier ", "")}</span>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.supplier_accent }} aria-hidden="true" />
                  </div>
                  <p className="mt-1 text-[12px] font-medium leading-4 text-ink">{entry.activity_name}</p>
                  <dl className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Duration</dt>
                      <dd className="num text-ink">{entry.duration_hours}h</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Format</dt>
                      <dd className="text-ink">{entry.experience_type}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Access</dt>
                      <dd className="text-ink">{entry.access_type}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Transfers</dt>
                      <dd className="text-right text-ink">{entry.transfers}</dd>
                    </div>
                  </dl>
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] text-muted">
                    <Users className="h-2.5 w-2.5" /> max {entry.offers[0]?.max_group_size ?? "—"} guests
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] text-muted">
                    <MapPin className="h-2.5 w-2.5" /> {entry.meeting_point}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1 border-t border-line pt-2">
                    {entry.included_services.slice(0, 4).map((service) => (
                      <span key={service} className="chip">{service}</span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-[10.5px] text-muted">{entry.offers[0]?.cancellation_policy}</span>
                    <span className="num text-[12.5px] font-semibold text-ink">
                      {inr(entry.offers[0]?.price ?? 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {activityClass.differences.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {activityClass.differences.map((difference) => (
                  <li key={difference} className="pill border-amber-200 bg-amber-50 text-amber-800">
                    {difference}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
