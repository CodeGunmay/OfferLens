import { Activity, Beaker, ClipboardList, Database, Info } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DemoDataTag } from "../components/ui/Badge";
import { Card, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/States";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";

export function Analytics() {
  const { data, loading, error, reload } = useApi(() => api.analytics(), []);

  if (loading) return <LoadingState label="Loading measurement plan…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const calibration = data.sample_scenarios.find((scenario) => scenario.key === "calibration_sample");
  const reviewMix = data.sample_scenarios.find((scenario) => scenario.key === "review_mix_sample");

  const grouped = data.metrics.reduce<Record<string, typeof data.metrics>>((accumulator, metric) => {
    accumulator[metric.group] = [...(accumulator[metric.group] ?? []), metric];
    return accumulator;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Governance · Analytics"
        title="Measurement plan"
        description="What OfferLens will be evaluated on once labelled data exists. No model has been trained or validated in this prototype, so every metric below is marked as pending rather than populated with a fabricated number."
        meta={
          <>
            <DemoDataTag label="No measured results" />
            <span className="chip">
              <Beaker className="h-3 w-3" /> 10 evaluation metrics defined
            </span>
          </>
        }
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div>
          <p className="text-[12px] font-semibold text-amber-900">{data.notice}</p>
          <p className="mt-0.5 text-[11.5px] leading-4 text-amber-900/85">{data.summary}</p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([group, metrics]) => (
          <Card key={group}>
            <CardHeader title={group} subtitle="Definition, measurement method and proposed acceptance bar." />
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.key} className="rounded-xl border border-line bg-white p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-semibold text-ink">{metric.label}</p>
                    <span className="pill shrink-0 border-amber-200 bg-amber-50 text-[9.5px] font-semibold uppercase tracking-wide text-amber-800">
                      Pending
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-4 text-muted">{metric.definition}</p>
                  <dl className="mt-2 space-y-1 border-t border-line pt-2 text-[10.5px]">
                    <div className="flex gap-1.5">
                      <dt className="shrink-0 text-subtle">Method</dt>
                      <dd className="text-muted">{metric.method}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="shrink-0 text-subtle">Bar</dt>
                      <dd className="text-ink/80">{metric.target}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-amber-700">{metric.status}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <div className="grid gap-4 lg:grid-cols-2">
          {calibration ? (
            <Card>
              <CardHeader title={calibration.title} subtitle={calibration.note} badge={<DemoDataTag label="Sample scenario" />} />
              <div className="h-[240px] px-3 py-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calibration.series} margin={{ top: 6, right: 14, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="band" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <YAxis domain={[0.4, 1]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11.5 }} />
                    <Line type="monotone" dataKey="predicted" name="Predicted confidence" stroke="#0F2A44" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="observed" name="Observed accuracy" stroke="#16B8A6" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="border-t border-line px-5 py-2.5 text-[10.5px] text-muted">
                Illustrative shape only — an arbitrary sample, not the output of a trained model. The two lines sit close
                together because the sample is drawn to look well calibrated; nothing here is measured.
              </p>
            </Card>
          ) : null}

          {reviewMix ? (
            <Card>
              <CardHeader title={reviewMix.title} subtitle={reviewMix.note} badge={<DemoDataTag label="Sample scenario" />} />
              <div className="space-y-3 px-5 py-4">
                {reviewMix.series.map((row) => {
                  const share = Number(row.share);
                  const tone = row.band === "High" ? "bg-teal" : row.band === "Medium" ? "bg-amber-400" : "bg-slate-300";
                  return (
                    <div key={String(row.band)}>
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="font-medium text-ink">{String(row.band)} confidence</span>
                        <span className="num text-muted">{share}% of queue</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-lg border border-line bg-[#F8FAFC] p-3">
                  <p className="section-label mb-1.5 flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Why this matters
                  </p>
                  <p className="text-[11px] leading-4 text-muted">
                    Human-review share is the operational cost of the system. A matcher that is accurate but routes every
                    pair to review saves an agent nothing.
                  </p>
                </div>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Data requirements" subtitle="What must be true before any result is published." />
            <ul className="divide-y divide-line">
              {data.data_requirements.map((requirement) => (
                <li key={requirement} className="flex items-start gap-2 px-5 py-2.5">
                  <Database className="mt-0.5 h-3 w-3 shrink-0 text-muted" />
                  <span className="text-[12px] leading-5 text-ink/80">{requirement}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Measurement plan" subtitle="Five steps from labelled sample to pilot." />
            <ol className="divide-y divide-line">
              {data.measurement_plan.map((step) => (
                <li key={step.step} className="flex items-start gap-3 px-5 py-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-navy/[0.07] text-[10.5px] font-semibold text-navy">
                    {step.step}
                  </span>
                  <div>
                    <p className="text-[12px] font-medium text-ink">{step.title}</p>
                    <p className="text-[11px] leading-4 text-muted">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex items-center gap-1.5 border-t border-line bg-[#FBFCFE] px-5 py-2.5 text-[10.5px] text-muted">
              <ClipboardList className="h-3 w-3" /> Every metric on this page remains "results pending" until a labelled
              dataset exists.
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
