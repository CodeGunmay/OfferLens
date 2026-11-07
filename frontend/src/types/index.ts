/** Shared API types. Mirrors backend response shapes (docs/api-contracts.md). */

export type ConfidenceBand = "high" | "medium" | "low";
export type Category = "hotel" | "sightseeing";
export type ReviewStatus = "pending" | "approved" | "rejected" | "separate";

export interface SupplierRef {
  code: string;
  name: string;
  accent: string;
}

export interface RatePlan {
  id: number;
  base_price: number;
  currency: string;
  meal_plan: string;
  refundable: boolean;
  cancellation_deadline_hours: number | null;
  cancellation_policy_note: string;
  payment_terms: string;
  deposit_percent: number;
  rooms_available: number;
  updated_at: string | null;
}

export interface RoomConfig {
  id: number;
  room_category: string;
  equivalence_class: string;
  bed_type: string;
  view: string;
  size_sqm: number | null;
  occupancy_adults: number;
  max_occupancy: number;
  facilities: string[];
  extraction_note: string;
  rate_plans: RatePlan[];
}

export interface ActivityOffer {
  id: number;
  price: number;
  currency: string;
  price_basis: string;
  meals: string;
  access_included: string;
  cancellation_policy: string;
  cancellation_window_hours: number | null;
  max_group_size: number;
  slots_available: number;
  updated_at: string | null;
}

export interface ActivityConfig {
  id: number;
  activity_name: string;
  equivalence_class: string;
  activity_type: string;
  duration_hours: number;
  experience_type: string;
  access_type: string;
  included_services: string[];
  transfers: string;
  meeting_point: string;
  languages: string[];
  offers: ActivityOffer[];
}

export interface Listing {
  id: number;
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  supplier_accent: string;
  supplier_property_id: string;
  name: string;
  category: Category;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  star_rating: number | null;
  amenities: string[];
  match_confidence: number;
  mapping_status: string;
  content_completeness: number;
  image_status: string;
  source_type: string;
  updated_at: string | null;
  rooms: RoomConfig[];
  activities: ActivityConfig[];
}

export interface ProductGroup {
  id: number;
  code: string;
  category: Category;
  canonical_name: string;
  city: string;
  region: string;
  country: string;
  address: string;
  star_rating: number | null;
  latitude: number;
  longitude: number;
  description: string;
  status: "confirmed" | "proposed";
  confidence: number;
}

export interface GroupSummary extends ProductGroup {
  listing_count: number;
  suppliers: SupplierRef[];
  price_from: number | null;
  price_to: number | null;
  mapping_statuses: string[];
  avg_content_completeness: number;
}

export interface MatchEvidence {
  name_similarity: number;
  geo_similarity: number;
  distance_m: number | null;
  address_similarity: number;
  attribute_agreement: number;
  weights: Record<string, number>;
  contributions: Record<string, number>;
  caps_applied: string[];
  band_thresholds: { high: number; medium: number };
}

export interface PairEvidence {
  listing_a_id: number;
  listing_b_id: number;
  listing_a_name: string;
  listing_b_name: string;
  supplier_a: string;
  supplier_b: string;
  confidence: number;
  band: ConfidenceBand;
  evidence: MatchEvidence;
  conflicts: string[];
  missing: string[];
  summary: string;
}

export interface AgreementRow {
  attribute: string;
  values: { supplier: string; value: string | number | null }[];
  status: "match" | "partial" | "conflict" | "missing";
  note: string;
  shared?: string[];
  partial?: string[];
}

export interface RoomClassEntry {
  listing_id: number;
  supplier: string;
  supplier_code: string;
  supplier_accent: string;
  id: number;
  room_category: string;
  bed_type: string;
  view: string;
  size_sqm: number | null;
  max_occupancy: number;
  occupancy_adults: number;
  facilities: string[];
  extraction_note: string;
  rate_plans: RatePlan[];
}

export interface RoomClass {
  equivalence_class: string;
  label: string;
  supplier_count: number;
  entries: RoomClassEntry[];
  differences: string[];
  comparable: boolean;
  occupancy_range: number[];
}

export interface ActivityClassEntry {
  listing_id: number;
  supplier: string;
  supplier_code: string;
  supplier_accent: string;
  id: number;
  activity_name: string;
  equivalence_class: string;
  activity_type: string;
  duration_hours: number;
  experience_type: string;
  access_type: string;
  included_services: string[];
  transfers: string;
  meeting_point: string;
  languages: string[];
  offers: Omit<ActivityOffer, "updated_at">[];
}

export interface ActivityClass {
  equivalence_class: string;
  label: string;
  supplier_count: number;
  entries: ActivityClassEntry[];
  differences: string[];
  comparable: boolean;
}

export interface CandidateRef {
  id: number;
  confidence: number;
  band: ConfidenceBand;
  status: ReviewStatus;
  summary: string;
  conflicts: string[];
  missing: string[];
}

export interface GroupDetail {
  group: ProductGroup;
  summary: GroupSummary;
  listings: Listing[];
  identity_evidence: PairEvidence[];
  agreement: AgreementRow[];
  room_classes: RoomClass[];
  activity_classes?: ActivityClass[];
  candidates: CandidateRef[];
  price_band: { from: number | null; to: number | null };
  avg_confidence: number;
}

export interface ListResponse<T> {
  items: T[];
  total?: number;
  filters?: { cities: string[]; statuses: string[]; suppliers: { code: string; name: string }[] };
  category?: Category;
}

export interface Metric {
  key: string;
  label: string;
  value: number | string;
  unit: string;
  context: string;
}

export interface ActivityEvent {
  id: number;
  kind: string;
  actor: string;
  title: string;
  detail: string;
  category: string;
  created_at: string | null;
}

export interface ReviewEvent {
  id: number;
  decision: string;
  reviewer: string;
  note: string;
  decided_at: string | null;
  subject: string;
  confidence: number | null;
  band: ConfidenceBand | null;
}

export interface OverviewResponse {
  metrics: Metric[];
  supplier_distribution: {
    code: string;
    name: string;
    accent: string;
    tier: string;
    listings: number;
    hotels: number;
    sightseeing: number;
    share: number;
  }[];
  charts: {
    supplier_distribution: OverviewResponse["supplier_distribution"];
    confidence_bands: { band: string; label: string; count: number }[];
    category_split: { name: string; value: number }[];
    match_outcomes: { band: string; approved: number; pending: number; rejected: number; separate: number }[];
    coverage_by_city: { city: string; hotels: number; sightseeing: number; listings: number }[];
  };
  thresholds: { high: number; medium: number };
  recent_activity: ActivityEvent[];
  recent_reviews: ReviewEvent[];
  readiness: { matched_pct: number; review_load: number; avg_confidence: number };
  data_notice: string;
  /** Cheapest-listed vs best-value gap for one representative hotel product. */
  price_insight: {
    group_code: string;
    group_name: string;
    city: string;
    profile_key: string;
    profile_name: string;
    offer_count: number;
    cheapest_listed: { supplier: string; listed_price: number; effective_price: number };
    recommended: { supplier: string; listed_price: number; effective_price: number; fit_score: number };
    effective_gap: number;
    listed_spread: number;
    effective_spread: number;
    cheapest_effective_price: number;
    offers: {
      supplier: string;
      listed_price: number;
      effective_price: number;
      uplift: number;
      is_recommended: boolean;
      is_cheapest_listed: boolean;
    }[];
    note: string;
  } | null;
  /** Highest-confidence pairs still awaiting a reviewer. */
  queue_preview: {
    id: number;
    category: string;
    confidence: number;
    band: ConfidenceBand;
    listing_a: string;
    listing_b: string;
    supplier_a: string;
    supplier_b: string;
    conflicts: string[];
  }[];
}

export interface EffectiveComponent {
  key: string;
  label: string;
  amount: number;
  assumption_key: string | null;
  note: string;
}

export interface EvaluatedOffer {
  id: string;
  supplier_name: string;
  supplier_code: string;
  listing_id: number;
  listing_name: string;
  supplier_property_id: string;
  room_category?: string;
  bed_type?: string;
  view?: string;
  size_sqm?: number | null;
  max_occupancy?: number;
  facilities?: string[];
  activity_name?: string;
  duration_hours?: number;
  experience_type?: string;
  access_type?: string;
  included_services?: string[];
  transfers?: string;
  languages?: string[];
  max_group_size?: number;
  base_price: number;
  listed_price: number;
  currency: string;
  meal_plan?: string;
  meals?: string;
  refundable: boolean;
  cancellation_deadline_hours: number | null;
  cancellation_policy_note?: string;
  cancellation_policy?: string;
  payment_terms: string;
  availability: number;
  content_completeness: number;
  match_confidence: number;
  effective: {
    effective_price: number;
    listed_price: number;
    uplift: number;
    uplift_pct: number;
    components: EffectiveComponent[];
    currency: string;
  };
  dimensions: Record<string, number>;
  contributions: Record<string, number>;
  fit_score: number;
  fit_rank: number;
  reasons: string[];
  warnings: string[];
  summary: string;
}

export interface ClientProfile {
  key: string;
  name: string;
  description: string;
  weights: Record<string, number>;
  is_default: boolean;
}

export interface ValueAssumption {
  key: string;
  label: string;
  value: number;
  unit: string;
  category: string;
  source: string;
  is_editable: boolean;
}

export interface DifferenceCard {
  identical: { label: string; value: string | number | null }[];
  different: { label: string; values: Record<string, string | number | null | undefined> }[];
  included: Record<string, string[]>;
  excluded: Record<string, string[]>;
  recommended_supplier: string;
  dimension_labels: Record<string, string>;
  statement: string;
}

export interface CompareResponse {
  group: ProductGroup;
  category: Category;
  equivalence_class: string | null;
  classes: { equivalence_class: string; label: string; supplier_count: number }[];
  profile: ClientProfile;
  profiles: ClientProfile[];
  weights: Record<string, number>;
  dimension_labels: Record<string, string>;
  offers: EvaluatedOffer[];
  recommended_offer_id: string;
  cheapest_listed_offer_id: string;
  cheapest_effective_offer_id: string;
  recommendation_reason: string;
  cheapest_trap_note: string | null;
  difference_card: DifferenceCard;
  score_basis: string;
  assumptions: ValueAssumption[];
  assumptions_used: Record<string, number>;
  disclaimer: string;
  empty?: boolean;
}

export interface MatchRow {
  id: number;
  category: Category;
  confidence: number;
  band: ConfidenceBand;
  status: ReviewStatus;
  auto_suggestable: boolean;
  summary: string;
  conflicts: string[];
  missing: string[];
  evidence: MatchEvidence;
  guidance: string;
  reviewer: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  listing_a: Listing | null;
  listing_b: Listing | null;
  same_group: boolean;
  proposed_group: ProductGroup | null;
  decisions: { decision: string; reviewer: string; note: string; decided_at: string | null }[];
}

export interface MatchListResponse {
  items: MatchRow[];
  counts: Record<string, number>;
  band_guidance: Record<string, string>;
}

export interface RankingRow {
  id: string;
  position: number;
  supplier_name: string;
  supplier_code: string;
  listing_name: string;
  room_or_activity: string;
  listed_price: number;
  effective_price: number;
  meal_plan: string | null;
  cancellation: string | null;
  refundable: boolean;
  cancellation_deadline_hours: number | null;
  payment_terms: string | null;
  availability: number;
  content_completeness: number;
  match_confidence: number;
  components: Record<string, { label: string; weight: number; score: number; contribution: number }>;
  score: number;
  reasons: string[];
  warnings: string[];
  position_reason: string;
}

export interface RankingResponse {
  group: ProductGroup;
  category: Category;
  equivalence_class: string | null;
  weights: Record<string, number>;
  offers: RankingRow[];
  model_note: string;
  default_weights: Record<string, number>;
  before: {
    title: string;
    fragmented: { supplier: string; title: string; line: string; price: number }[];
    problem: string;
  };
  after: {
    title: string;
    product: string;
    offers: { position: number; supplier: string; offer: string; effective_price: number; score: number }[];
    benefit: string;
  };
  assumptions: ValueAssumption[];
}

export interface EnrichmentGroup {
  group: ProductGroup;
  supplier_names: {
    supplier: string;
    supplier_property_id: string;
    name: string;
    content_completeness: number;
    image_status: string;
  }[];
  consolidated_name: string;
  verified_amenities: string[];
  additional_amenities: string[];
  amenity_mapping: { supplier: string; items: { original: string; canonical: string; label: string }[] }[];
  conflicts: string[];
  missing: string[];
  completeness: number;
  image_status: string;
  source_type: string;
}

export interface EnrichmentResponse {
  hotels: EnrichmentGroup[];
  sightseeing: EnrichmentGroup[];
  notice: string;
}

export interface AnalyticsMetric {
  key: string;
  label: string;
  definition: string;
  method: string;
  target: string;
  group: string;
  status: string;
  measured_value: null;
}

export interface AnalyticsResponse {
  notice: string;
  summary: string;
  metrics: AnalyticsMetric[];
  sample_scenarios: {
    key: string;
    title: string;
    note: string;
    series: Record<string, string | number>[];
  }[];
  data_requirements: string[];
  measurement_plan: { step: number; title: string; detail: string }[];
}

export interface WorkspaceSettings {
  workspace: {
    environment: string;
    auto_match_threshold: number;
    review_threshold: number;
    default_profile: string;
    show_demo_badges: boolean;
    data_source: string;
  };
  profiles: ClientProfile[];
  assumptions: ValueAssumption[];
  thresholds: { high: number; medium: number };
  data_notice: string;
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}
