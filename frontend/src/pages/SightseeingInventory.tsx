import { Landmark, MapPin, Search, Star, Ticket, Timer } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BandBadge, DemoDataTag, StatusBadge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { PlaceholderThumb } from "../components/domain/PlaceholderThumb";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useWorkspace } from "../context/WorkspaceContext";
import { useApi } from "../hooks/useApi";
import { useDebounced } from "../hooks/useDebounced";
import { api } from "../services/api";
import type { ConfidenceBand } from "../types";
import { inr, isIncluded } from "../utils/format";

const bandFor = (confidence: number): ConfidenceBand =>
  confidence >= 0.85 ? "high" : confidence >= 0.72 ? "medium" : "low";

export function SightseeingInventory() {
  const { sourceFilter } = useWorkspace();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [sort, setSort] = useState("confidence");
  const debouncedSearch = useDebounced(search, 250);

  const { data, loading, error, reload } = useApi(
    () => api.sightseeing({ search: debouncedSearch, city, sort, supplier: sourceFilter }),
    [debouncedSearch, city, sort, sourceFilter],
  );

  return (
    <>
      <PageHeader
        eyebrow="Inventory · Sightseeing"
        title="Sightseeing inventory"
        description="Attraction-level product identity with tour-level differences preserved. The same monument can be sold as a 2-hour express visit, a 4-hour guided visit with transfers, or a skip-the-line small-group experience — those are not the same product to a client."
        meta={
          <>
            <DemoDataTag label="Synthetic tour offers" />
            <span className="chip">{data?.total ?? 0} canonical attractions</span>
            <span className="chip">
              <Ticket className="h-3 w-3" /> Real-world attractions · synthetic offers
            </span>
          </>
        }
        actions={<Link to="/compare?group=SG-2001" className="btn-primary">Compare Taj Mahal offers</Link>}
      />

      <div className="mb-4 flex flex-wrap items-end gap-2.5 rounded-xl border border-line bg-white p-4">
        <label className="relative min-w-[240px] flex-1">
          <span className="section-label mb-1 block">Search attractions or tour titles</span>
          <Search className="pointer-events-none absolute left-2.5 top-[30px] h-3.5 w-3.5 text-subtle" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Taj Mahal, Amber Fort, Qutub Minar…"
            className="input pl-8"
          />
        </label>
        <label className="w-[160px]">
          <span className="section-label mb-1 block">City</span>
          <select value={city} onChange={(event) => setCity(event.target.value)} className="select">
            <option value="all">All cities</option>
            {(data?.filters?.cities ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="w-[180px]">
          <span className="section-label mb-1 block">Sort by</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="select">
            <option value="confidence">Match confidence</option>
            <option value="listings">Supplier listings</option>
            <option value="price">Lowest price</option>
            <option value="name">Attraction name</option>
          </select>
        </label>
        <button type="button" onClick={reload} className="btn-secondary">
          Refresh
        </button>
      </div>

      {loading ? (
        <LoadingState label="Loading sightseeing inventory…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No attractions match these filters" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {(data?.items ?? []).map((group) => (
            <Card key={group.id}>
              <div className="flex items-start gap-3 border-b border-line px-5 py-4">
                <PlaceholderThumb seed={group.code} kind="sightseeing" size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="card-title truncate">{group.canonical_name}</h2>
                    <StatusBadge status={group.status} />
                  </div>
                  <p className="card-sub line-clamp-2">{group.description}</p>
                </div>
                <BandBadge band={bandFor(group.confidence)} compact />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-2.5">
                <span className="chip">
                  <MapPin className="h-3 w-3" /> {group.city}
                </span>
                <span className="chip">
                  <Landmark className="h-3 w-3" /> {group.listing_count} supplier listings
                </span>
                <span className="chip">
                  <Star className="h-3 w-3" /> confidence {group.confidence.toFixed(3)}
                </span>
                <span className="chip-gold">
                  from {inr(group.price_from)} <span className="font-normal opacity-70">/ person</span>
                </span>
              </div>
              <ListingPreview code={group.code} />
              <div className="flex items-center justify-between border-t border-line bg-[#FBFCFE] px-5 py-2.5">
                <p className="text-[10.5px] text-muted">{group.code} · synthetic tour offers</p>
                <div className="flex gap-2">
                  <Link to={`/sightseeing/${group.code}`} className="btn-secondary btn-sm">
                    Open layers
                  </Link>
                  <Link to={`/compare?group=${group.code}`} className="btn-accent btn-sm">
                    Compare
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function ListingPreview({ code }: { code: string }) {
  const { data, loading } = useApi(() => api.sightseeingProduct(code), [code]);
  if (loading) return <div className="px-5 py-4 text-[12px] text-muted">Loading supplier tour variants…</div>;

  return (
    <div className="divide-y divide-line">
      {(data?.listings ?? []).map((listing) => {
        const activity = listing.activities[0];
        const offer = activity?.offers[0];
        return (
          <div key={listing.id} className="flex flex-wrap items-start gap-3 px-5 py-3">
            <div className="w-[132px] shrink-0">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: listing.supplier_accent }} />
                {listing.supplier_name.replace("Supplier ", "")}
              </p>
              <p className="mono text-[10px] text-subtle">{listing.supplier_property_id}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-ink">{listing.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="chip">
                  <Timer className="h-2.5 w-2.5" /> {activity?.duration_hours}h
                </span>
                <span className="chip">{activity?.experience_type}</span>
                <span className="chip">{activity?.access_type}</span>
                <span className={`chip ${isIncluded(activity?.transfers) ? "border-emerald-200 bg-emerald-50 text-emerald-800" : ""}`}>
                  {activity?.transfers}
                </span>
                <span className="chip">{offer?.cancellation_policy}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="num text-[13px] font-semibold text-ink">{inr(offer?.price ?? 0)}</p>
              <p className="text-[10px] text-subtle">per person</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
