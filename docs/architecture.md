# Architecture

## Shape of the system

```
                 ┌─────────────────────────────────────────────────────┐
 Supplier feeds   │ 1. INGESTION                                        │
 (Atlas/Meridian/ │    supplier listings · rooms · rate plans · tours   │
  Horizon demo)   └───────────────┬─────────────────────────────────────┘
                                  ▼
                 ┌─────────────────────────────────────────────────────┐
                 │ 2. NORMALIZATION                                    │
                 │    name/address cleanup · amenity aliases ·         │
                 │    room classification · rate-plan field extraction │
                 └───────────────┬─────────────────────────────────────┘
                                  ▼
                 ┌─────────────────────────────────────────────────────┐
   OFFLINE       │ 3. MATCHING (batch)                                 │
   BATCH JOB     │    blocking → pairwise features → confidence →      │
                 │    safe grouping → human review queue               │
                 └───────────────┬─────────────────────────────────────┘
                                  ▼
                 ┌─────────────────────────────────────────────────────┐
                 │ 4. OFFER INTELLIGENCE                               │
                 │    layer-2 equivalence · layer-3 rate plans ·       │
                 │    effective price · difference cards               │
                 └───────────────┬─────────────────────────────────────┘
                                  ▼
                 ┌─────────────────────────────────────────────────────┐
   ONLINE        │ 5. RANKING + PRESENTATION                           │
   REQUEST PATH  │    transparent scoring · profile fit · UI           │
                 └───────────────┬─────────────────────────────────────┘
                                  ▼
                 ┌─────────────────────────────────────────────────────┐
                 │ 6. DATA MANAGEMENT                                  │
                 │    PostgreSQL-compatible schema · review audit      │
                 │    trail · editable assumptions · settings          │
                 └─────────────────────────────────────────────────────┘
```

## 1→2. Ingestion and normalization

The prototype seeds from `backend/app/database/demo_data/`. A production
adapter writes the same tables, so nothing downstream changes.

Normalization is deliberately boring and auditable:

- `app/matching/normalize.py` — lowercasing, accent stripping, stopword and
  geographic-qualifier removal. For sightseeing it also strips **tour-format
  vocabulary** (`guided`, `with transfers`, `2 hrs`, `skip the line`), because
  format belongs to layer 2, not to identity.
- `app/matching/amenities.py` — alias map (`Free WiFi` → `wifi`, `Gym` →
  `fitness`) so attribute agreement compares meaning, not wording. The same map
  is rendered on the Content Enrichment screen, so the matcher and the agent see
  identical normalizations.
- Room categories are mapped to `equivalence_class` values (`deluxe_king`,
  `executive_suite`, …). Rate plans are decomposed into five comparable fields:
  base price, meal plan, refundable flag, cancellation deadline, payment terms.

## 3. Matching (offline batch)

`app/matching/property_matcher.py`

1. **Blocking** — bucket by normalized city + first core (identity) token, then
   compare pairs within the bucket. This keeps the pair count linear-ish instead
   of `n²` across the catalogue.
2. **Pairwise features** (each 0–1):
   - `name_similarity` = 0.55·core-token overlap + 0.25·full-token overlap +
     0.20·character similarity. Token overlap itself blends containment with
     Jaccard so an added qualifier ("Sardar Patel Marg") does not halve the score.
   - `geo_similarity` = `exp(-distance_m / 1200)`
   - `address_similarity`
   - `attribute_agreement` = mean(star-class agreement, canonical amenity Jaccard)
3. **Confidence** = weighted blend. Weights are category-aware and printed in the
   API response so the UI can show the arithmetic:
   - hotel: name 0.35 · geo 0.30 · address 0.20 · attributes 0.15
   - sightseeing: name 0.30 · geo 0.40 · address 0.10 · attributes 0.20
4. **Safety caps** — contradictions override strong signals:
   - more than 3 km apart → confidence capped at 0.50
   - star classes ≥ 2 apart → capped at 0.55
   - any detected conflict → capped at 0.84 (below the auto-suggest band)
5. **Banding** — `high ≥ 0.85` (auto-suggest eligible) · `medium ≥ 0.72` (human
   review) · `low` (keep separate; approval disabled in the UI **and** the API).

Human decisions are permanent and audited: `review_decisions` is append-only and
every action also writes an `audit_events` row.

## 4. Offer intelligence

- **Layer 2** (`services/inventory_service.py`) groups rooms/activities into
  equivalence classes and names the differences ("Max occupancy differs (2–3
  guests)").
- **Layer 3** (`services/offer_service.py`) builds the comparison set for one
  equivalence class, keeping each supplier's rate plan intact.
- **Effective price** (`services/effective_price.py`):

  ```
  effective_price = base_price
                  + value of inclusions the offer lacks (breakfast, transfers, meals)
                  + risk premium for restrictive terms (non-refundable, short window)
                  + financing cost of prepayment (pay-now or deposit)
  ```

  Every component carries `assumption_key`; every assumption carries a `source`
  string. Because this prototype has no verified market source, each source reads
  *"Illustrative assumption — editable, no verified market source"*. The UI shows
  it next to the number.
- **Fit scoring** (`services/fit_scoring.py`) normalizes five dimension scores
  within the comparison set, weights them by the client profile, and reports both
  the contribution and the reasoning. Effective price is profile-independent;
  only the recommendation moves.

## 5. Ranking and presentation

`app/ranking/listing_ranker.py` scores consolidated offers on effective price
(30), availability (20), content completeness (15), cancellation (15) and match
confidence (20). Weights are adjustable and the breakdown is shown per offer.

**Popularity and conversion are excluded on purpose.** Without booking data any
such signal would be invented, and a "learned" ranking would be indefensible in a
prototype.

The React app is a thin, typed client: `src/services/api.ts` mirrors the contracts
in `docs/api-contracts.md`; pages own layout and interaction state only.

## Scale design

- Matching and consolidation run **offline** as batch jobs; the request path only
  reads precomputed product groups, offers and candidates.
- Search and ranking run **online** on those precomputed records.
- Blocking reduces pair comparisons from `n²` to per-city/per-anchor buckets.
- Everything needed for a page is returned in a single request (no chatty
  client-side joins), because an agent's time-to-quote is the product.
- PostgreSQL is the target store; SQLite is used locally. The schema uses no
  engine-specific types.

## Deliberately absent

- **No Neo4j, no vector database.** Nothing in the current matching logic needs a
  graph or embedding store. Semantics are explicit and inspectable, which matters
  more than infrastructure theatre at this stage.
- **No streaming/event bus.** Batch is sufficient and simpler to reason about.
- **No LLM in the decision path.** An agent-facing pricing recommendation must be
  reproducible and explainable; a heuristic with visible arithmetic is stronger
  here than a model nobody can audit.

## Honesty boundaries

| Claim | Status |
| --- | --- |
| "Three-layer equivalence works on the demo dataset" | Demonstrated |
| "Confidence bands route review correctly" | Demonstrated by construction (caps + API guard) |
| "Precision / recall / F1" | **Not measured** — see Analytics |
| "Conversion lift" | **Never claimed** |
| "Trained model" | There is none |
| "TBO product" | No — concept prototype |

## Future work (ordered)

1. Replace the heuristic confidence with a calibrated classifier trained on
   hand-labelled pairs; keep the same band API.
2. Maintain a room/activity taxonomy with an owner; measure layer-2 agreement.
3. Feed real availability and rate refresh into ranking (the ranking input
   already separates availability from price).
4. Agency-level assumption library for effective price (per-market breakfast
   value, per-corporate cancellation tolerance).
5. Ingestion adapters per supplier with contract tests and drift alerts.
