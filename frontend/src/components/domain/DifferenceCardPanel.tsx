import { Check, CircleDollarSign, MinusCircle, Sparkles } from "lucide-react";
import type { CompareResponse } from "../../types";
import { inr } from "../../utils/format";

export function DifferenceCardPanel({ data }: { data: CompareResponse }) {
  const recommended = data.offers.find((offer) => offer.id === data.recommended_offer_id);
  const card = data.difference_card;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="section-label mb-2">What is identical</p>
          {card.identical.length === 0 ? (
            <p className="text-[12px] text-muted">Nothing is identical across these offers.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {card.identical.map((item) => (
                <li key={item.label} className="chip">
                  <Check className="h-3 w-3 text-emerald-600" /> {item.label}: {String(item.value ?? "—")}
                </li>
              ))}
            </ul>
          )}

          <p className="section-label mb-2 mt-4">What is different</p>
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="table">
              <thead>
                <tr>
                  <th className="th w-[130px]">Dimension</th>
                  {data.offers.map((offer) => (
                    <th key={`h-${offer.id}`} className="th">
                      {offer.supplier_name.replace("Supplier ", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {card.different.map((row) => (
                  <tr key={row.label} className="row-hover">
                    <td className="td-tight font-medium text-muted">{row.label}</td>
                    {data.offers.map((offer) => (
                      <td key={`${row.label}-${offer.id}`} className="td-tight text-[11.5px] text-ink">
                        {String(row.values[offer.supplier_name] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="section-label mb-2">Included</p>
            <ul className="space-y-1.5">
              {Object.entries(card.included).map(([supplier, items]) => (
                <li key={supplier} className="text-[11.5px]">
                  <span className="font-medium text-ink">{supplier.replace("Supplier ", "")}:</span>{" "}
                  <span className="text-muted">{items.join(", ") || "—"}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="section-label mb-2">Excluded</p>
            <ul className="space-y-1.5">
              {Object.entries(card.excluded).map(([supplier, items]) => (
                <li key={supplier} className="text-[11.5px]">
                  <span className="font-medium text-ink">{supplier.replace("Supplier ", "")}:</span>{" "}
                  <span className="text-muted">{items.join(", ") || "nothing excluded"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-teal/30 bg-white p-4 shadow-card">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-teal-dark" />
            <p className="text-[12.5px] font-semibold text-ink">
              Why {card.recommended_supplier.replace("Supplier ", "")} suits this profile
            </p>
          </div>
          <p className="mt-1.5 text-[12px] leading-5 text-muted">{data.recommendation_reason}</p>
          {recommended ? (
            <ul className="mt-2.5 space-y-1.5">
              {recommended.reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-1.5 text-[11.5px] leading-4 text-ink/80">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-teal-dark" /> {reason}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[11.5px]">
            <div>
              <p className="text-muted">Listed price</p>
              <p className="num font-semibold text-ink">{recommended ? inr(recommended.listed_price) : "—"}</p>
            </div>
            <div>
              <p className="text-muted">Effective price</p>
              <p className="num font-semibold text-ink">
                {recommended ? inr(recommended.effective.effective_price) : "—"}
              </p>
            </div>
          </div>
        </div>

        {data.cheapest_trap_note ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-center gap-1.5">
              <CircleDollarSign className="h-3.5 w-3.5 text-amber-700" />
              <p className="text-[12.5px] font-semibold text-amber-900">Cheapest is not automatically best</p>
            </div>
            <p className="mt-1.5 text-[12px] leading-5 text-amber-900/90">{data.cheapest_trap_note}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11.5px]">
              <div>
                <p className="text-amber-800/80">Lowest listed</p>
                <p className="num font-semibold text-amber-900">
                  {inr(data.offers.find((offer) => offer.id === data.cheapest_listed_offer_id)?.listed_price ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-amber-800/80">Lowest effective</p>
                <p className="num font-semibold text-amber-900">
                  {inr(data.offers.find((offer) => offer.id === data.cheapest_effective_offer_id)?.effective.effective_price ?? 0)}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-line bg-white p-4">
          <p className="section-label mb-2">Recommendation warnings</p>
          {recommended && recommended.warnings.length > 0 ? (
            <ul className="space-y-1.5">
              {recommended.warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-1.5 text-[11.5px] leading-4 text-amber-800">
                  <MinusCircle className="mt-0.5 h-3 w-3 shrink-0" /> {warning}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11.5px] text-muted">No warnings on the recommended offer.</p>
          )}
          <p className="mt-3 border-t border-line pt-2.5 text-[10.5px] leading-4 text-subtle">{data.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
