import { Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EvidenceBar } from "../components/domain/EvidenceBar";
import { MatchReviewModal } from "../components/domain/MatchReviewModal";
import { BandBadge, DemoDataTag, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { Tabs } from "../components/ui/Tabs";
import { useWorkspace } from "../context/WorkspaceContext";
import { useApi } from "../hooks/useApi";
import { useDebounced } from "../hooks/useDebounced";
import { api } from "../services/api";
import type { MatchRow } from "../types";
import { confidence, relativeTime } from "../utils/format";

type StatusTab = "pending" | "all" | "approved" | "rejected" | "separate";
type BandFilter = "all" | "high" | "medium" | "low";

export function MatchReview() {
  const { pushToast, refreshCounters } = useWorkspace();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<StatusTab>("pending");
  const [band, setBand] = useState<BandFilter>("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [sort, setSort] = useState("confidence");
  const [selected, setSelected] = useState<MatchRow | null>(null);
  const [busy, setBusy] = useState(false);
  const debouncedSearch = useDebounced(search, 220);

  const { data, loading, error, reload } = useApi(
    () => api.matches({ status, band, category, search: debouncedSearch, sort }),
    [status, band, category, debouncedSearch, sort],
  );

  const rows = useMemo(() => data?.items ?? [], [data]);
  const counts = data?.counts ?? {};

  const decide = async (row: MatchRow, decision: "approve" | "reject" | "separate" | "reset", note = "") => {
    setBusy(true);
    try {
      await api.decide(row.id, { decision, note, reviewer: "ops.ananya" });
      pushToast({
        tone: decision === "approve" ? "success" : decision === "reject" ? "warning" : "info",
        title:
          decision === "approve"
            ? "Match approved"
            : decision === "reject"
              ? "Match rejected"
              : decision === "separate"
                ? "Listings kept separate"
                : "Decision reset",
        detail: `${row.listing_a?.name ?? ""} / ${row.listing_b?.name ?? ""}`,
      });
      setSelected(null);
      reload();
      refreshCounters();
    } catch (caught) {
      pushToast({
        tone: "error",
        title: "Decision blocked",
        detail: caught instanceof Error ? caught.message : "Unexpected error",
      });
    } finally {
      setBusy(false);
    }
  };

  const quickDecide = (row: MatchRow, decision: "approve" | "reject" | "separate") => {
    if (decision === "approve" && row.band === "low") {
      pushToast({
        tone: "error",
        title: "Low-confidence pairs are protected",
        detail: "Approval is disabled for low-confidence candidates to avoid unsafe merges.",
      });
      return;
    }
    void decide(row, decision, "Decision recorded from the review table.");
  };

  return (
    <>
      <PageHeader
        eyebrow="Intelligence · Match review"
        title="Confidence-aware match review"
        description="High-confidence pairs can be auto-suggested, medium-confidence pairs need a person, and low-confidence pairs stay separate. Every decision is written to the audit trail."
        meta={
          <>
            <DemoDataTag label="Illustrative confidence values" />
            <span className="chip">{counts.pending ?? 0} awaiting review</span>
            <span className="chip">{counts.approved ?? 0} approved</span>
            <span className="chip">{counts.separate ?? 0} kept separate</span>
          </>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {(["high", "medium", "low"] as const).map((key) => (
          <div
            key={key}
            className={`card p-4 ${
              key === "high" ? "border-emerald-200" : key === "medium" ? "border-amber-200" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <BandBadge band={key} />
              <span className="num text-[18px] font-semibold text-ink">{counts[key] ?? 0}</span>
            </div>
            <p className="mt-2 text-[11.5px] leading-4 text-muted">{data?.band_guidance?.[key] ?? ""}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-subtle">
              <button type="button" onClick={() => setBand(key)} className="font-medium text-teal-dark hover:underline">
                Filter to {key}
              </button>
              {band === key ? <span className="chip">active</span> : null}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Candidate pairs"
          subtitle="Pairwise comparisons produced by the prototype matcher (blocking → similarity features → confidence band)."
          actions={
            <Tabs<StatusTab>
              size="sm"
              active={status}
              onChange={setStatus}
              tabs={[
                { id: "pending", label: "Pending", count: counts.pending },
                { id: "approved", label: "Approved", count: counts.approved },
                { id: "rejected", label: "Rejected", count: counts.rejected },
                { id: "separate", label: "Separate", count: counts.separate },
                { id: "all", label: "All", count: counts.all },
              ]}
            />
          }
        />

        <div className="flex flex-wrap items-end gap-2.5 border-b border-line px-5 py-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="section-label mb-1 block">Search listings</span>
            <Search className="pointer-events-none absolute left-2.5 top-[30px] h-3.5 w-3.5 text-subtle" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Property or supplier listing name…"
              className="input pl-8"
            />
          </label>
          <label className="w-[150px]">
            <span className="section-label mb-1 block">Band</span>
            <select value={band} onChange={(event) => setBand(event.target.value as BandFilter)} className="select">
              <option value="all">All bands</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="w-[160px]">
            <span className="section-label mb-1 block">Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="select">
              <option value="all">All inventory</option>
              <option value="hotel">Hotels</option>
              <option value="sightseeing">Sightseeing</option>
            </select>
          </label>
          <label className="w-[170px]">
            <span className="section-label mb-1 block">Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="select">
              <option value="confidence">Confidence (high → low)</option>
              <option value="band">Band</option>
              <option value="status">Status</option>
              <option value="category">Category</option>
            </select>
          </label>
        </div>

        {loading ? (
          <LoadingState label="Loading candidate pairs…" />
        ) : error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing in this queue"
            detail="Change the status or band filter to see other candidate pairs."
          />
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="table table-fixed">
              <thead>
                <tr>
                  <th className="th w-[13%]">Listing A</th>
                  <th className="th w-[13%]">Listing B</th>
                  <th className="th w-[12%] whitespace-normal leading-3">Proposed canonical product</th>
                  <th className="th w-[11%] whitespace-normal leading-3">Confidence</th>
                  <th className="th w-[16%] whitespace-normal leading-3">Matching evidence</th>
                  <th className="th w-[12%] whitespace-normal leading-3">Conflicts / gaps</th>
                  <th className="th w-[10%]">Status</th>
                  <th className="th w-[13%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="row-hover group align-top">
                    <td
                      className={`td border-l-2 ${
                        row.band === "high"
                          ? "border-l-teal"
                          : row.band === "medium"
                            ? "border-l-gold"
                            : "border-l-coral/70"
                      }`}
                    >
                      <p className="text-[12.5px] font-medium leading-4 text-ink">{row.listing_a?.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: row.listing_a?.supplier_accent ?? "#94a3b8" }}
                        />
                        {row.listing_a?.supplier_name?.replace("Supplier ", "")}
                        <span className="mono text-[9.5px] text-subtle">{row.listing_a?.supplier_property_id}</span>
                      </p>
                      <p className="line-clamp-2 text-[10.5px] leading-4 text-subtle" title={row.listing_a?.address}>
                        {row.listing_a?.address}
                      </p>
                    </td>
                    <td className="td">
                      <p className="text-[12.5px] font-medium leading-4 text-ink">{row.listing_b?.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: row.listing_b?.supplier_accent ?? "#94a3b8" }}
                        />
                        {row.listing_b?.supplier_name?.replace("Supplier ", "")}
                        <span className="mono text-[9.5px] text-subtle">{row.listing_b?.supplier_property_id}</span>
                      </p>
                      <p className="line-clamp-2 text-[10.5px] leading-4 text-subtle" title={row.listing_b?.address}>
                        {row.listing_b?.address}
                      </p>
                    </td>
                    <td className="td">
                      {row.proposed_group ? (
                        <>
                          <p className="truncate text-[12px] text-ink" title={row.proposed_group.canonical_name}>
                            {row.proposed_group.canonical_name}
                          </p>
                          <StatusBadge status={row.proposed_group.status} />
                        </>
                      ) : (
                        <span className="pill border-dashed border-line bg-white text-slate-500">No merge proposed</span>
                      )}
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-1.5">
                        <span className="num text-[12.5px] font-semibold text-ink">{confidence(row.confidence)}</span>
                        <BandBadge band={row.band} compact />
                      </div>
                      <p className="mt-1 whitespace-nowrap text-[10px] uppercase tracking-[0.06em] text-subtle">
                        {row.band === "low" ? "Cannot merge" : row.band === "medium" ? "Needs review" : "Auto-suggest"}
                      </p>
                    </td>
                    <td className="td text-[10.5px] leading-4 text-muted">
                      <div className="space-y-0.5">
                        <EvidenceBar label="Name" value={row.evidence.name_similarity} tone="bg-teal" compact />
                        <EvidenceBar label="Geo" value={row.evidence.geo_similarity} tone="bg-ocean" compact />
                        <EvidenceBar label="Address" value={row.evidence.address_similarity} tone="bg-slate-400" compact />
                        <EvidenceBar label="Attrs" value={row.evidence.attribute_agreement} tone="bg-gold" compact />
                      </div>
                      <p className="mt-1 leading-3">
                        {row.evidence.distance_m === null
                          ? "distance n/a"
                          : `${row.evidence.distance_m.toLocaleString("en-IN")} m apart`}
                      </p>
                      {row.evidence.caps_applied.length > 0 ? (
                        <p className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1 text-[10px] text-amber-800">
                          <ShieldAlert className="h-2.5 w-2.5" /> capped
                        </p>
                      ) : null}
                    </td>
                    <td className="td text-[11px]">
                      {row.conflicts.length === 0 && row.missing.length === 0 ? (
                        <span className="text-emerald-700">None</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {row.conflicts.map((conflict) => (
                            <li key={conflict} className="text-amber-800">• {conflict}</li>
                          ))}
                          {row.missing.map((item) => (
                            <li key={item} className="text-muted">• {item}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="td whitespace-nowrap">
                      <StatusBadge status={row.status} />
                      {row.reviewer ? (
                        <p className="mt-1 text-[10px] text-subtle">
                          {row.reviewer}
                          {row.reviewed_at ? ` · ${relativeTime(row.reviewed_at)}` : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="td">
                      <div className="grid grid-cols-2 gap-1">
                        {row.band === "low" && row.status !== "approved" ? (
                          <span
                            className="col-span-2 inline-flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-lg border border-coral/30 bg-coral-tint/60 px-1.5 py-1 text-[12px] font-medium text-coral-dark"
                            title="Low-confidence pairs cannot be approved — they must stay separate"
                          >
                            <ShieldAlert className="h-3 w-3" /> Cannot approve
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="accent"
                            className="w-full justify-center px-1.5"
                            onClick={() => quickDecide(row, "approve")}
                            disabled={busy || row.status === "approved"}
                            title={row.band === "low" ? "Low-confidence pairs cannot be approved" : undefined}
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full justify-center px-1.5"
                          onClick={() => quickDecide(row, "reject")}
                          disabled={busy || row.status === "rejected"}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full justify-center px-1.5"
                          onClick={() => quickDecide(row, "separate")}
                          disabled={busy || row.status === "separate"}
                        >
                          Separate
                        </Button>
                        <Button size="sm" variant="secondary" className="w-full justify-center px-1.5" onClick={() => setSelected(row)}>
                          Inspect
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-line bg-[#FBFCFE] px-5 py-2.5 text-[11px] text-muted">
          Confidence values are illustrative demo outputs from the prototype matcher. They are not trained-model
          accuracy or validated performance.
        </div>
      </Card>

      <MatchReviewModal
        candidate={selected}
        onClose={() => setSelected(null)}
        onDecide={(decision, note) => (selected ? decide(selected, decision, note) : Promise.resolve())}
        busy={busy}
      />
    </>
  );
}
