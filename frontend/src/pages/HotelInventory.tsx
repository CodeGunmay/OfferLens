import { ChevronDown, Filter, MapPin, Search, SlidersHorizontal, Star, Upload } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BandBadge, DemoDataTag, StatusBadge } from "../components/ui/Badge";
import { Card, CardHeader } from "../components/ui/Card";
import { Meter } from "../components/ui/Meter";
import { PlaceholderThumb } from "../components/domain/PlaceholderThumb";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useWorkspace } from "../context/WorkspaceContext";
import { useApi } from "../hooks/useApi";
import { useDebounced } from "../hooks/useDebounced";
import { api } from "../services/api";
import type { ConfidenceBand } from "../types";
import { inr } from "../utils/format";

const bandFor = (confidence: number): ConfidenceBand =>
  confidence >= 0.85 ? "high" : confidence >= 0.72 ? "medium" : "low";

export function HotelInventory() {
  const { sourceFilter, pushToast } = useWorkspace();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("confidence");
  const [expanded, setExpanded] = useState<number | null>(1);

  const debouncedSearch = useDebounced(search, 250);
  const { data, loading, error, reload } = useApi(
    () => api.hotels({ search: debouncedSearch, city, status, sort, supplier: sourceFilter }),
    [debouncedSearch, city, status, sort, sourceFilter],
  );

  const items = useMemo(() => data?.items ?? [], [data]);

  // Bounds for the price-band sparkline (illustrative prices from the demo dataset).
  const priceBounds = useMemo(() => {
    const lows = items.map((item) => item.price_from).filter((value): value is number => !!value);
    const highs = items.map((item) => item.price_to ?? item.price_from).filter((value): value is number => !!value);
    return { min: Math.min(...lows, 0) || 0, max: Math.max(...highs, 1) || 1 };
  }, [items]);

  return (
    <>
      <PageHeader
        eyebrow="Inventory · Hotels"
        title="Hotel inventory"
        description="Canonical hotel products built from supplier listings. Expand a property to see how each fictional supplier represents it — different titles, IDs, addresses and rate plans for the same hotel."
        meta={
          <>
            <DemoDataTag label="Synthetic supplier data" />
            <span className="chip">{items.length} canonical properties</span>
            <span className="chip">
              <Star className="h-3 w-3" /> {sourceFilter === "all" ? "All sources" : `Source: ${sourceFilter}`}
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                pushToast({
                  tone: "info",
                  title: "Ingestion is out of scope in the prototype",
                  detail: "In production this would open the supplier feed monitor.",
                })
              }
            >
              <Upload className="h-3.5 w-3.5" /> Feed status
            </button>
            <Link to="/compare?group=HG-1001" className="btn-primary">
              Compare supplier offers
            </Link>
          </>
        }
      />

      <Card>
        <CardHeader
          title="Supplier listings grouped by canonical property"
          subtitle="Grouping is proposed by the matcher; confirmed groups have been reviewed by a human."
          badge={<DemoDataTag />}
          actions={
            <span className="hidden items-center gap-1 text-[11px] text-muted sm:flex">
              <SlidersHorizontal className="h-3 w-3" /> {items.length} results
            </span>
          }
        />

        <div className="flex flex-wrap items-end gap-2.5 border-b border-line px-5 py-3">
          <label className="relative min-w-[210px] flex-1">
            <span className="section-label mb-1 block">Search</span>
            <Search className="pointer-events-none absolute left-2.5 top-[30px] h-3.5 w-3.5 text-subtle" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Property name, city or supplier listing…"
              className="input pl-8"
            />
          </label>
          <label className="w-[150px]">
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
          <label className="w-[150px]">
            <span className="section-label mb-1 block">Group status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="select">
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="proposed">Proposed</option>
            </select>
          </label>
          <label className="w-[170px]">
            <span className="section-label mb-1 block">Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="select">
              <option value="confidence">Match confidence</option>
              <option value="listings">Supplier listings</option>
              <option value="price">Lowest price</option>
              <option value="name">Property name</option>
              <option value="city">City</option>
            </select>
          </label>
          <button type="button" onClick={reload} className="btn-secondary" title="Refresh">
            <Filter className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <LoadingState label="Loading hotel inventory…" />
        ) : error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No properties match these filters" detail="Try clearing the search or choosing another city." />
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="table">
              <thead>
                <tr>
                  <th className="th w-[26%]">Canonical property</th>
                  <th className="th">Suppliers</th>
                  <th className="th text-right">Listings</th>
                  <th className="th w-[132px]">Price band</th>
                  <th className="th w-[150px]">Match confidence</th>
                  <th className="th">Status</th>
                  <th className="th w-[120px]" />
                </tr>
              </thead>
              <tbody>
                {items.map((group) => {
                  const isOpen = expanded === group.id;
                  return (
                    <Fragment key={group.id}>
                      <tr
                        className="row-hover cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : group.id)}
                      >
                        <td className="td">
                          <div className="flex items-start gap-2">
                            <ChevronDown
                              className={`mt-3 h-3.5 w-3.5 shrink-0 text-subtle transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                            <PlaceholderThumb seed={group.code} kind="hotel" />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-ink">{group.canonical_name}</p>
                              <p className="flex items-center gap-1 truncate text-[11px] text-muted">
                                <MapPin className="h-2.5 w-2.5" /> {group.address}
                              </p>
                              <p className="mt-0.5 text-[10.5px] text-subtle">
                                {group.star_rating ? `${group.star_rating}★ · ` : ""}
                                {group.region} · {group.code}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="td">
                          <div className="flex flex-wrap gap-1">
                            {group.suppliers.map((supplier) => (
                              <span key={supplier.code} className="chip">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: supplier.accent }} />
                                {supplier.name.replace("Supplier ", "")}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="td num text-right font-medium">{group.listing_count}</td>
                        <td className="td">
                          {group.price_from ? (
                            <div className="w-[112px]">
                              <div className="flex items-baseline gap-1.5">
                                <span className="num text-[13px] font-semibold text-ink">{inr(group.price_from)}</span>
                                {group.price_to && group.price_to !== group.price_from ? (
                                  <span className="num text-[10.5px] text-subtle">- {inr(group.price_to)}</span>
                                ) : null}
                              </div>
                              <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <span
                                  className="absolute inset-y-0 rounded-full bg-gold/85"
                                  style={{
                                    left: `${((group.price_from - priceBounds.min) / Math.max(priceBounds.max - priceBounds.min, 1)) * 100}%`,
                                    width: `${Math.max(
                                      (((group.price_to ?? group.price_from) - group.price_from) /
                                        Math.max(priceBounds.max - priceBounds.min, 1)) *
                                        100,
                                      6,
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-subtle">—</span>
                          )}
                        </td>
                        <td className="td">
                          <div className="flex items-center gap-2">
                            <Meter value={group.confidence} tone="bg-teal" />
                            <span className="num text-[11.5px] font-medium">{group.confidence.toFixed(2)}</span>
                          </div>
                          <div className="mt-1">
                            <BandBadge band={bandFor(group.confidence)} compact />
                          </div>
                        </td>
                        <td className="td">
                          <StatusBadge status={group.status} />
                        </td>
                        <td className="td text-right">
                          <Link
                            to={`/hotels/${group.code}`}
                            onClick={(event) => event.stopPropagation()}
                            className="link text-[12px]"
                          >
                            Open property
                          </Link>
                        </td>
                      </tr>

                      {isOpen ? (
                        <tr>
                          <td colSpan={7} className="bg-[#FBFCFE] px-0 py-0">
                            <div className="animate-fade-in border-y border-line px-5 py-3.5">
                              <p className="section-label mb-2">
                                Supplier listings mapped to this canonical property
                              </p>
                              <table className="table">
                                <thead>
                                  <tr>
                                    <th className="th">Supplier</th>
                                    <th className="th">Supplier property ID</th>
                                    <th className="th">Listing name as supplied</th>
                                    <th className="th">Address</th>
                                    <th className="th">Coordinates</th>
                                    <th className="th text-right">Star</th>
                                    <th className="th text-right">Amenities</th>
                                    <th className="th text-right">Confidence</th>
                                    <th className="th">Mapping</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <ListingRows code={group.code} />
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-line bg-[#FBFCFE] px-5 py-2.5 text-[11px] text-muted">
          Confidence values are produced by the prototype matcher over synthetic data. They are illustrative, not
          validated model accuracy. Property tiles are generated placeholders, not supplier photographs.
        </div>
      </Card>
    </>
  );
}

/** Lazily loads the group's listings for the expanded row. */
function ListingRows({ code }: { code: string }) {
  const { data, loading } = useApi(() => api.hotel(code), [code]);
  if (loading) {
    return (
      <tr>
        <td className="td-tight text-[11.5px] text-muted" colSpan={9}>
          Loading supplier listings…
        </td>
      </tr>
    );
  }
  return (
    <>
      {(data?.listings ?? []).map((listing) => (
        <tr key={listing.id} className="row-hover">
          <td className="td-tight font-medium">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: listing.supplier_accent }} />
              {listing.supplier_name.replace("Supplier ", "")}
            </span>
          </td>
          <td className="td-tight mono">{listing.supplier_property_id}</td>
          <td className="td-tight">{listing.name}</td>
          <td className="td-tight text-[11px] text-muted">{listing.address}</td>
          <td className="td-tight num text-[11px] text-muted">
            {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
          </td>
          <td className="td-tight num text-right">{listing.star_rating ?? "—"}</td>
          <td className="td-tight num text-right">{listing.amenities.length}</td>
          <td className="td-tight num text-right">{listing.match_confidence.toFixed(3)}</td>
          <td className="td-tight">
            <StatusBadge status={listing.mapping_status} />
          </td>
        </tr>
      ))}
    </>
  );
}
