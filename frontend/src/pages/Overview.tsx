import {
  ArrowRight,
  Building2,
  CalendarClock,
  ClipboardCheck,
  GitMerge,
  Info,
  Landmark,
  Layers,
  Scale,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrandMark } from "../components/layout/BrandMark";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { DemoDataTag } from "../components/ui/Badge";
import { QuickActionCard } from "../components/ui/QuickActionCard";
import { StatCard } from "../components/ui/StatCard";
import { ErrorState, LoadingState } from "../components/ui/States";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { CHART_COLORS } from "../utils/confidence";
import { inr, labelForDecision, relativeTime } from "../utils/format";

const BAND_COLORS: Record<string, string> = { High: "#16B8A6", Medium: "#F59E0B", Low: "#94A3B8" };

export function Overview() {
  const { data, loading, error, reload } = useApi(() => api.overview(), []);

  if (loading) return <LoadingState label="Loading demo workspace…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const metrics = data.metrics;
  const metric = (key: string) => metrics.find((item) => item.key === key);

  const supplierChart = data.charts.supplier_distribution.map((supplier) => ({
    name: supplier.name.replace("Supplier ", ""),
    hotels: supplier.hotels,
    sightseeing: supplier.sightseeing,
  }));

  const confidenceChart = data.charts.confidence_bands.map((band) => ({
    name: band.label,
    value: band.count,
    color: BAND_COLORS[band.label] ?? "#94A3B8",
  }));

  const categoryChart = data.charts.category_split.map((entry, index) => ({
    ...entry,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const outcomeChart = data.charts.match_outcomes.map((row) => ({
    band: row.band,
    Approved: row.approved,
    Pending: row.pending,
    Rejected: row.rejected + row.separate,
  }));

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="hero-surface mb-4 animate-rise px-6 py-6 lg:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="flex items-center gap-3">
              <BrandMark size={38} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-light">
                  VoyageHack 4.0 · demo workspace
                </p>
                <h1 className="text-[25px] font-semibold leading-7 tracking-[-0.02em] text-white">OfferLens</h1>
              </div>
            </div>
            <p className="mt-3.5 text-[18px] font-medium leading-6 text-white">
              One product. Multiple suppliers. Clearer decisions.
            </p>
            <p className="mt-1.5 max-w-xl text-[12.5px] leading-5 text-white/70">
              An offer-equivalence layer for hotel and sightseeing inventory: resolve supplier listings to one product,
              keep configurations and rate plans honest, then rank by what the client actually pays.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link to="/compare?group=HG-1001" className="btn bg-white text-navy shadow-sm hover:bg-white/90">
                <Scale className="h-3.5 w-3.5" /> Compare hotel offers
              </Link>
              <Link
                to="/matches"
                className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                <GitMerge className="h-3.5 w-3.5" /> Review {data.readiness.review_load} pending
              </Link>
              <span className="pill border-white/20 bg-white/[0.08] text-white/75">
                <ShieldCheck className="h-3 w-3 text-teal-light" /> Synthetic demo data
              </span>
            </div>
          </div>

          <div className="grid w-full shrink-0 grid-cols-2 gap-2.5 sm:max-w-md xl:w-[400px]">
            {[
              { label: "Supplier listings", value: data.metrics.find((m) => m.key === "total_listings")?.value ?? 0, hint: "3 suppliers" },
              { label: "Canonical products", value: data.metrics.find((m) => m.key === "duplicate_groups")?.value ?? 0, hint: "hotels + tours" },
              { label: "Awaiting review", value: data.readiness.review_load, hint: "human in the loop" },
              { label: "Avg. match confidence", value: data.readiness.avg_confidence.toFixed(3), hint: "prototype score" },
            ].map((item) => (
              <div key={item.label} className="glass-card px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/55">{item.label}</p>
                <p className="num mt-1 text-[21px] font-semibold leading-6 text-white">{item.value}</p>
                <p className="text-[10.5px] text-teal-light/85">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DemoDataTag label="All metrics are demo data" />
        <span className="chip">
          <ShieldCheck className="h-3 w-3" /> Synthetic dataset · 3 fictional suppliers
        </span>
        <span className="chip">
          <CalendarClock className="h-3 w-3" /> Last matching batch {relativeTime(data.recent_activity[0]?.created_at)}
        </span>
        <span className="chip">
          <Info className="h-3 w-3" /> Concept prototype — no TBO branding or statistics
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Supplier listings"
          value={metric("total_listings")?.value ?? 0}
          icon={Layers}
          tone="ocean"
          context={metric("total_listings")?.context}
        />
        <StatCard
          label="Duplicate groups"
          value={metric("duplicate_groups")?.value ?? 0}
          icon={Building2}
          tone="navy"
          context={metric("duplicate_groups")?.context}
        />
        <StatCard
          label="Awaiting review"
          value={metric("pending_reviews")?.value ?? 0}
          icon={ClipboardCheck}
          tone="gold"
          context={metric("pending_reviews")?.context}
        />
        <StatCard
          label="Confirmed groups"
          value={metric("confirmed_groups")?.value ?? 0}
          icon={ShieldCheck}
          tone="teal"
          context={metric("confirmed_groups")?.context}
        />
        <StatCard
          label="Meaningful differences"
          value={metric("meaningful_differences")?.value ?? 0}
          icon={TriangleAlert}
          tone="coral"
          context={metric("meaningful_differences")?.context}
        />
        <StatCard
          label="Coverage"
          value={metric("coverage")?.value ?? "—"}
          unit={metric("coverage")?.unit}
          icon={Landmark}
          tone="teal"
          context={metric("coverage")?.context}
        />
      </div>

      {/* ---------------- Insight + review queue ---------------- */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {data.price_insight ? (
          <Card className="flex flex-col overflow-hidden xl:col-span-2">
            <CardHeader
              title="Cheapest listed is not the best value"
              subtitle={`${data.price_insight.group_name} · ${data.price_insight.city} · ${data.price_insight.offer_count} supplier offers · ${data.price_insight.profile_name}`}
              badge={<span className="chip-gold"><Sparkles className="h-3 w-3" /> Illustrative estimate</span>}
              actions={
                <Link to={`/compare?group=${data.price_insight.group_code}`} className="btn-secondary btn-sm">
                  Open comparison <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            <div className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-xl border border-line bg-[#FBFCFE] p-3.5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted">
                  Cheapest on the label
                </p>
                <p className="mt-1 text-[13px] font-semibold text-ink">
                  {data.price_insight.cheapest_listed.supplier.replace("Supplier ", "")}
                </p>
                <p className="num mt-1 text-[22px] font-semibold leading-7 text-ink">
                  {inr(data.price_insight.cheapest_listed.listed_price)}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-coral-dark">
                  <ArrowRight className="h-3 w-3" />
                  costs {inr(data.price_insight.cheapest_listed.effective_price)} once meals and cancellation are priced
                </p>
              </div>

              <div className="flex flex-col items-center gap-1 px-2 text-center">
                <span className="rounded-full border border-gold/60 bg-gold-tint px-2.5 py-1 text-[11px] font-semibold text-gold-ink">
                  {data.price_insight.effective_gap >= 0 ? "+" : "−"}
                  {inr(Math.abs(data.price_insight.effective_gap))} effective
                </span>
                <span className="text-[10px] uppercase tracking-[0.08em] text-subtle">real difference</span>
              </div>

              <div className="rounded-xl border border-teal/40 bg-teal-tint/60 p-3.5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-teal-dark">
                  Recommended for this profile
                </p>
                <p className="mt-1 text-[13px] font-semibold text-ink">
                  {data.price_insight.recommended.supplier.replace("Supplier ", "")}
                </p>
                <p className="num mt-1 text-[22px] font-semibold leading-7 text-ink">
                  {inr(data.price_insight.recommended.effective_price)}
                </p>
                <p className="mt-2 text-[11.5px] text-teal-dark">
                  effective price · fit {data.price_insight.recommended.fit_score.toFixed(1)} / 100
                </p>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1.5 border-t border-line px-5 py-3.5">
              <p className="section-label">Effective price per offer (listed in grey, adjustments in gold)</p>
              {(data.price_insight.offers ?? []).map((offer) => {
                const max = Math.max(...data.price_insight!.offers.map((o) => o.effective_price));
                const listedPct = (offer.listed_price / max) * 100;
                const upliftPct = (Math.max(offer.effective_price - offer.listed_price, 0) / max) * 100;
                return (
                  <div key={offer.supplier} className="flex items-center gap-3">
                    <span className="w-[104px] shrink-0 truncate text-[11.5px] font-medium text-ink">
                      {offer.supplier.replace("Supplier ", "")}
                    </span>
                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span className="absolute inset-y-0 left-0 rounded-full bg-navy/25" style={{ width: `${listedPct}%` }} />
                      {offer.uplift > 0 ? (
                        <span
                          className="absolute inset-y-0 rounded-full bg-gold"
                          style={{ left: `${listedPct}%`, width: `${Math.max(upliftPct, 0.8)}%` }}
                        />
                      ) : null}
                    </span>
                    <span className="num w-[132px] shrink-0 text-right text-[11px] text-muted">
                      <span className="font-semibold text-ink">{inr(offer.effective_price)}</span>
                      {offer.uplift > 0 ? <span className="text-gold-dark"> +{inr(offer.uplift)}</span> : " no adj."}
                    </span>
                    {offer.is_recommended ? (
                      <span className="pill border-teal/40 bg-teal-tint text-[9.5px] text-teal-dark">Best value</span>
                    ) : offer.is_cheapest_listed ? (
                      <span className="pill border-line bg-slate-100 text-[9.5px] text-slate-600">Lowest listed</span>
                    ) : (
                      <span className="w-[62px]" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-[#FBFCFE] px-5 py-2.5 text-[11px] text-muted">
              <span>
                Listed spread <span className="num font-semibold text-ink">{inr(data.price_insight.listed_spread)}</span>
              </span>
              <span>
                Effective spread{" "}
                <span className="num font-semibold text-ink">{inr(data.price_insight.effective_spread)}</span>
              </span>
              <span className="text-subtle">{data.price_insight.note}</span>
            </div>
          </Card>
        ) : null}

        <Card>
          <CardHeader
            title="Review queue"
            subtitle="Highest-confidence pairs first."
            actions={
              <Link to="/matches" className="link text-[12px]">
                Open <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {(data.queue_preview ?? []).map((row) => (
              <li key={row.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`pill text-[10px] ${
                      row.band === "high"
                        ? "border-teal/40 bg-teal-tint text-teal-dark"
                        : row.band === "medium"
                          ? "border-gold/50 bg-gold-tint text-gold-ink"
                          : "border-line bg-slate-100 text-slate-600"
                    }`}
                  >
                    {row.band[0].toUpperCase() + row.band.slice(1)} · {row.confidence.toFixed(3)}
                  </span>
                  <span className="text-[10.5px] text-subtle">{row.category}</span>
                </div>
                <p className="mt-1.5 truncate text-[12px] font-medium text-ink" title={row.listing_a}>
                  {row.listing_a}
                </p>
                <p className="truncate text-[11px] text-muted" title={row.listing_b}>
                  ↔ {row.listing_b}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1.5 border-t border-line bg-[#FBFCFE] px-5 py-2.5 text-[11px] text-muted">
            <ShieldCheck className="h-3 w-3 text-teal-dark" />
            Low-confidence pairs can never be approved — they are kept apart.
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          to="/matches"
          title="Review potential matches"
          detail="Approve, reject or keep apart with the evidence in front of you."
          icon={GitMerge}
          meta={`${data.readiness.review_load} pending`}
        />
        <QuickActionCard
          to="/compare?group=HG-1001"
          title="Compare supplier offers"
          detail="See why the cheapest listed price is not always the best offer."
          icon={Scale}
          meta="Effective price"
        />
        <QuickActionCard
          to="/hotels"
          title="Explore hotel inventory"
          detail="Three supplier listings per property, with layer-1 to layer-3 detail."
          icon={Building2}
          meta="7 properties"
        />
        <QuickActionCard
          to="/sightseeing"
          title="Explore sightseeing inventory"
          detail="Same attraction, materially different tour configurations."
          icon={Landmark}
          meta="5 attractions"
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Inventory distribution by supplier"
            subtitle="Listings contributed by each fictional demo supplier, split by category."
            badge={<DemoDataTag />}
          />
          <CardBody className="pb-2">
            <div className="h-[344px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierChart} barGap={4} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fontSize: 11.5, fill: "#64748B" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: "#94A3B8" }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(15,42,68,0.04)" }}
                    contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12, boxShadow: "0 8px 24px rgba(15,42,68,0.08)" }}
                  />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11.5, color: "#64748B" }} />
                  <Bar dataKey="hotels" name="Hotel listings" fill="#0F2A44" radius={[3, 3, 0, 0]} maxBarSize={46} />
                  <Bar dataKey="sightseeing" name="Sightseeing listings" fill="#16B8A6" radius={[3, 3, 0, 0]} maxBarSize={46} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
          <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
            {data.supplier_distribution.map((supplier) => (
              <div key={supplier.code} className="px-4 py-3">
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: supplier.accent }} />
                  {supplier.name}
                </p>
                <p className="num mt-0.5 text-[11px] text-muted">
                  {supplier.listings} listings · {supplier.share}% share
                </p>
                <p className="text-[10.5px] text-subtle">{supplier.tier}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader title="Match confidence distribution" subtitle="Candidate pairs by band." badge={<DemoDataTag />} />
            <CardBody className="pt-2">
              <div className="flex items-center gap-2">
                <div className="h-[132px] w-[132px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={confidenceChart} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2} strokeWidth={0}>
                        {confidenceChart.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-1.5">
                  {confidenceChart.map((entry) => (
                    <li key={entry.name} className="flex items-center justify-between text-[11.5px]">
                      <span className="flex items-center gap-1.5 text-muted">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}
                      </span>
                      <span className="num font-semibold text-ink">{entry.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-2 border-t border-line pt-2 text-[10.5px] leading-4 text-subtle">
                Bands: high ≥ {data.thresholds.high.toFixed(2)} (auto-suggest), medium ≥ {data.thresholds.medium.toFixed(2)}{" "}
                (review), low (keep separate).
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Hotel vs sightseeing" subtitle="Listing mix in the demo dataset." badge={<DemoDataTag />} />
            <CardBody className="pt-1">
              <div className="h-[126px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryChart} dataKey="value" nameKey="name" innerRadius={34} outerRadius={58} strokeWidth={0}>
                      {categoryChart.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-1 flex justify-center gap-4">
                {categoryChart.map((entry) => (
                  <li key={entry.name} className="flex items-center gap-1.5 text-[11px] text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name.split(" ")[0]} <span className="num font-semibold text-ink">{entry.value}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader title="Match outcomes by band" subtitle="Review state of every candidate pair." badge={<DemoDataTag />} />
          <CardBody>
            <div className="h-[248px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outcomeChart} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }} barGap={3}>
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="band" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: "#64748B" }} width={76} />
                  <Tooltip cursor={{ fill: "rgba(15,42,68,0.04)" }} contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Approved" stackId="a" fill="#16B8A6" radius={[3, 0, 0, 3]} maxBarSize={22} />
                  <Bar dataKey="Pending" stackId="a" fill="#F59E0B" maxBarSize={22} />
                  <Bar dataKey="Rejected" stackId="a" fill="#CBD5E1" radius={[0, 3, 3, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent matching activity"
            subtitle="Batch matching and enrichment runs."
            actions={<Link to="/matches" className="link text-[12px]">View queue</Link>}
          />
          <ul className="divide-y divide-line">
            {data.recent_activity.slice(0, 5).map((event) => (
              <li key={event.id} className="flex items-start gap-2.5 px-5 py-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-ink">{event.title}</p>
                  <p className="truncate text-[11px] text-muted">{event.detail}</p>
                  <p className="text-[10.5px] text-subtle">
                    {event.actor} · {relativeTime(event.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Recent review activity"
            subtitle="Human decisions recorded in the audit trail."
            actions={<Link to="/matches" className="link text-[12px]">Open reviews</Link>}
          />
          <ul className="divide-y divide-line">
            {data.recent_reviews.slice(0, 5).map((review) => (
              <li key={review.id} className="px-5 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`pill text-[10px] ${
                      review.decision === "approve"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : review.decision === "reject"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {labelForDecision(review.decision)}
                  </span>
                  <p className="truncate text-[12px] font-medium text-ink">{review.subject}</p>
                </div>
                <p className="mt-0.5 text-[10.5px] text-muted">
                  {review.reviewer} · {relativeTime(review.decided_at)}
                  {review.confidence !== null ? ` · confidence ${review.confidence.toFixed(3)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Inventory coverage by category and city"
          subtitle="Where consolidation work is concentrated in the demo dataset."
          badge={<DemoDataTag />}
        />
        <div className="overflow-x-auto scroll-thin">
          <table className="table">
            <thead>
              <tr>
                <th className="th">City</th>
                <th className="th text-right">Hotel products</th>
                <th className="th text-right">Sightseeing products</th>
                <th className="th text-right">Supplier listings</th>
                <th className="th">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {data.charts.coverage_by_city.map((row) => {
                const max = Math.max(...data.charts.coverage_by_city.map((entry) => entry.listings));
                return (
                  <tr key={row.city} className="row-hover">
                    <td className="td font-medium">{row.city}</td>
                    <td className="td num text-right">{row.hotels}</td>
                    <td className="td num text-right">{row.sightseeing}</td>
                    <td className="td num text-right font-medium">{row.listings}</td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-teal" style={{ width: `${(row.listings / max) * 100}%` }} />
                        </div>
                        <span className="num text-[11px] text-muted">{Math.round((row.listings / max) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
