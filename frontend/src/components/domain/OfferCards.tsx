import { AlertTriangle, Check, Crown, Tag, X } from "lucide-react";
import type { CompareResponse, EvaluatedOffer } from "../../types";
import { inr, isIncluded } from "../../utils/format";

/** Per-supplier visual identity. Three fictional suppliers, three accents. */
const SUPPLIER_THEME: Record<string, { bar: string; tint: string; dot: string; ring: string; text: string }> = {
  atlas: { bar: "bg-ocean", tint: "bg-ocean-tint/50", dot: "bg-ocean", ring: "border-ocean/40", text: "text-ocean-dark" },
  meridian: { bar: "bg-teal", tint: "bg-teal-tint/50", dot: "bg-teal", ring: "border-teal/40", text: "text-teal-dark" },
  horizon: { bar: "bg-gold", tint: "bg-gold-tint/60", dot: "bg-gold", ring: "border-gold/50", text: "text-gold-ink" },
};

const FALLBACK_THEME = { bar: "bg-navy", tint: "bg-slate-50", dot: "bg-navy", ring: "border-line", text: "text-navy" };

function themeFor(code: string) {
  return SUPPLIER_THEME[code.toLowerCase()] ?? FALLBACK_THEME;
}

function Term({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium ${
        included ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-line bg-slate-50 text-slate-500"
      }`}
    >
      {included ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
      {children}
    </span>
  );
}

function OfferCard({
  offer,
  data,
  maxEffective,
}: {
  offer: EvaluatedOffer;
  data: CompareResponse;
  maxEffective: number;
}) {
  const theme = themeFor(offer.supplier_code);
  const isRecommended = offer.id === data.recommended_offer_id;
  const isCheapestListed = offer.id === data.cheapest_listed_offer_id;
  const meals = data.category === "hotel" ? offer.meal_plan : offer.meals;
  const refundable = data.category === "hotel" ? offer.refundable : (offer.cancellation_policy ?? "").toLowerCase().includes("free");
  const effectivePct = (offer.effective.effective_price / maxEffective) * 100;
  const listedPct = (offer.listed_price / maxEffective) * 100;

  return (
    <article
      className={`card relative flex flex-col overflow-hidden transition-all duration-200 ${
        isRecommended ? "border-teal/50 shadow-raised ring-1 ring-teal/20" : "card-hover"
      }`}
    >
      <span className={`absolute inset-x-0 top-0 h-[3px] ${isRecommended ? "bg-teal" : theme.bar} opacity-90`} aria-hidden="true" />

      <header className="flex items-start justify-between gap-2 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
            <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
            {offer.supplier_name.replace("Supplier ", "")}
          </p>
          <p className="mono mt-0.5 text-[10.5px] text-subtle">{offer.supplier_property_id}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isRecommended ? (
            <span className="pill border-teal/40 bg-teal-tint text-[10px] font-semibold text-teal-dark">
              <Crown className="h-2.5 w-2.5" /> Recommended
            </span>
          ) : null}
          {isCheapestListed ? (
            <span className="pill border-gold/60 bg-gold-tint text-[10px] font-semibold text-gold-ink">
              <Tag className="h-2.5 w-2.5" /> Lowest listed
            </span>
          ) : null}
        </div>
      </header>

      <div className={`mx-4 rounded-lg border p-3 ${isRecommended ? "border-teal/30 bg-teal-tint/40" : "border-line bg-[#FBFCFE]"}`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">Effective price</p>
          <p className="num text-[10.5px] text-subtle">
            listed <span className="font-semibold text-slate-500">{inr(offer.listed_price)}</span>
          </p>
        </div>
        <p className="num mt-1 text-[24px] font-semibold leading-7 tracking-[-0.02em] text-ink">
          {inr(offer.effective.effective_price)}
          <span className="ml-1 text-[10.5px] font-normal text-subtle">
            {data.category === "hotel" ? "/ room / night" : "/ person"}
          </span>
        </p>
        <p className={`mt-0.5 text-[11px] font-medium ${offer.effective.uplift > 0 ? "text-gold-ink" : "text-teal-dark"}`}>
          {offer.effective.uplift > 0
            ? `+${inr(offer.effective.uplift)} (${offer.effective.uplift_pct.toFixed(0)}%) in adjustments`
            : "no adjustments — price already covers the inclusions"}
        </p>

        {/* Listed vs effective bar */}
        <div className="relative mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <span className="absolute inset-y-0 left-0 rounded-full bg-navy/20" style={{ width: `${listedPct}%` }} />
          {offer.effective.uplift > 0 ? (
            <span
              className="absolute inset-y-0 rounded-full bg-gold"
              style={{ left: `${listedPct}%`, width: `${Math.max(effectivePct - listedPct, 0.6)}%` }}
            />
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pt-3">
        <Term included={isIncluded(meals)}>{meals ?? "Not stated"}</Term>
        <Term included={refundable}>
          {data.category === "hotel"
            ? offer.refundable
              ? `Free cancel ${offer.cancellation_deadline_hours}h`
              : "Non-refundable"
            : (offer.cancellation_policy ?? "Policy not stated")}
        </Term>
        <Term included={offer.payment_terms !== "Pay now" && data.category === "hotel"}>{offer.payment_terms}</Term>
      </div>

      <div className="mt-auto px-4 pb-4 pt-3">
        <div className="flex items-center justify-between text-[10.5px] text-muted">
          <span className="font-semibold uppercase tracking-[0.07em]">Profile fit</span>
          <span className="num font-semibold text-ink">
            {offer.fit_score.toFixed(1)}
            <span className="text-subtle"> / 100 · rank {offer.fit_rank}</span>
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-1.5 rounded-full ${isRecommended ? "bg-teal" : theme.bar} opacity-80`}
            style={{ width: `${offer.fit_score}%` }}
            title={`Weighted fit score ${offer.fit_score.toFixed(1)} out of 100 for ${data.profile.name}`}
          />
        </div>

        <p className="mt-2 text-[11px] leading-4 text-ink/80">
          <span className={`font-semibold ${theme.text}`}>Why: </span>
          {offer.reasons[0] ?? offer.summary}
        </p>
        {offer.warnings.length > 0 ? (
          <p className="mt-1 flex items-start gap-1 text-[10.5px] leading-4 text-coral-dark">
            <AlertTriangle className="mt-0.5 h-2.5 w-2.5 shrink-0" /> {offer.warnings[0]}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function OfferCards({ data }: { data: CompareResponse }) {
  const maxEffective = Math.max(...data.offers.map((offer) => offer.effective.effective_price));
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {data.offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} data={data} maxEffective={maxEffective} />
      ))}
    </div>
  );
}
