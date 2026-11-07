import { ArrowLeft, CheckCircle2, DoorOpen, ListTree, MapPin, Scale, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AgreementTable } from "../components/domain/AgreementTable";
import { IdentityEvidencePanel } from "../components/domain/IdentityEvidencePanel";
import { PlaceholderThumb } from "../components/domain/PlaceholderThumb";
import { LayerStrip } from "../components/domain/LayerStrip";
import { RoomClassPanel } from "../components/domain/RoomClassPanel";
import { ThreeLayerExplainer } from "../components/domain/ThreeLayerExplainer";
import { BandBadge, DemoDataTag, StatusBadge } from "../components/ui/Badge";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { BedDouble, IndianRupee, Layers } from "lucide-react";
import { Meter } from "../components/ui/Meter";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/States";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { inr } from "../utils/format";

export function HotelDetail() {
  const { code = "HG-1001" } = useParams();
  const { data, loading, error, reload } = useApi(() => api.hotel(code), [code]);
  const compare = useApi(() => api.compare({ group_code: code, profile_key: "flexible" }), [code]);
  const [showEvidence, setShowEvidence] = useState(true);

  if (loading) return <LoadingState label="Loading property detail…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const { group, listings, identity_evidence, agreement, room_classes } = data;
  const offers = compare.data?.offers ?? [];

  return (
    <>
      <Link to="/hotels" className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft className="h-3 w-3" /> Back to hotel inventory
      </Link>

      <PageHeader
        eyebrow={`Hotel inventory · ${group.code}`}
        title={group.canonical_name}
        description={group.description}
        media={<PlaceholderThumb seed={group.code} kind="hotel" size="lg" />}
        meta={
          <>
            <span className="chip">
              <MapPin className="h-3 w-3" /> {group.address}
            </span>
            <span className="chip">{group.star_rating ? `${group.star_rating}★` : "Unrated"}</span>
            <StatusBadge status={group.status} />
            <BandBadge band={data.avg_confidence >= 0.85 ? "high" : data.avg_confidence >= 0.72 ? "medium" : "low"} />
            <DemoDataTag />
          </>
        }
        actions={
          <>
            <Link to={`/matches?search=${encodeURIComponent(group.canonical_name.split(",")[0])}`} className="btn-secondary">
              <ListTree className="h-3.5 w-3.5" /> Match candidates
            </Link>
            <Link to={`/compare?group=${group.code}`} className="btn-primary">
              <Scale className="h-3.5 w-3.5" /> Compare offers
            </Link>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Supplier listings"
          value={listings.length}
          icon={Layers}
          tone="ocean"
          context={listings.map((listing) => listing.supplier_name.replace("Supplier ", "")).join(" · ")}
        />
        <StatCard
          label="Room configurations"
          value={room_classes.length}
          icon={BedDouble}
          tone="teal"
          context={`${room_classes.filter((roomClass) => roomClass.comparable).length} comparable across suppliers`}
        />
        <StatCard
          label="Listed price band"
          value={inr(data.price_band.from)}
          unit={`to ${inr(data.price_band.to)}`}
          icon={IndianRupee}
          tone="gold"
          context="Per room / night, as listed by suppliers"
        />
        <StatCard
          label="Average match confidence"
          value={data.avg_confidence.toFixed(3)}
          icon={ShieldCheck}
          tone="navy"
          footer={<Meter value={data.avg_confidence} tone="bg-teal" />}
          context="Illustrative prototype score, not validated accuracy"
        />
      </div>

      <Card className="mb-4">
        <CardHeader
          title="Three-layer offer equivalence"
          subtitle="Property identity is resolved first. Room configuration and rate plan differences are then kept explicitly apart — they are never merged."
        />
        <div className="p-4">
          <ThreeLayerExplainer />
        </div>
      </Card>

      {/* ---------------- LAYER 1 ---------------- */}
      <Card className="mb-4">
        <LayerStrip
          layer={1}
          title="Layer 1 — Property identity"
          detail="Three supplier representations are resolved to one canonical property. Evidence, agreement and conflicts are shown below."
          right={<BandBadge band={data.avg_confidence >= 0.85 ? "high" : data.avg_confidence >= 0.72 ? "medium" : "low"} />}
        />
        <div className="overflow-x-auto scroll-thin">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Supplier</th>
                <th className="th">Supplier property ID</th>
                <th className="th">Listing name</th>
                <th className="th">Address</th>
                <th className="th">Coordinates</th>
                <th className="th text-right">Star</th>
                <th className="th text-right">Content</th>
                <th className="th text-right">Confidence</th>
                <th className="th">Mapping status</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="row-hover">
                  <td className="td font-medium">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: listing.supplier_accent }} />
                      {listing.supplier_name.replace("Supplier ", "")}
                    </span>
                    <span
                      className="mt-0.5 block whitespace-nowrap text-[10.5px] font-normal text-subtle"
                      title={listing.source_type}
                    >
                      Synthetic data
                    </span>
                  </td>
                  <td className="td mono">{listing.supplier_property_id}</td>
                  <td className="td">{listing.name}</td>
                  <td className="td text-[11.5px] text-muted">{listing.address}</td>
                  <td className="td num text-[11px] text-muted">
                    {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
                  </td>
                  <td className="td num text-right">{listing.star_rating ?? "—"}</td>
                  <td className="td text-right">
                    <span className="num text-[11.5px]">{listing.content_completeness}%</span>
                    <Meter value={listing.content_completeness / 100} />
                  </td>
                  <td className="td num text-right">{listing.match_confidence.toFixed(3)}</td>
                  <td className="td">
                    <StatusBadge status={listing.mapping_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 border-t border-line px-5 py-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="section-label">Why these listings are believed to match</p>
              <button type="button" onClick={() => setShowEvidence(!showEvidence)} className="text-[11px] text-teal-dark hover:underline">
                {showEvidence ? "Hide evidence" : "Show evidence"}
              </button>
            </div>
            {showEvidence ? (
              <div className="space-y-2.5">
                {identity_evidence.map((pair) => (
                  <IdentityEvidencePanel key={`${pair.listing_a_id}-${pair.listing_b_id}`} pair={pair} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted">
                {identity_evidence.length} pairwise comparisons hidden. Confidence range{" "}
                {Math.min(...identity_evidence.map((pair) => pair.confidence)).toFixed(3)} –{" "}
                {Math.max(...identity_evidence.map((pair) => pair.confidence)).toFixed(3)}.
              </p>
            )}
          </div>
          <div>
            <p className="section-label mb-2">Attribute agreement</p>
            <div className="overflow-hidden rounded-xl border border-line">
              <AgreementTable rows={agreement} />
            </div>
            <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-line bg-[#F8FAFC] px-2.5 py-2">
              <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-teal-dark" />
              <p className="text-[10.5px] leading-4 text-muted">
                Missing or conflicting attributes never force a merge. They are surfaced here and routed to the review
                queue with a confidence cap.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------- LAYER 2 ---------------- */}
      <Card className="mb-4">
        <LayerStrip
          layer={2}
          title="Layer 2 — Room configuration"
          detail="Rooms are grouped into equivalence classes. Supplier wording differs; only genuinely comparable rooms are compared on price."
          right={<span className="chip">{room_classes.length} room classes</span>}
        />
        <RoomClassPanel classes={room_classes} groupCode={group.code} />
      </Card>

      {/* ---------------- LAYER 3 ---------------- */}
      <Card>
        <LayerStrip
          layer={3}
          title="Layer 3 — Rate plan / bookable offer"
          detail="Within a comparable room, rate plans differ on meals, cancellation, payment terms and price. Effective price adjusts for those differences."
          right={
            <Link to={`/compare?group=${group.code}`} className="btn-secondary btn-sm">
              <Scale className="h-3 w-3" /> Full comparison
            </Link>
          }
        />
        {compare.loading ? (
          <div className="px-5 py-6 text-[12px] text-muted">Calculating effective prices…</div>
        ) : compare.error ? (
          <div className="p-4">
            <ErrorState message={compare.error} onRetry={compare.reload} />
          </div>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Supplier</th>
                  <th className="th">Room</th>
                  <th className="th">Meals</th>
                  <th className="th">Cancellation</th>
                  <th className="th">Payment</th>
                  <th className="th text-right">Listed</th>
                  <th className="th text-right">Effective</th>
                  <th className="th text-right">Δ</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.id} className="row-hover">
                    <td className="td font-medium">{offer.supplier_name}</td>
                    <td className="td">
                      {offer.room_category}
                      <span className="block text-[10.5px] text-muted">{offer.bed_type}</span>
                    </td>
                    <td className="td">
                      <span className={offer.meal_plan === "Room only" ? "text-slate-500" : "text-emerald-700"}>
                        {offer.meal_plan}
                      </span>
                    </td>
                    <td className="td">
                      {offer.refundable ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> free until {offer.cancellation_deadline_hours}h
                        </span>
                      ) : (
                        <span className="text-slate-500">non-refundable</span>
                      )}
                    </td>
                    <td className="td">{offer.payment_terms}</td>
                    <td className="td num text-right">{inr(offer.listed_price)}</td>
                    <td className="td num text-right font-semibold">{inr(offer.effective.effective_price)}</td>
                    <td className={`td num text-right ${offer.effective.uplift > 0 ? "text-amber-700" : "text-muted"}`}>
                      {offer.effective.uplift > 0 ? `+${inr(offer.effective.uplift)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#FBFCFE] px-5 py-2.5 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <DoorOpen className="h-3 w-3" /> Same property ≠ same room ≠ same rate plan.
          </span>
          <span>Computed from current demo offers</span>
        </div>
      </Card>
    </>
  );
}
