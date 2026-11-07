import { ArrowRight, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import type { MatchEvidence, PairEvidence } from "../../types";
import { confidence } from "../../utils/format";
import { BandBadge } from "../ui/Badge";
import { EvidenceBar } from "./EvidenceBar";

const FEATURE_LABELS: Record<string, string> = {
  name: "Name similarity",
  geo: "Location proximity",
  address: "Address similarity",
  attributes: "Attribute agreement",
};

/** Contribution keys (name/geo/address/attributes) map to the raw evidence fields. */
const FEATURE_VALUES: Record<string, keyof MatchEvidence> = {
  name: "name_similarity",
  geo: "geo_similarity",
  address: "address_similarity",
  attributes: "attribute_agreement",
};

export function IdentityEvidencePanel({ pair }: { pair: PairEvidence }) {
  const evidence = pair.evidence;
  const details: Record<string, string> = {
    name: "Core-name token overlap after removing locality and generic words.",
    geo:
      evidence.distance_m === null
        ? "Coordinates missing for at least one listing."
        : `${evidence.distance_m.toLocaleString("en-IN")} m apart (decay constant 1,200 m).`,
    address: "Normalized street and locality tokens compared across suppliers.",
    attributes: "Star class and canonicalized amenity sets compared after alias mapping.",
  };

  return (
    <div className="rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-[12.5px]">
          <span className="truncate font-medium text-ink">{pair.supplier_a}</span>
          <ArrowRight className="h-3 w-3 shrink-0 text-subtle" />
          <span className="truncate font-medium text-ink">{pair.supplier_b}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="num rounded bg-[#F8FAFC] px-1.5 py-0.5 text-[11.5px] font-semibold text-ink">
            {confidence(pair.confidence)}
          </span>
          <BandBadge band={pair.band} compact />
        </div>
      </div>

      <div className="grid gap-4 px-4 py-3.5 md:grid-cols-2">
        {Object.keys(FEATURE_LABELS).map((key) => (
          <EvidenceBar
            key={key}
            label={FEATURE_LABELS[key]}
            value={Number(evidence[FEATURE_VALUES[key]] ?? 0)}
            detail={details[key]}
            tone={key === "geo" ? "bg-sky-500" : key === "attributes" ? "bg-violet-500" : "bg-teal"}
          />
        ))}
      </div>

      <div className="grid gap-3 border-t border-line px-4 py-3 md:grid-cols-2">
        <div>
          <p className="section-label mb-1.5">Weighted contribution</p>
          <ul className="space-y-1">
            {Object.entries(evidence.contributions).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between text-[11.5px]">
                <span className="text-muted">
                  {FEATURE_LABELS[key]} <span className="text-subtle">× {evidence.weights[key]}</span>
                </span>
                <span className="num font-medium text-ink">+{(value * 100).toFixed(1)} pts</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <div>
            <p className="section-label mb-1.5">Conflicts</p>
            {pair.conflicts.length === 0 ? (
              <p className="flex items-center gap-1 text-[11.5px] text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> None detected
              </p>
            ) : (
              <ul className="space-y-1">
                {pair.conflicts.map((conflict) => (
                  <li key={conflict} className="flex items-start gap-1 text-[11.5px] text-amber-800">
                    <XCircle className="mt-0.5 h-3 w-3 shrink-0" /> {conflict}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="section-label mb-1.5">Missing information</p>
            {pair.missing.length === 0 ? (
              <p className="flex items-center gap-1 text-[11.5px] text-muted">
                <MinusCircle className="h-3 w-3" /> Nothing missing
              </p>
            ) : (
              <ul className="space-y-1">
                {pair.missing.map((item) => (
                  <li key={item} className="flex items-start gap-1 text-[11.5px] text-muted">
                    <MinusCircle className="mt-0.5 h-3 w-3 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {pair.evidence.caps_applied.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-amber-800">Safety cap applied</p>
              <p className="mt-0.5 text-[11px] leading-4 text-amber-800">{pair.evidence.caps_applied.join("; ")}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
