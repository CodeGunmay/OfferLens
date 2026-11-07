# OfferLens backend

FastAPI + SQLAlchemy service for multi-supplier offer matching, offer
intelligence and ranking. Demo data is synthetic and labelled as such in every
response.

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API root: `http://localhost:8000/api`
- OpenAPI docs: `http://localhost:8000/docs`
- On first start the SQLite database is created and seeded automatically
  (`SEED_ON_STARTUP=true`).
- If `../frontend/dist` exists, the app also serves the built SPA at `/`.

## Tests

```bash
python -m pytest -q
```

31 tests cover the matcher (similarity, caps, banding, blocking), the
effective-price model (component direction, traceability, the
cheapest-listed/effective inversion), fit scoring (profile-dependent
recommendation, weight normalization) and the API contract (including the
low-confidence approval guard).

## Layout

```
app/
├── api/            HTTP layer: routes/ + deps
├── matching/       normalize · amenities · similarity · property_matcher
├── models/         SQLAlchemy ORM entities
├── ranking/        listing_ranker (transparent scoring)
├── schemas/        Pydantic request models
├── services/       assumptions · effective_price · fit_scoring · offer ·
│                   inventory · match · ranking · overview · analytics · settings
├── database/       session · seed · demo_data/ (synthetic dataset)
├── config.py       pydantic-settings configuration
└── main.py         app factory, CORS, static SPA serving
```

Business rules worth knowing:

- Any detected conflict caps match confidence at 0.84, below the 0.85
  auto-suggest band, so contradictions always reach a human.
- Low-band pairs cannot be approved — enforced in `services/match_service.py`,
  not only in the UI.
- Effective price never invents a rupee: each component carries
  `assumption_key`, and each assumption carries a `source` label.
- Popularity/conversion is not a ranking signal; there is no booking data.

## Demo data

`app/database/demo_data/` — three fictional suppliers, 7 hotel products, 5
sightseeing products, 30 listings, deliberate hard negatives. Regenerate the
exported snapshot with:

```bash
python -m scripts.export_demo_data        # writes ../data/synthetic/*.json
python -m app.database.seed --force       # reset the local database
```

## PostgreSQL

The schema uses portable SQLAlchemy types. To run on PostgreSQL:

```bash
pip install "psycopg[binary]"
export DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/offerlens"
uvicorn app.main:app --port 8000
```

## What is not implemented

Authentication/authorization, live supplier ingestion, booking/availability
refresh, and any trained model. See the root README for the full list.
