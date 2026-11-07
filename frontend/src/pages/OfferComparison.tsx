import { AlertTriangle, ArrowRightLeft, Info, Pencil, Scale, Settings2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DifferenceCardPanel } from "../components/domain/DifferenceCardPanel";
import { EffectivePricePanel } from "../components/domain/EffectivePricePanel";
import { OfferCards } from "../components/domain/OfferCards";
import { OfferComparisonTable } from "../components/domain/OfferComparisonTable";
import { ProfileSelector } from "../components/domain/ProfileSelector";
import { DemoDataTag } from "../components/ui/Badge";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { WeightEditor } from "../components/ui/WeightEditor";
import { useWorkspace } from "../context/WorkspaceContext";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import type { CompareResponse } from "../types";
import { inr } from "../utils/format";

const PRODUCTS = [
  { code: "HG-1001", label: "The Grand Imperial, New Delhi" },
  { code: "HG-1003", label: "Taj Palace, New Delhi" },
  { code: "HG-1002", label: "The Leela Palace, New Delhi" },
  { code: "HG-1004", label: "ITC Mughal, Agra" },
  { code: "HG-1006", label: "The Oberoi, Mumbai" },
  { code: "SG-2001", label: "Taj Mahal Guided Experience, Agra" },
  { code: "SG-2004", label: "Amber Fort Guided Experience, Jaipur" },
  { code: "SG-2005", label: "Agra Fort Guided Tour, Agra" },
];

export function OfferComparison() {
  const [params, setParams] = useSearchParams();
  const { pushToast } = useWorkspace();
  const groupCode = params.get("group") ?? "HG-1001";
  const classParam = params.get("class");
  const profileParam = params.get("profile") ?? "flexible";

  const [profileKey, setProfileKey] = useState(profileParam);
  const [customWeights, setCustomWeights] = useState<Record<string, number> | null>(null);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [draftWeights, setDraftWeights] = useState<Record<string, number>>({});
  const [previousRecommendation, setPreviousRecommendation] = useState<string | null>(null);

  const { data, loading, error, reload } = useApi<CompareResponse>(
    () =>
      api.compare({
        group_code: groupCode,
        equivalence_class: classParam,
        profile_key: profileKey,
        weights: customWeights ?? undefined,
      }),
    [groupCode, classParam, profileKey, JSON.stringify(customWeights)],
  );

  // Surfaces the fact that the recommendation is profile-dependent, not fixed.
  useEffect(() => {
    if (!data) return;
    const current = data.offers.find((offer) => offer.id === data.recommended_offer_id)?.supplier_name ?? null;
    if (previousRecommendation && current && current !== previousRecommendation) {
      pushToast({
        tone: "info",
        title: `Recommendation changed to ${current.replace("Supplier ", "")}`,
        detail: `The ${data.profile.name} profile weights different dimensions.`,
      });
    }
    setPreviousRecommendation(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.recommended_offer_id, data?.profile.key]);

  const selectProfile = (key: string) => {
    setProfileKey(key);
    setCustomWeights(null);
    const next = new URLSearchParams(params);
    next.set("profile", key);
    setParams(next, { replace: true });
  };

  const openWeights = () => {
    if (!data) return;
    setDraftWeights(customWeights ?? data.profile.weights);
    setWeightsOpen(true);
  };

  const applyWeights = () => {
    setCustomWeights(draftWeights);
    setWeightsOpen(false);
    pushToast({ tone: "success", title: "Custom preference profile applied", detail: "Recommendation recalculated." });
  };

  return (
    <>
      <PageHeader
        eyebrow="Intelligence · Offer comparison"
        title="Compare supplier offers"
        description="The cheapest listed price is not automatically the best offer. Effective price prices in missing inclusions and restrictive terms; the fit score then weights them against the selected client profile."
        meta={
          <>
            <DemoDataTag label="Illustrative prices & assumptions" />
            <span className="chip">
              <Scale className="h-3 w-3" /> Layer 2 + layer 3 comparison
            </span>
          </>
        }
        actions={
          <label className="flex items-center gap-2">
            <span className="section-label">Product</span>
            <select
              value={groupCode}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                next.set("group", event.target.value);
                next.delete("class");
                setParams(next);
              }}
              className="select w-[280px]"
            >
              {PRODUCTS.map((product) => (
                <option key={product.code} value={product.code}>
                  {product.label}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {loading ? (
        <LoadingState label="Building the offer comparison…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.empty ? (
        <EmptyState title="No comparable offers found" detail="Choose another room or activity class." />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={data.group.canonical_name}
              subtitle={`${data.category === "hotel" ? "Room class" : "Activity class"}: ${data.equivalence_class} · ${data.offers.length} bookable offers from ${data.offers.length} suppliers`}
              badge={<span className="chip">Selected profile: {data.profile.name}</span>}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  {data.classes.length > 1 ? (
                    <select
                      value={data.equivalence_class ?? ""}
                      onChange={(event) => {
                        const next = new URLSearchParams(params);
                        next.set("class", event.target.value);
                        setParams(next);
                      }}
                      className="select w-[210px]"
                    >
                      {data.classes.map((option) => (
                        <option key={option.equivalence_class} value={option.equivalence_class}>
                          {option.label} ({option.supplier_count} suppliers)
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <button type="button" onClick={openWeights} className="btn-secondary btn-sm">
                    <Pencil className="h-3 w-3" /> Weights
                  </button>
                </div>
              }
            />
            <div className="space-y-3 px-5 py-4">
              <ProfileSelector
                profiles={data.profiles}
                activeKey={customWeights ? "custom" : data.profile.key}
                onSelect={selectProfile}
                onCustomize={openWeights}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="section-label mr-1">Weights in use</span>
                {Object.entries(data.weights).map(([key, value]) => (
                  <span key={key} className="chip num">
                    {data.dimension_labels[key] ?? key} {value}%
                  </span>
                ))}
                {customWeights ? <span className="pill border-teal/40 bg-teal-tint text-teal-dark">Custom profile</span> : null}
              </div>
            </div>
          </Card>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="section-label">Supplier offers at a glance</p>
                <p className="mt-1 max-w-3xl text-[12px] leading-5 text-muted">
                  <span className="font-semibold text-ink">Why this wins: </span>
                  {data.recommendation_reason}
                </p>
              </div>
              <span className="chip">
                <Sparkles className="h-3 w-3" /> Profile: {data.profile.name}
              </span>
            </div>
            <OfferCards data={data} />
          </section>

          <Card>
            <CardHeader
              title="Structured offer comparison"
              subtitle="Every row is a commercial dimension. Identical product identity does not make these offers interchangeable."
              actions={<span className="chip">Layer 2 + 3</span>}
            />
            <OfferComparisonTable data={data} />
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
            <Card>
              <CardHeader
                title="Effective-price comparison"
                subtitle="Listed price versus effective price, with every adjustment traceable to a named assumption."
                badge={<DemoDataTag label="Decision-support estimate" />}
              />
              <EffectivePricePanel data={data} />
            </Card>

            <Card>
              <CardHeader
                title="Assumptions used in this comparison"
                subtitle="Editable illustrative values. No verified market-rate source was available for this prototype."
              />
              <div className="overflow-x-auto scroll-thin">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="th">Assumption</th>
                      <th className="th text-right">Value</th>
                      <th className="th">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assumptions
                      .filter((assumption) => assumption.category === data.category)
                      .map((assumption) => (
                        <tr key={assumption.key} className="row-hover">
                          <td className="td">{assumption.label}</td>
                          <td className="td whitespace-nowrap text-right">
                            <span className="num text-[12px] font-medium text-ink">
                              {assumption.value.toLocaleString("en-IN")}
                            </span>
                            <span className="ml-1 text-[10.5px] text-subtle">{assumption.unit}</span>
                          </td>
                          <td className="td text-[10.5px] leading-4 text-amber-800">{assumption.source}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-start gap-1.5 border-t border-line bg-[#FBFCFE] px-5 py-2.5">
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-muted" />
                <p className="text-[10.5px] leading-4 text-muted">
                  {data.disclaimer}{" "}
                  <Link to="/settings" className="link text-[10.5px]">
                    <Settings2 className="h-2.5 w-2.5" /> Edit assumptions in Settings
                  </Link>
                </p>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Difference card"
              subtitle="What is identical, what is different, what is included and excluded — and why the recommendation fits the selected client profile."
              badge={<span className="chip">{data.profile.name}</span>}
            />
            <div className="p-4">
              <DifferenceCardPanel data={data} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Recommendation trace" subtitle="How the fit score was reached for each offer." />
            <div className="grid gap-4 p-5 lg:grid-cols-3">
              {data.offers.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-line p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12.5px] font-semibold text-ink">{offer.supplier_name}</p>
                    <span className="num text-[12px] font-semibold text-ink">{offer.fit_score.toFixed(1)}</span>
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-muted">
                    {inr(offer.effective.effective_price)} effective · rank {offer.fit_rank}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {Object.entries(offer.contributions).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-[10.5px] text-muted">
                          <span>{data.dimension_labels[key]}</span>
                          <span className="num">{(value * 100).toFixed(1)} pts</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-1 rounded-full bg-teal" style={{ width: `${Math.min(100, value * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <ul className="mt-2 space-y-1 border-t border-line pt-2">
                    {offer.reasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-1 text-[10.5px] leading-4 text-ink/75">
                        <Sparkles className="mt-0.5 h-2.5 w-2.5 shrink-0 text-teal-dark" /> {reason}
                      </li>
                    ))}
                    {offer.warnings.map((warning) => (
                      <li key={warning} className="flex items-start gap-1 text-[10.5px] leading-4 text-amber-800">
                        <AlertTriangle className="mt-0.5 h-2.5 w-2.5 shrink-0" /> {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-[#FBFCFE] px-5 py-2.5 text-[11px] text-muted">
              <ArrowRightLeft className="h-3 w-3" />
              Change the client profile above — the effective prices stay the same, the recommendation does not.
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={weightsOpen}
        onClose={() => setWeightsOpen(false)}
        title="Customize client preferences"
        subtitle="Adjust how much this profile cares about each dimension. Weights are normalized to 100."
        footer={
          <>
            <Button variant="ghost" onClick={() => setWeightsOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={applyWeights}>
              Apply weights
            </Button>
          </>
        }
      >
        <WeightEditor
          weights={draftWeights}
          labels={data?.dimension_labels ?? { price: "Effective price" }}
          onChange={setDraftWeights}
        />
        <p className="mt-4 rounded-lg border border-line bg-[#F8FAFC] px-3 py-2 text-[11px] leading-4 text-muted">
          Dimension scores are relative to the offers in this comparison set. Changing weights never changes an offer's
          effective price — only its fit for the client.
        </p>
      </Modal>
    </>
  );
}
