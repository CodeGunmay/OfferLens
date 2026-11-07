import { ChevronDown, Sigma } from "lucide-react";
import { useState } from "react";
import type { CompareResponse } from "../../types";
import { inr } from "../../utils/format";
import { InfoTip } from "../ui/InfoTip";

export function EffectivePricePanel({ data }: { data: CompareResponse }) {
  const [expanded, setExpanded] = useState<string | null>(data.offers[0]?.id ?? null);
  const max = Math.max(...data.offers.map((offer) => offer.effective.effective_price));
  const assumptionByKey = Object.fromEntries(data.assumptions.map((item) => [item.key, item]));

  return (
    <div className="divide-y divide-line">
      {data.offers.map((offer) => {
        const isOpen = expanded === offer.id;
        const isRecommended = offer.id === data.recommended_offer_id;
        const listedWidth = (offer.listed_price / max) * 100;
        const effectiveWidth = (offer.effective.effective_price / max) * 100;
        return (
          <div key={offer.id} className={isRecommended ? "bg-teal-tint/30" : ""}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : offer.id)}
              className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[#F8FAFC]"
              aria-expanded={isOpen}
            >
              <div className="w-[132px] shrink-0">
                <p className="text-[12.5px] font-semibold text-ink">{offer.supplier_name}</p>
                <p className="text-[10.5px] text-muted">{offer.summary?.slice(0, 34)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex h-[18px] items-center">
                  <div className="relative h-2 w-full rounded-full bg-slate-100" title={`effective ${inr(offer.effective.effective_price)} of ${inr(max)} maximum`}>
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${isRecommended ? "bg-teal" : "bg-navy/60"}`}
                      style={{ width: `${effectiveWidth}%` }}
                    />
                    <div
                      className="absolute -top-[3px] h-3.5 w-[2px] rounded-full bg-slate-500"
                      style={{ left: `calc(${listedWidth}% - 1px)` }}
                      title={`listed ${inr(offer.listed_price)}`}
                    />
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-3 w-[2px] rounded-full bg-slate-500" /> listed {inr(offer.listed_price)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className={`h-2 w-3 rounded-full ${isRecommended ? "bg-teal" : "bg-navy/60"}`} /> effective{" "}
                    {inr(offer.effective.effective_price)}
                  </span>
                  {offer.effective.uplift > 0 ? (
                    <span className="text-amber-700">
                      +{inr(offer.effective.uplift)} ({offer.effective.uplift_pct.toFixed(1)}%)
                    </span>
                  ) : null}
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-subtle transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen ? (
              <div className="animate-fade-in border-t border-line bg-[#FBFCFE] px-5 py-3">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  <Sigma className="h-3 w-3" /> Effective-price build-up
                </div>
                <table className="w-full text-[12px]">
                  <tbody>
                    {offer.effective.components.map((component) => {
                      const assumption = component.assumption_key
                        ? assumptionByKey[component.assumption_key]
                        : undefined;
                      return (
                        <tr key={component.key} className="border-b border-line/70 last:border-0">
                          <td className="py-1.5 pr-3">
                            <span className="font-medium text-ink">{component.label}</span>
                            {assumption ? (
                              <span className="ml-1.5 inline-flex items-center gap-1 align-middle">
                                <span className="chip">{assumption.value.toLocaleString("en-IN")} {assumption.unit}</span>
                                <InfoTip text={`${assumption.label} — ${assumption.source}`} />
                              </span>
                            ) : null}
                            <p className="text-[10.5px] leading-4 text-subtle">{component.note}</p>
                          </td>
                          <td className="num w-24 py-1.5 text-right font-medium text-ink">
                            {component.key === "base_price" ? "" : "+"}
                            {inr(component.amount)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td className="pt-2 text-[12px] font-semibold text-ink">Effective price</td>
                      <td className="num pt-2 text-right text-[13px] font-semibold text-ink">
                        {inr(offer.effective.effective_price)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-2 text-[10.5px] leading-4 text-subtle">
                  Values come from editable illustrative assumptions — see the assumptions table below.
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
      <p className="px-5 py-2.5 text-[10.5px] leading-4 text-subtle">
        Bars are scaled from ₹0 to {inr(max)} — the highest effective price in this comparison set. The marker shows the
        listed price, the bar shows the effective price after the adjustments above.
      </p>
    </div>
  );
}
