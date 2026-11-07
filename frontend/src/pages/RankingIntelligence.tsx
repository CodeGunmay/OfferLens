import { ArrowRight, Info, ListOrdered, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { RankingTable } from "../components/domain/RankingTable";
import { DemoDataTag } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/States";
import { WeightEditor } from "../components/ui/WeightEditor";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { inr } from "../utils/format";

const PRODUCTS = [
  { code: "HG-1001", label: "The Grand Imperial, New Delhi" },
  { code: "HG-1003", label: "Taj Palace, New Delhi" },
  { code: "HG-1002", label: "The Leela Palace, New Delhi" },
  { code: "SG-2001", label: "Taj Mahal Guided Experience, Agra" },
  { code: "SG-2004", label: "Amber Fort Guided Experience, Jaipur" },
];

const LABELS: Record<string, string> = {
  effective_price: "Effective-price competitiveness",
  availability: "Availability",
  content_completeness: "Content completeness",
  cancellation: "Cancellation flexibility",
  match_confidence: "Match confidence",
};

export function RankingIntelligence() {
  const [groupCode, setGroupCode] = useState("HG-1001");
  const [weights, setWeights] = useState<Record<string, number> | null>(null);

  const { data, loading, error, reload } = useApi(
    () => api.ranking({ group_code: groupCode, weights: weights ?? undefined }),
    [groupCode, JSON.stringify(weights)],
  );

  useEffect(() => {
    if (data && !weights) setWeights(data.weights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const activeWeights = weights ?? data?.weights ?? {};

  return (
    <>
      <PageHeader
        eyebrow="Intelligence · Ranking"
        title="Listing-page ranking intelligence"
        description="A transparent scoring model over consolidated offers. Weights are visible and adjustable; popularity and conversion signals are deliberately excluded because this prototype has no booking data."
        meta={
          <>
            <DemoDataTag label="Illustrative weights" />
            <span className="chip">
              <ListOrdered className="h-3 w-3" /> {data?.offers.length ?? 0} consolidated offers
            </span>
            <span className="chip">No popularity signal</span>
          </>
        }
        actions={
          <label className="flex items-center gap-2">
            <span className="section-label">Product</span>
            <select value={groupCode} onChange={(event) => setGroupCode(event.target.value)} className="select w-[260px]">
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
        <LoadingState label="Scoring consolidated offers…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader
                title={`Proposed ranking — ${data.group.canonical_name}`}
                subtitle="Expand a row to see the component scores, weights and reasons behind its position."
                actions={<span className="chip">{data.equivalence_class}</span>}
              />
              <RankingTable rows={data.offers} />
              <div className="flex items-start gap-1.5 border-t border-line bg-[#FBFCFE] px-5 py-2.5">
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-muted" />
                <p className="text-[10.5px] leading-4 text-muted">{data.model_note}</p>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Model weights"
                subtitle="Adjust and the ranking recalculates immediately."
                actions={
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setWeights(data.default_weights)}
                    icon={<RotateCcw className="h-3 w-3" />}
                  >
                    Reset
                  </Button>
                }
              />
              <div className="px-5 py-4">
                <WeightEditor weights={activeWeights} labels={LABELS} onChange={setWeights} />
                <div className="mt-4 rounded-lg border border-line bg-[#F8FAFC] p-3">
                  <p className="section-label mb-1.5">Why no popularity weight?</p>
                  <p className="text-[11px] leading-4 text-muted">
                    A popularity signal would have to be invented. OfferLens only ranks on evidence the platform can
                    actually observe today: price competitiveness after adjustments, availability, content quality,
                    cancellation terms and match confidence.
                  </p>
                </div>
                <div className="mt-3 space-y-1.5">
                  {data.offers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between text-[11px]">
                      <span className="truncate text-muted">
                        #{offer.position} {offer.supplier_name.replace("Supplier ", "")}
                      </span>
                      <span className="num font-semibold text-ink">{offer.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Before and after consolidation"
              subtitle="What the agent sees today versus what a consolidated product identity enables."
              badge={<DemoDataTag />}
            />
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              <div className="rounded-xl border border-line bg-[#FBFCFE] p-4">
                <p className="section-label">{data.before.title}</p>
                <p className="mt-1 text-[11.5px] leading-4 text-muted">{data.before.problem}</p>
                <ul className="mt-3 space-y-2">
                  {data.before.fragmented.map((item, index) => (
                    <li key={`${item.supplier}-${index}`} className="rounded-lg border border-line bg-white p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-muted">{item.supplier}</span>
                        <span className="num text-[11.5px] font-semibold text-ink">{inr(item.price)}</span>
                      </div>
                      <p className="mt-0.5 text-[12px] font-medium text-ink">{item.title}</p>
                      <p className="text-[10.5px] text-muted">{item.line}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-teal/30 bg-white p-4">
                <p className="section-label flex items-center gap-1 text-teal-dark">
                  <Sparkles className="h-3 w-3" /> {data.after.title}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-ink">{data.after.product}</p>
                <p className="mt-1 text-[11.5px] leading-4 text-muted">{data.after.benefit}</p>
                <ul className="mt-3 space-y-2">
                  {data.after.offers.map((item) => (
                    <li key={`${item.position}-${item.supplier}`} className="flex items-center gap-2 rounded-lg border border-line bg-white p-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-navy text-[10px] font-semibold text-white">
                        {item.position}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-ink">{item.supplier.replace("Supplier ", "")}</p>
                        <p className="truncate text-[10.5px] text-muted">{item.offer}</p>
                      </div>
                      <div className="text-right">
                        <p className="num text-[12px] font-semibold text-ink">{inr(item.effective_price)}</p>
                        <p className="num text-[10px] text-subtle">score {item.score.toFixed(1)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-line bg-[#F8FAFC] px-2.5 py-2">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-teal-dark" />
                  <p className="text-[10.5px] leading-4 text-muted">
                    No conversion or revenue improvement is claimed. This prototype measures nothing; see Analytics for
                    the proposed measurement plan.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
