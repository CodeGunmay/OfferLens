import { AlertTriangle, CheckCircle2, ImageOff, Layers, Check } from "lucide-react";
import { useState } from "react";
import { DemoDataTag, SourceTag } from "../components/ui/Badge";
import { Card, CardHeader } from "../components/ui/Card";
import { Meter } from "../components/ui/Meter";
import { PageHeader } from "../components/ui/PageHeader";
import { PlaceholderThumb } from "../components/domain/PlaceholderThumb";
import { ErrorState, LoadingState } from "../components/ui/States";
import { Tabs } from "../components/ui/Tabs";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";

export function ContentEnrichment() {
  const [tab, setTab] = useState<"hotels" | "sightseeing">("hotels");
  const { data, loading, error, reload } = useApi(() => api.content(), []);

  const groups = data ? (tab === "hotels" ? data.hotels : data.sightseeing) : [];

  return (
    <>
      <PageHeader
        eyebrow="Intelligence · Content enrichment"
        title="Content enrichment"
        description="How supplier content would be normalized into one clean product presentation: consolidated naming, verified amenities, conflict flags and honest image attribution."
        meta={
          <>
            <DemoDataTag label="Synthetic supplier content" />
            <span className="chip">
              <ImageOff className="h-3 w-3" /> No supplier photography used
            </span>
          </>
        }
        actions={
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { id: "hotels", label: "Hotels", count: data?.hotels.length },
              { id: "sightseeing", label: "Sightseeing", count: data?.sightseeing.length },
            ]}
          />
        }
      />

      {loading ? (
        <LoadingState label="Loading normalized content…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3">
            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
            <p className="text-[12px] leading-5 text-sky-900">{data?.notice}</p>
          </div>

          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.group.code}>
                <CardHeader
                  title={group.consolidated_name}
                  subtitle={`${group.group.city} · ${group.group.code} · ${group.supplier_names.length} supplier listings consolidated`}
                  badge={<SourceTag>{group.source_type}</SourceTag>}
                  actions={
                    <div className="flex items-center gap-2">
                      <span className="section-label">Completeness</span>
                      <div className="w-24">
                        <Meter value={group.completeness / 100} tone="bg-teal" />
                      </div>
                      <span className="num text-[12px] font-semibold text-ink">{group.completeness}%</span>
                    </div>
                  }
                />

                <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_1fr]">
                  <div>
                    <p className="section-label mb-2">Supplier naming → consolidated name</p>
                    <div className="overflow-hidden rounded-xl border border-line">
                      <table className="table">
                        <thead>
                          <tr>
                            <th className="th">Supplier</th>
                            <th className="th">Property ID</th>
                            <th className="th">Name as supplied</th>
                            <th className="th text-right">Content</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.supplier_names.map((item) => (
                            <tr key={`${item.supplier}-${item.supplier_property_id}`} className="row-hover">
                              <td className="td-tight font-medium">{item.supplier.replace("Supplier ", "")}</td>
                              <td className="td-tight mono">{item.supplier_property_id}</td>
                              <td className="td-tight">{item.name}</td>
                              <td className="td-tight num text-right">{item.content_completeness}%</td>
                            </tr>
                          ))}
                          <tr className="bg-teal-tint/50">
                            <td className="td-tight font-semibold text-teal-dark" colSpan={2}>
                              Consolidated
                            </td>
                            <td className="td-tight font-semibold" colSpan={2}>
                              {group.consolidated_name}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="section-label mb-2 mt-4">Verified amenities (present in every supplier feed)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.verified_amenities.map((amenity) => (
                        <span key={amenity} className="pill border-emerald-200 bg-emerald-50 text-emerald-800">
                          <CheckCircle2 className="h-2.5 w-2.5" /> {amenity}
                        </span>
                      ))}
                    </div>

                    <p className="section-label mb-2 mt-4">Appears in some feeds only</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.additional_amenities.length === 0 ? (
                        <span className="text-[11.5px] text-muted">No supplier-specific amenities.</span>
                      ) : (
                        group.additional_amenities.map((amenity) => (
                          <span key={amenity} className="chip">
                            {amenity}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-line bg-[#FBFCFE] p-3.5">
                      <p className="section-label mb-1.5">Conflicting attributes</p>
                      {group.conflicts.length === 0 ? (
                        <p className="text-[11.5px] text-emerald-700">No conflicts detected.</p>
                      ) : (
                        <ul className="space-y-1">
                          {group.conflicts.map((conflict) => (
                            <li key={conflict} className="flex items-start gap-1 text-[11px] leading-4 text-amber-800">
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {conflict}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="section-label mb-1.5 mt-3">Missing information</p>
                      {group.missing.length === 0 ? (
                        <p className="text-[11.5px] text-muted">Required attributes present.</p>
                      ) : (
                        <ul className="space-y-1">
                          {group.missing.map((item) => (
                            <li key={item} className="text-[11px] text-muted">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-xl border border-line bg-white p-3.5">
                      <p className="section-label mb-2">Amenity alias normalization</p>
                      <div className="max-h-40 space-y-2 overflow-y-auto scroll-thin pr-1">
                        {group.amenity_mapping.map((mapping) => (
                          <div key={mapping.supplier}>
                            <p className="text-[11px] font-medium text-ink">{mapping.supplier.replace("Supplier ", "")}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {mapping.items.map((item, index) => {
                                const isRewrite = item.original.trim().toLowerCase() !== item.label.trim().toLowerCase();
                                return (
                                  <span
                                    key={`${item.original}-${index}`}
                                    className={`chip ${isRewrite ? "" : "text-subtle"}`}
                                    title={isRewrite ? `${item.original} → ${item.label}` : `${item.label} already matches the canonical label`}
                                  >
                                    {isRewrite ? (
                                      <>
                                        {item.original} <span className="text-subtle">→</span> {item.label}
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" /> {item.label}
                                      </>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-line bg-[#FBFCFE] p-3">
                      <div className="flex items-center gap-2">
                        <ImageOff className="h-3.5 w-3.5 text-subtle" />
                        <p className="text-[11px] font-medium text-ink">Image handling</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2.5">
                        <PlaceholderThumb seed={group.group.code} kind={tab === "hotels" ? "hotel" : "sightseeing"} />
                        <div className="flex flex-wrap gap-1">
                          <span className="pill border-dashed border-line bg-white text-[10px] text-subtle">
                            No supplier photography
                          </span>
                          <span className="pill border-dashed border-line bg-white text-[10px] text-subtle">
                            Licence check pending
                          </span>
                        </div>
                      </div>
                      <p className="mt-1.5 text-[10px] leading-4 text-subtle">{group.image_status}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
