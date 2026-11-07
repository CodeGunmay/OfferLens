# API contracts

Base URL: `/api` · Interactive docs: `/docs` · Content type: `application/json`.

Conventions
- All money values are INR floats. `confidence` is 0–0.99.
- Every payload that contains illustrative data also contains a notice field
  (`data_notice`, `disclaimer`, or `model_note`).
- Errors are `{"detail": "..."}` with 404 (unknown product), 409 (blocked
  action, e.g. approving a low-confidence pair), 400 (invalid request).

## System

### `GET /api/health`
```json
{ "status": "ok", "service": "OfferLens API", "environment": "DEMO WORKSPACE", "database": "sqlite" }
```

## Overview

### `GET /api/overview`
```json
{
  "metrics": [{ "key": "total_listings", "label": "Total supplier listings", "value": 30,
                "unit": "", "context": "Across 3 demo suppliers · 12 canonical products" }],
  "supplier_distribution": [{ "code": "ATLAS", "name": "Supplier Atlas", "accent": "#16B8A6",
                              "tier": "Direct connect", "listings": 9, "hotels": 6,
                              "sightseeing": 3, "share": 30.0 }],
  "charts": {
    "confidence_bands": [{ "band": "high", "label": "High", "count": 5 }],
    "category_split": [{ "name": "Hotel inventory", "value": 18 }],
    "match_outcomes": [{ "band": "High", "approved": 3, "pending": 2, "rejected": 0, "separate": 0 }],
    "coverage_by_city": [{ "city": "New Delhi", "hotels": 4, "sightseeing": 2, "listings": 16 }]
  },
  "thresholds": { "high": 0.85, "medium": 0.72 },
  "recent_activity": [{ "id": 1, "kind": "match_run", "actor": "Matching batch job",
                        "title": "Nightly property blocking + pairwise match run completed",
                        "detail": "16 hotel listings · 12 blocked pairs", "created_at": "..." }],
  "recent_reviews": [{ "id": 1, "decision": "approve", "reviewer": "ops.ananya",
                       "subject": "Taj Palace New Delhi", "confidence": 0.874 }],
  "readiness": { "matched_pct": 47, "review_load": 13, "avg_confidence": 0.712 },
  "data_notice": "All metrics are DEMO DATA computed from the synthetic demonstration dataset."
}
```

## Inventory

### `GET /api/inventory/hotels?search=&city=&supplier=&status=&sort=`
`sort ∈ {confidence,name,city,listings,price}`. Same shape for
`/api/inventory/sightseeing`.

```json
{
  "items": [{
    "id": 1, "code": "HG-1001", "category": "hotel",
    "canonical_name": "The Grand Imperial, New Delhi", "city": "New Delhi",
    "address": "Janpath Road, Connaught Place, New Delhi 110001",
    "star_rating": 5.0, "status": "confirmed", "confidence": 0.859,
    "listing_count": 3,
    "suppliers": [{ "code": "ATLAS", "name": "Supplier Atlas", "accent": "#16B8A6" }],
    "price_from": 4500, "price_to": 5200,
    "mapping_statuses": ["auto-matched"], "avg_content_completeness": 85
  }],
  "filters": { "cities": ["Agra", "Jaipur", "New Delhi"], "statuses": ["confirmed", "proposed"],
               "suppliers": [{ "code": "ATLAS", "name": "Supplier Atlas" }] },
  "total": 7, "category": "hotel"
}
```

### `GET /api/inventory/hotels/{code}` — the three-layer payload

```json
{
  "group": { "code": "HG-1001", "canonical_name": "The Grand Imperial, New Delhi", "...": "..." },
  "summary": { "...": "group summary as above" },
  "listings": [{
    "id": 1, "supplier_name": "Supplier Atlas", "supplier_property_id": "GP-DEL-10021",
    "name": "Grand Imperial Hotel Delhi", "address": "...", "latitude": 28.6251,
    "longitude": 77.2193, "star_rating": 5.0, "amenities": ["Free WiFi"],
    "match_confidence": 0.879, "mapping_status": "auto-matched", "content_completeness": 92,
    "source_type": "Synthetic demonstration data",
    "image_status": "Illustrative image — source verification required",
    "rooms": [{ "room_category": "Deluxe King", "equivalence_class": "deluxe_king",
                "bed_type": "King bed", "max_occupancy": 3,
                "rate_plans": [{ "base_price": 5000, "meal_plan": "Breakfast",
                                 "refundable": true, "cancellation_deadline_hours": 24,
                                 "payment_terms": "Pay now", "rooms_available": 6 }] }],
    "activities": []
  }],
  "identity_evidence": [{
    "listing_a_name": "Grand Imperial Hotel Delhi", "listing_b_name": "The Grand Imperial New Delhi",
    "confidence": 0.879, "band": "high",
    "evidence": { "name_similarity": 0.88, "geo_similarity": 0.93, "distance_m": 85,
                  "address_similarity": 0.89, "attribute_agreement": 0.88,
                  "weights": { "name": 0.35, "geo": 0.3, "address": 0.2, "attributes": 0.15 },
                  "contributions": { "name": 0.309, "geo": 0.28, "address": 0.179, "attributes": 0.131 },
                  "caps_applied": [], "band_thresholds": { "high": 0.85, "medium": 0.72 } },
    "conflicts": [], "missing": [], "summary": "Names, location and attributes agree — safe to suggest as the same property."
  }],
  "agreement": [{ "attribute": "Star rating", "values": [{ "supplier": "Supplier Atlas", "value": 5 }],
                  "status": "match", "note": "" }],
  "room_classes": [{ "equivalence_class": "deluxe_king", "label": "Deluxe King",
                     "supplier_count": 3, "comparable": true,
                     "entries": [{ "supplier": "Supplier Atlas", "room_category": "Deluxe King",
                                   "bed_type": "King bed", "max_occupancy": 3,
                                   "rate_plans": [{ "base_price": 5000 }] }],
                     "differences": ["Max occupancy differs (2–3 guests)"],
                     "occupancy_range": [2, 3] }],
  "activity_classes": [],
  "candidates": [{ "id": 1, "confidence": 0.879, "band": "high", "status": "approved" }],
  "price_band": { "from": 4500, "to": 9200 }, "avg_confidence": 0.859
}
```

`GET /api/inventory/sightseeing/{code}` returns the same shape with
`activity_classes` populated.

### `GET /api/inventory/content`
`{ "hotels": [ { "group": {...}, "consolidated_name": "...", "verified_amenities": [...],
"additional_amenities": [...], "amenity_mapping": [...], "conflicts": [...],
"missing": [...], "completeness": 85, "image_status": "...", "source_type": "..." } ],
"sightseeing": [...], "notice": "..." }`

## Offers

### `POST /api/offers/compare`

```json
{ "group_code": "HG-1001", "category": "hotel", "equivalence_class": "deluxe_king",
  "profile_key": "flexible",
  "weights": { "price": 20, "meals": 20, "cancellation": 40, "payment": 10, "convenience": 10 },
  "assumptions": { "breakfast_value_per_night": 500 } }
```
All fields except `group_code` are optional. Custom `weights` are normalized to
100; `assumptions` override seeded values for this request only.

Response (abridged):
```json
{
  "group": { "code": "HG-1001", "...": "..." },
  "category": "hotel", "equivalence_class": "deluxe_king",
  "classes": [{ "equivalence_class": "deluxe_king", "label": "Deluxe King", "supplier_count": 3 }],
  "profile": { "key": "flexible", "name": "Flexible Traveller", "weights": { "cancellation": 45 } },
  "profiles": [ "..." ],
  "weights": { "price": 15, "meals": 15, "cancellation": 45, "payment": 15, "convenience": 10 },
  "dimension_labels": { "price": "Effective price", "payment": "Payment flexibility" },
  "offers": [{
    "id": "rate-2", "supplier_name": "Supplier Meridian", "listed_price": 4500,
    "effective": { "effective_price": 5287.5, "uplift": 787.5, "uplift_pct": 17.5,
      "components": [
        { "key": "base_price", "label": "Listed base price", "amount": 4500, "assumption_key": null },
        { "key": "breakfast_gap", "label": "Breakfast not included (Room only)", "amount": 450,
          "assumption_key": "breakfast_value_per_night", "note": "..." },
        { "key": "non_refundable_risk", "label": "Non-refundable risk premium", "amount": 270,
          "assumption_key": "non_refundable_risk_pct" },
        { "key": "payment_cost", "label": "Pay now — settlement cost", "amount": 67.5,
          "assumption_key": "prepayment_cost_pct" }] },
    "dimensions": { "price": 0.0, "meals": 0.0, "cancellation": 0.0, "payment": 0.2, "convenience": 0.74 },
    "contributions": { "price": 0.0, "meals": 0.0, "cancellation": 0.0, "payment": 0.02, "convenience": 0.049 },
    "fit_score": 10.4, "fit_rank": 3, "reasons": ["...", "..."], "warnings": ["No cancellation right — changes will be charged in full."]
  }],
  "recommended_offer_id": "rate-3", "cheapest_listed_offer_id": "rate-2",
  "cheapest_effective_offer_id": "rate-1",
  "recommendation_reason": "Supplier Horizon ranks first for Flexible Traveller (fit 95.5/100) — strongest on cancellation flexibility and payment flexibility.",
  "cheapest_trap_note": "Lowest listed price is Supplier Meridian at ₹4,500, but its effective price is ₹5,288 — ₹88 more than the recommended offer's effective price.",
  "difference_card": { "identical": [...], "different": [...], "included": {...}, "excluded": {...} },
  "score_basis": "Dimension scores are normalized to 0–1 within this comparison set only. They rank the offers in front of you — they are not absolute quality scores.",
  "assumptions": [{ "key": "breakfast_value_per_night", "label": "Breakfast value (per room, per night)",
                    "value": 450, "unit": "INR", "category": "hotel",
                    "source": "Illustrative assumption — editable, no verified market source", "is_editable": true }],
  "disclaimer": "Effective price is a decision-support estimate built from the assumptions listed. It is not an objective market price."
}
```

### `GET /api/offers/profiles`
`{ "profiles": [...], "assumptions": [...], "dimensions": ["price","meals","cancellation","payment","convenience"] }`

### `PUT /api/offers/profiles/{key}`
Body `{ "weights": { "price": 50, "meals": 25, "cancellation": 10, "payment": 10, "convenience": 5 } }`
→ normalized to 100. `400` on unknown keys, negative values or all-zero.

### `PUT /api/offers/assumptions/{key}`
Body `{ "value": 500 }` → `{ "key", "label", "value", "unit", "source" }`.

## Matching

### `GET /api/matches?status=&band=&category=&search=&sort=`
`status ∈ {all,pending,approved,rejected,separate}` · `band ∈ {all,high,medium,low}` ·
`sort ∈ {confidence,band,status,category}`

```json
{
  "items": [{
    "id": 12, "category": "hotel", "confidence": 0.834, "band": "medium",
    "status": "pending", "auto_suggestable": false,
    "summary": "Likely the same property, but at least one attribute needs a human decision.",
    "conflicts": ["Star rating differs (5★ vs 4★)"], "missing": ["Address missing"],
    "evidence": { "name_similarity": 0.94, "geo_similarity": 0.9, "distance_m": 120,
                  "address_similarity": 0.8, "attribute_agreement": 0.55,
                  "caps_applied": ["Conflicting attribute present — human review required"] },
    "guidance": "Requires human review: at least one attribute conflicts or is missing.",
    "listing_a": { "name": "ITC Mughal, Agra", "supplier_name": "Supplier Atlas", "...": "..." },
    "listing_b": { "name": "ITC Mughal Hotel Agra", "supplier_name": "Supplier Horizon", "...": "..." },
    "same_group": true, "proposed_group": { "code": "HG-1004", "canonical_name": "ITC Mughal, Agra" },
    "decisions": []
  }],
  "counts": { "all": 27, "pending": 13, "approved": 14, "rejected": 0, "separate": 0,
              "high": 5, "medium": 13, "low": 9 },
  "band_guidance": { "high": "Suitable for automatic match suggestion — still visible to reviewers.", "...": "..." }
}
```

### `POST /api/matches/{id}/decision`
Body `{ "decision": "approve|reject|separate|reset", "reviewer": "ops.ananya", "note": "…" }`
→ the updated candidate.

| Case | Result |
| --- | --- |
| `approve` on a **low** band pair | `409` — unsafe merge blocked in the service layer |
| `approve` on medium/high | status `approved`, listing attached to the proposed group, group confirmed, approval + audit rows written |
| `separate` | status `separate`, listings marked "kept separate" |
| `reset` | status back to `pending` |

## Ranking

### `POST /api/ranking`
```json
{ "group_code": "HG-1001",
  "weights": { "effective_price": 30, "availability": 20, "content_completeness": 15,
               "cancellation": 15, "match_confidence": 20 } }
```
Response includes `offers[]` (each with `position`, `score`, `components` →
`{ label, weight, score, contribution }`, `reasons`, `warnings`,
`position_reason`), plus `before` / `after` fragmentation views and `model_note`.

## Analytics

### `GET /api/analytics`
`{ "notice": "Evaluation metric — results pending.", "metrics": [{ "key": "match_precision",
"label": "Match precision", "definition": "...", "method": "...", "target": "...",
"group": "Identity matching", "status": "Evaluation metric — results pending.",
"measured_value": null }], "sample_scenarios": [...], "data_requirements": [...],
"measurement_plan": [{ "step": 1, "title": "Build labelled sample", "detail": "..." }] }`

## Settings

### `GET /api/settings`
`{ "workspace": { "environment": "DEMO WORKSPACE", "auto_match_threshold": 0.85,
"review_threshold": 0.72, "default_profile": "flexible", "show_demo_badges": true,
"data_source": "Synthetic demonstration dataset (see data/README.md)" },
"profiles": [...], "assumptions": [...], "thresholds": { "high": 0.85, "medium": 0.72 },
"data_notice": "..." }`

### `PUT /api/settings`
Body may include `auto_match_threshold` (0.5–0.99), `review_threshold` (0.4–0.98),
`default_profile`, `show_demo_badges`. Returns the full settings payload.

## Search

### `GET /api/search?q=taj`
`{ "query": "taj", "results": [{ "type": "product", "id": "SG-2001",
"title": "Taj Mahal Guided Experience, Agra", "subtitle": "Sightseeing · Agra · confirmed",
"href": "/sightseeing/SG-2001" }] }`
