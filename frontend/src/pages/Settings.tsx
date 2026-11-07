import { useMemo, useState } from "react";
import { Check, Database, Save, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { DemoDataTag } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/States";
import { WeightEditor } from "../components/ui/WeightEditor";
import { useWorkspace } from "../context/WorkspaceContext";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";

const LABELS: Record<string, string> = {
  price: "Effective price",
  meals: "Meals included",
  cancellation: "Cancellation flexibility",
  payment: "Payment / logistics flexibility",
  convenience: "Convenience & content",
};

export function Settings() {
  const { pushToast } = useWorkspace();
  const { data, loading, error, reload } = useApi(() => api.settings(), []);
  const [drafts, setDrafts] = useState<Record<string, Record<string, number>>>({});
  const [thresholds, setThresholds] = useState<{ auto: number; review: number } | null>(null);

  const workspace = data?.workspace;
  const activeThresholds = thresholds ?? {
    auto: workspace?.auto_match_threshold ?? 0.85,
    review: workspace?.review_threshold ?? 0.72,
  };

  const profiles = useMemo(() => data?.profiles ?? [], [data]);

  const saveProfile = async (key: string) => {
    const weights = drafts[key];
    if (!weights) return;
    try {
      await api.updateProfileWeights(key, weights);
      pushToast({ tone: "success", title: "Profile weights saved", detail: `Default weights updated for this workspace.` });
      setDrafts((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      reload();
    } catch (caught) {
      pushToast({ tone: "error", title: "Could not save weights", detail: caught instanceof Error ? caught.message : "" });
    }
  };

  const saveThresholds = async () => {
    try {
      await api.updateSettings({
        auto_match_threshold: activeThresholds.auto,
        review_threshold: activeThresholds.review,
      });
      pushToast({ tone: "success", title: "Review thresholds saved" });
      reload();
    } catch (caught) {
      pushToast({ tone: "error", title: "Could not save thresholds", detail: caught instanceof Error ? caught.message : "" });
    }
  };

  if (loading) return <LoadingState label="Loading workspace settings…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <>
      <PageHeader
        eyebrow="Governance · Settings"
        title="Workspace settings"
        description="Thresholds, client preference profiles, value assumptions and dataset provenance for this demo workspace."
        meta={
          <>
            <DemoDataTag label="Demo configuration" />
            <span className="chip">
              <ShieldCheck className="h-3 w-3" /> {data.workspace.environment}
            </span>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader
            title="Matching thresholds"
            subtitle="Bands that decide whether a pair is auto-suggested, reviewed, or kept apart."
            actions={<Button size="sm" variant="accent" onClick={saveThresholds} icon={<Save className="h-3 w-3" />}>Save</Button>}
          />
          <div className="space-y-4 px-5 py-4">
            {[
              { key: "auto" as const, label: "Auto-suggest threshold (high band)", hint: "Pairs at or above this confidence can be suggested without review." },
              { key: "review" as const, label: "Review threshold (medium band)", hint: "Pairs between this and the auto threshold require a human decision." },
            ].map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-medium text-ink" htmlFor={`threshold-${item.key}`}>
                    {item.label}
                  </label>
                  <span className="num text-[12.5px] font-semibold text-ink">{activeThresholds[item.key].toFixed(2)}</span>
                </div>
                <input
                  id={`threshold-${item.key}`}
                  type="range"
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  value={activeThresholds[item.key]}
                  onChange={(event) =>
                    setThresholds((current) => ({
                      auto: current?.auto ?? activeThresholds.auto,
                      review: current?.review ?? activeThresholds.review,
                      [item.key]: Number(event.target.value),
                    }))
                  }
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal"
                />
                <p className="mt-1 text-[11px] leading-4 text-muted">{item.hint}</p>
              </div>
            ))}
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900">
              Threshold changes are stored for the demo workspace. They are not calibrated against a labelled dataset —
              see Analytics for the calibration plan.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Dataset provenance"
            subtitle="Where the numbers in this workspace come from."
            badge={<DemoDataTag label="Not TBO data" />}
          />
          <dl className="divide-y divide-line">
            {[
              ["Data source", data.workspace.data_source],
              ["Suppliers", "Supplier Atlas, Supplier Meridian, Supplier Horizon — fictional demo suppliers"],
              ["Listings", "30 synthetic supplier listings across 7 hotel products and 5 sightseeing products"],
              ["Real-world anchors", "City and attraction names only; coordinates approximate"],
              ["Images", "No supplier photography is reproduced; placeholders are used"],
              ["Model status", "Prototype heuristics only — no trained or validated model"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-3 px-5 py-2.5">
                <dt className="w-36 shrink-0 text-[11px] uppercase tracking-wide text-subtle">{label}</dt>
                <dd className="text-[12px] leading-5 text-ink/85">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-start gap-2 border-t border-line bg-[#FBFCFE] px-5 py-3">
            <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
            <p className="text-[11px] leading-4 text-muted">{data.data_notice}</p>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Client preference profiles"
          subtitle="Default weights used by the effective-price recommendation. Editing a profile changes the default in future comparisons."
        />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {profiles.map((profile) => {
            const draft = drafts[profile.key] ?? profile.weights;
            const dirty = Boolean(drafts[profile.key]);
            return (
              <div key={profile.key} className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{profile.name}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted">{profile.description}</p>
                  </div>
                  {profile.is_default ? (
                    <span className="pill border-teal/40 bg-teal-tint text-[10px] font-semibold text-teal-dark">Default</span>
                  ) : null}
                </div>
                <div className="mt-3">
                  <WeightEditor
                    weights={draft}
                    labels={LABELS}
                    onChange={(weights) => setDrafts((current) => ({ ...current, [profile.key]: weights }))}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant={dirty ? "accent" : "secondary"}
                    disabled={!dirty}
                    onClick={() => saveProfile(profile.key)}
                    icon={dirty ? <Save className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  >
                    {dirty ? "Save profile" : "Saved"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="Value assumptions"
          subtitle="Every monetary assumption used by the effective-price model, with its source label. All values are editable illustrative assumptions."
        />
        <div className="overflow-x-auto scroll-thin">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Assumption</th>
                <th className="th">Category</th>
                <th className="th text-right">Value</th>
                <th className="th">Source</th>
              </tr>
            </thead>
            <tbody>
              {data.assumptions.map((assumption) => (
                <tr key={assumption.key} className="row-hover">
                  <td className="td">{assumption.label}</td>
                  <td className="td capitalize text-muted">{assumption.category}</td>
                  <td className="td num text-right font-medium">
                    {assumption.value.toLocaleString("en-IN")}{" "}
                    <span className="text-[10.5px] font-normal text-subtle">{assumption.unit}</span>
                  </td>
                  <td className="td text-[10.5px] leading-4 text-amber-800">{assumption.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
