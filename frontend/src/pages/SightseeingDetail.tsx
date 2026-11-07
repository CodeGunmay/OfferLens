import { ArrowLeft, ListTree, MapPin, Scale, Ticket } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ActivityClassPanel } from "../components/domain/ActivityClassPanel";
import { AgreementTable } from "../components/domain/AgreementTable";
import { IdentityEvidencePanel } from "../components/domain/IdentityEvidencePanel";
import { PlaceholderThumb } from "../components/domain/PlaceholderThumb";
import { LayerStrip } from "../components/domain/LayerStrip";
import { ThreeLayerExplainer } from "../components/domain/ThreeLayerExplainer";
import { BandBadge, DemoDataTag, StatusBadge } from "../components/ui/Badge";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { IndianRupee, Layers, ShieldCheck } from "lucide-react";
import { Meter } from "../components/ui/Meter";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/States";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { inr } from "../utils/format";

export function SightseeingDetail() {
  const { code = "SG-2001" } = useParams();
  const { data, loading, error, reload } = useApi(() => api.sightseeingProduct(code), [code]);
  const compare = useApi(() => api.compare({ group_code: code, profile_key: "flexible" }), [code]);

  if (loading) return <LoadingState label="Loading attraction detail…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const { group, listings, identity_evidence, agreement, activity_classes = [] } = data;
  const band = data.avg_confidence >= 0.85 ? "high" : data.avg_confidence >= 0.72 ? "medium" : "low";

  return (
    <>
      <Link to="/sightseeing" className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft className="h-3 w-3" /> Back to sightseeing inventory
      </Link>

      <PageHeader
        eyebrow={`Sightseeing inventory · ${group.code}`}
        title={group.canonical_name}
        description={group.description}
        media={<PlaceholderThumb seed={group.code} kind="sightseeing" size="lg" />}
        meta={
          <>
            <span className="chip">
              <MapPin className="h-3 w-3" /> {group.address}
            </span>
            <StatusBadge status={group.status} />
            <BandBadge band={band} />
            <DemoDataTag label="Synthetic tour offers" />
          </>
        }
        actions={
          <>
            <Link to={`/matches?search=${encodeURIComponent(group.canonical_name.split(",")[0])}`} className="btn-secondary">
              <ListTree className="h-3.5 w-3.5" /> Match candidates
            </Link>
            <Link to={`/compare?group=${group.code}`} className="btn-primary">
              <Scale className="h-3.5 w-3.5" /> Compare tour offers
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
          label="Tour configurations"
          value={activity_classes.length}
          icon={Ticket}
          tone="teal"
          context={`${activity_classes.flatMap((activityClass) => activityClass.entries).length} bookable offers`}
        />
        <StatCard
          label="Price band / person"
          value={inr(data.price_band.from)}
          unit={`to ${inr(data.price_band.to)}`}
          icon={IndianRupee}
          tone="gold"
          context="As listed per person, before adjustments"
        />
        <StatCard
          label="Average match confidence"
          value={data.avg_confidence.toFixed(3)}
          icon={ShieldCheck}
          tone="navy"
          footer={<Meter value={data.avg_confidence} tone="bg-teal" />}
          context="Prototype score on synthetic data"
        />
      </div>

      <Card className="mb-4">
        <CardHeader
          title="Three-layer offer equivalence for tours"
          subtitle="Attraction identity is matched; tour configuration is compared separately; price and inclusions stay attached to each offer."
        />
        <div className="p-4">
          <ThreeLayerExplainer />
        </div>
      </Card>

      <Card className="mb-4">
        <LayerStrip
          layer={1}
          title="Layer 1 — Attraction identity"
          detail="Supplier tour titles describe the format, not the attraction. Format wording is stripped before matching and compared at layer 2 instead."
          right={<BandBadge band={band} />}
        />
        <div className="overflow-x-auto scroll-thin">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Supplier</th>
                <th className="th">Supplier product ID</th>
                <th className="th">Listing title as supplied</th>
                <th className="th">Meeting point / address</th>
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
                  </td>
                  <td className="td mono">{listing.supplier_property_id}</td>
                  <td className="td">{listing.name}</td>
                  <td className="td text-[11.5px] text-muted">{listing.address}</td>
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
            <p className="section-label mb-2">Why these listings are believed to match</p>
            <div className="space-y-2.5">
              {identity_evidence.map((pair) => (
                <IdentityEvidencePanel key={`${pair.listing_a_id}-${pair.listing_b_id}`} pair={pair} />
              ))}
            </div>
          </div>
          <div>
            <p className="section-label mb-2">Attribute agreement</p>
            <div className="overflow-hidden rounded-xl border border-line">
              <AgreementTable rows={agreement} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <LayerStrip
          layer={2}
          title="Layer 2 — Activity configuration"
          detail="Duration, access type, group format, transfers and included services define what the client is actually buying."
          right={<span className="chip">{activity_classes.length} configuration group(s)</span>}
        />
        <ActivityClassPanel classes={activity_classes} groupCode={group.code} />
      </Card>

      <Card>
        <LayerStrip
          layer={3}
          title="Layer 3 — Bookable offer"
          detail="Price, meals, cancellation terms and availability per supplier offer, with the effective-price adjustment applied."
          right={
            <Link to={`/compare?group=${group.code}`} className="btn-secondary btn-sm">
              <Scale className="h-3 w-3" /> Full comparison
            </Link>
          }
        />
        {compare.loading ? (
          <div className="px-5 py-6 text-[12px] text-muted">Calculating effective prices…</div>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Supplier</th>
                  <th className="th">Offer</th>
                  <th className="th">Duration</th>
                  <th className="th">Transfers</th>
                  <th className="th">Meals</th>
                  <th className="th">Cancellation</th>
                  <th className="th text-right">Listed</th>
                  <th className="th text-right">Effective</th>
                </tr>
              </thead>
              <tbody>
                {(compare.data?.offers ?? []).map((offer) => (
                  <tr key={offer.id} className="row-hover">
                    <td className="td font-medium">{offer.supplier_name}</td>
                    <td className="td">
                      {offer.activity_name}
                      <span className="block text-[10.5px] text-muted">{offer.experience_type} · max {offer.max_group_size}</span>
                    </td>
                    <td className="td num">{offer.duration_hours}h</td>
                    <td className="td">{offer.transfers}</td>
                    <td className="td">{offer.meals}</td>
                    <td className="td">{offer.cancellation_policy}</td>
                    <td className="td num text-right">{inr(offer.listed_price)}</td>
                    <td className="td num text-right font-semibold">{inr(offer.effective.effective_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center gap-1.5 border-t border-line bg-[#FBFCFE] px-5 py-2.5 text-[11px] text-muted">
          <Ticket className="h-3 w-3" /> Same attraction ≠ same tour experience. Inclusions and duration are never merged.
        </div>
      </Card>
    </>
  );
}
