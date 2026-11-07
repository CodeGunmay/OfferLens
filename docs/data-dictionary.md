# Data dictionary

Names map 1:1 to SQLAlchemy models in `backend/app/models/`.

## suppliers

| Column | Type | Notes |
| --- | --- | --- |
| `id` | int PK | |
| `code` | str(32) unique | `ATLAS`, `MERIDIAN`, `HORIZON` (fictional) |
| `name` | str(80) | Display name |
| `tier` | str(32) | Direct connect / Aggregator / Channel manager |
| `region` | str(64) | |
| `accent` | str(16) | UI colour token |

## product_groups — canonical product (layer 1 output)

| Column | Type | Notes |
| --- | --- | --- |
| `code` | str(24) unique | `HG-1001`, `SG-2001` |
| `category` | str(24) | `hotel` \| `sightseeing` |
| `canonical_name` | str(160) | Consolidated name shown to agents |
| `city`, `region`, `country`, `address` | str | Normalized location |
| `star_rating` | float? | Null for attractions |
| `latitude`, `longitude` | float | Approximate for demo data |
| `status` | str(24) | `confirmed` (human-reviewed) \| `proposed` |
| `confidence` | float | Mean of member listing match confidence |

## supplier_listings — one supplier's representation

| Column | Type | Notes |
| --- | --- | --- |
| `supplier_id` | FK suppliers | |
| `product_group_id` | FK product_groups? | Null = unmapped (hard negatives) |
| `supplier_property_id` | str(48) | Supplier's own ID, stored verbatim |
| `name`, `address`, `city` | str | Raw supplier content |
| `latitude`, `longitude` | float | May be 0/0 when missing → geo similarity 0 |
| `star_rating` | float? | Supplier's own rating (may conflict) |
| `amenities` | JSON list | Free text; canonicalized at compare time |
| `match_confidence` | float | Highest pairwise confidence for this listing |
| `mapping_status` | str(32) | `auto-matched` \| `awaiting review` \| `unmapped` \| `kept separate` |
| `content_completeness` | int 0–100 | Illustrative in the demo seed |
| `image_status` | str(80) | Default: "Illustrative image — source verification required" |
| `source_type` | str(64) | Default: "Synthetic demonstration data" |

## room_configs — layer 2 (hotels)

| Column | Type | Notes |
| --- | --- | --- |
| `listing_id` | FK supplier_listings | |
| `room_category` | str(80) | Supplier wording |
| `equivalence_class` | str(64) | `deluxe_king`, `executive_suite`, `deluxe_double`… |
| `bed_type`, `view` | str | |
| `size_sqm` | int? | Null when the supplier does not publish it |
| `occupancy_adults`, `max_occupancy` | int | |
| `facilities` | JSON list | In-room facilities |
| `extraction_note` | str(160) | How the row was derived ("Normalized from 'DLX KING'") |

## rate_plans — layer 3 (hotels)

| Column | Type | Notes |
| --- | --- | --- |
| `room_config_id` | FK room_configs | |
| `base_price`, `currency` | float, str | Listed price |
| `meal_plan` | str(48) | `Room only`, `Breakfast`, `Half board`, `All inclusive` |
| `refundable` | bool | |
| `cancellation_deadline_hours` | int? | Hours before arrival; null when non-refundable |
| `cancellation_policy_note` | str(160) | Agent-facing wording |
| `payment_terms` | str(48) | `Pay now`, `Pay at hotel`, `Deposit 20%` |
| `deposit_percent` | int | |
| `rooms_available` | int | Drives the availability ranking component |

## activity_configs — layer 2 (sightseeing)

| Column | Type | Notes |
| --- | --- | --- |
| `listing_id` | FK | |
| `activity_name` | str(160) | Supplier tour title |
| `equivalence_class` | str(64) | `taj_guided`, `amber_guided`… |
| `activity_type` | str(64) | Guided monument visit, walking tour |
| `duration_hours` | float | |
| `experience_type` | str(48) | `Private`, `Small group`, `Shared group` |
| `access_type` | str(48) | `Standard entry`, `Skip-the-line` |
| `included_services` | JSON list | |
| `transfers` | str(64) | `Included — hotel pickup`, `Not included`… |
| `meeting_point`, `languages` | str / JSON | |

## activity_offers — layer 3 (sightseeing)

| Column | Type | Notes |
| --- | --- | --- |
| `activity_config_id` | FK | |
| `price`, `currency`, `price_basis` | float, str, str | |
| `meals`, `access_included` | str | |
| `cancellation_policy` | str(48) | `Free cancellation`, `Partial cancellation`, `Non-refundable` |
| `cancellation_window_hours` | int? | |
| `max_group_size`, `slots_available` | int | |

## match_candidates — pairwise decisions

| Column | Type | Notes |
| --- | --- | --- |
| `listing_a_id`, `listing_b_id` | FK | Ordered pair |
| `product_group_id` | FK? | Proposed canonical product (null when no merge proposed) |
| `category` | str(24) | |
| `confidence` | float | 0–0.99 from the matcher |
| `band` | str(16) | `high` \| `medium` \| `low` |
| `evidence` | JSON | Feature values, weights, contributions, caps, thresholds |
| `conflicts`, `missing` | JSON list | Human-readable strings shown in the UI |
| `auto_suggestable` | bool | band == high |
| `status` | str(24) | `pending` \| `approved` \| `rejected` \| `separate` |
| `reviewer`, `reviewed_at` | str?, datetime? | |

## review_decisions — append-only audit

`candidate_id`, `decision`, `reviewer`, `note`, `decided_at`.

## audit_events — activity feed

`kind` (`match_run` \| `review` \| `enrichment`), `actor`, `title`, `detail`,
`category`, `created_at`.

## client_profiles

`key` (`budget` \| `flexible` \| `family` \| `business`), `name`, `description`,
`weights` JSON (`price`, `meals`, `cancellation`, `payment`, `convenience`),
`is_default`.

## value_assumptions

| Column | Notes |
| --- | --- |
| `key` | `breakfast_value_per_night`, `non_refundable_risk_pct`, … |
| `value`, `unit` | e.g. `450` INR, `6` "% of base price" |
| `category` | `hotel` \| `sightseeing` |
| `source` | **Mandatory** provenance label; illustrative values say so |
| `is_editable` | |

## app_settings / ranking_weights

Key/value stores for workspace thresholds, environment label, demo badges and
the default ranking weights.

---

### Derived (not stored)

| Value | Where | Definition |
| --- | --- | --- |
| Effective price | `services/effective_price.py` | listed + inclusion gaps + risk premium + prepayment cost |
| Fit score | `services/fit_scoring.py` | weighted, set-normalized dimension scores × profile weights |
| Ranking score | `ranking/listing_ranker.py` | price 30 · availability 20 · content 15 · cancellation 15 · confidence 20 |
| Meaningful difference | `services/overview_service.py` | product whose offers differ on meals, cancellation or payment |
