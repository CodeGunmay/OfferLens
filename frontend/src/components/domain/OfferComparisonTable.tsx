import { Check, Crown, Minus, Tag, X } from "lucide-react";
import type { CompareResponse, EvaluatedOffer } from "../../types";
import { inr, isIncluded } from "../../utils/format";
import { Meter } from "../ui/Meter";

const ATTRIBUTE_ROWS: Record<string, { label: string; render: (offer: EvaluatedOffer) => React.ReactNode }[]> = {
  hotel: [
    {
      label: "Room configuration",
      render: (offer) => (
        <span>
          <span className="block text-[12.5px] font-medium text-ink">{offer.room_category}</span>
          <span className="block text-[11px] text-muted">
            {offer.bed_type} · {offer.view} · up to {offer.max_occupancy} guests
          </span>
        </span>
      ),
    },
    {
      label: "Listed price",
      render: (offer) => <span className="num text-[13.5px] font-semibold text-ink">{inr(offer.listed_price)}</span>,
    },
    {
      label: "Effective price",
      render: (offer) => (
        <span>
          <span className="num block text-[13px] font-semibold text-ink">{inr(offer.effective.effective_price)}</span>
          <span className={`block text-[10.5px] ${offer.effective.uplift > 0 ? "text-amber-700" : "text-muted"}`}>
            {offer.effective.uplift > 0 ? `+${inr(offer.effective.uplift)} adjustments` : "no adjustments"}
          </span>
        </span>
      ),
    },
    { label: "Meals", render: (offer) => <Cell text={offer.meal_plan ?? "—"} positive={isIncluded(offer.meal_plan)} /> },
    {
      label: "Cancellation",
      render: (offer) =>
        offer.refundable ? (
          <Cell text={`Free until ${offer.cancellation_deadline_hours}h before arrival`} positive />
        ) : (
          <Cell text="Non-refundable" positive={false} />
        ),
    },
    { label: "Payment terms", render: (offer) => <Cell text={offer.payment_terms} positive={offer.payment_terms !== "Pay now"} /> },
    {
      label: "Availability",
      render: (offer) => (
        <span className={`num text-[12.5px] ${offer.availability <= 2 ? "font-semibold text-amber-700" : "text-ink"}`}>
          {offer.availability} rooms
        </span>
      ),
    },
  ],
  sightseeing: [
    {
      label: "Tour configuration",
      render: (offer) => (
        <span>
          <span className="block text-[12.5px] font-medium text-ink">{offer.activity_name}</span>
          <span className="block text-[11px] text-muted">
            {offer.experience_type} · max {offer.max_group_size} guests
          </span>
        </span>
      ),
    },
    { label: "Duration", render: (offer) => <span className="num text-[13px] text-ink">{offer.duration_hours}h</span> },
    {
      label: "Access",
      render: (offer) => <Cell text={offer.access_type ?? "—"} positive={(offer.access_type ?? "").toLowerCase().includes("skip")} />,
    },
    {
      label: "Transfers",
      render: (offer) => <Cell text={offer.transfers ?? "—"} positive={isIncluded(offer.transfers)} />,
    },
    { label: "Meals", render: (offer) => <Cell text={offer.meals ?? "—"} positive={isIncluded(offer.meals)} /> },
    {
      label: "Cancellation",
      render: (offer) => <Cell text={offer.cancellation_policy ?? "—"} positive={(offer.cancellation_policy ?? "").toLowerCase().includes("free")} />,
    },
    {
      label: "Listed price",
      render: (offer) => (
        <span className="num text-[13.5px] font-semibold text-ink">
          {inr(offer.listed_price)}
          <span className="ml-1 text-[10.5px] font-normal text-muted">/ person</span>
        </span>
      ),
    },
    {
      label: "Effective price",
      render: (offer) => (
        <span>
          <span className="num block text-[13px] font-semibold text-ink">{inr(offer.effective.effective_price)}</span>
          <span className={`block text-[10.5px] ${offer.effective.uplift > 0 ? "text-amber-700" : "text-muted"}`}>
            {offer.effective.uplift > 0 ? `+${inr(offer.effective.uplift)} adjustments` : "no adjustments"}
          </span>
        </span>
      ),
    },
    {
      label: "Availability",
      render: (offer) => <span className="num text-[12.5px] text-ink">{offer.availability} slots</span>,
    },
  ],
};

function Cell({ text, positive }: { text: string; positive: boolean }) {
  return (
    <span className={`inline-flex items-start gap-1 text-[12px] ${positive ? "text-emerald-700" : "text-slate-500"}`}>
      {positive ? <Check className="mt-0.5 h-3 w-3 shrink-0" /> : <Minus className="mt-0.5 h-3 w-3 shrink-0" />}
      {text}
    </span>
  );
}

export function OfferComparisonTable({ data }: { data: CompareResponse }) {
  const rows = ATTRIBUTE_ROWS[data.category] ?? ATTRIBUTE_ROWS.hotel;

  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="th w-[190px] sticky left-0 z-10 bg-[#F8FAFC]">Comparison point</th>
            {data.offers.map((offer) => {
              const isRecommended = offer.id === data.recommended_offer_id;
              const isCheapestListed = offer.id === data.cheapest_listed_offer_id;
              return (
                <th
                  key={offer.id}
                  className={`th min-w-[210px] align-top normal-case tracking-normal ${
                    isRecommended ? "bg-teal-tint" : "bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-semibold text-ink">{offer.supplier_name}</span>
                    {isRecommended ? (
                      <span className="pill border-teal/40 bg-white text-[10px] font-semibold text-teal-dark">
                        <Crown className="h-2.5 w-2.5" /> Recommended
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span className="mono text-[10.5px] font-normal text-subtle">{offer.supplier_property_id}</span>
                    {isCheapestListed ? (
                      <span className="pill border-amber-200 bg-amber-50 text-[10px] font-medium text-amber-800">
                        <Tag className="h-2.5 w-2.5" /> Lowest listed
                      </span>
                    ) : null}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="row-hover">
              <td className="td sticky left-0 z-10 bg-white text-[12px] font-medium text-muted">{row.label}</td>
              {data.offers.map((offer) => (
                <td
                  key={`${row.label}-${offer.id}`}
                  className={`td ${offer.id === data.recommended_offer_id ? "bg-teal-tint/40" : ""}`}
                >
                  {row.render(offer)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="td sticky left-0 z-10 bg-white font-medium text-muted">Profile fit score</td>
            {data.offers.map((offer) => (
              <td
                key={`fit-${offer.id}`}
                className={`td ${offer.id === data.recommended_offer_id ? "bg-teal-tint/40" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-full max-w-[120px] flex-1">
                    <Meter
                      value={offer.fit_score / 100}
                      tone={offer.id === data.recommended_offer_id ? "bg-teal" : "bg-slate-300"}
                      height="h-2"
                    />
                  </div>
                  <span className="num shrink-0 text-[12px] font-semibold text-ink">{offer.fit_score.toFixed(1)}</span>
                </div>
                <p className="mt-1 text-[10.5px] text-subtle">Weighted across the selected profile</p>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-3 border-t border-line bg-[#FBFCFE] px-4 py-2.5 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <Check className="h-3 w-3 text-emerald-600" /> inclusion present
        </span>
        <span className="inline-flex items-center gap-1">
          <X className="h-3 w-3 text-slate-400" /> not included
        </span>
        <span>{data.score_basis}</span>
      </div>
    </div>
  );
}
