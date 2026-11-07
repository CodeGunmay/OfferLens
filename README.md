# OfferLens

**One product. Multiple suppliers. Clearer decisions.**

An intelligent offer-equivalence and optimization layer for multi-supplier hotel
and sightseeing inventory.

> **This is a hackathon concept prototype.** OfferLens is not an official TBO
> product, is not endorsed by TBO, and uses no TBO branding, logos or
> statistics. Every supplier, price, confidence value and metric in the running
> app is **synthetic demonstration data** unless a screen explicitly says
> otherwise. The matching model has **not** been trained or validated.

---

## What it demonstrates

Supplier fragmentation is a data problem hiding inside a commercial one. Three
suppliers list the same Delhi hotel three different ways, at three different
prices, with three different cancellation policies. An agent has seconds to pick
one for a client.

OfferLens separates three questions that are usually collapsed into one:

| Layer | Question | Resolved by |
| --- | --- | --- |
| **1 — Product identity** | Is this the same property or attraction? | Blocking → pairwise similarity → confidence band → human review |
| **2 — Room / activity configuration** | Is this the same room, or the same tour? | Equivalence classes over normalized room and activity attributes |
| **3 — Rate plan / bookable offer** | Is this the same deal? | Effective-price model + difference card + transparent ranking |

Same property does not mean same room. Same room does not mean same rate plan.
Same attraction does not mean the same tour experience. **Differences are never
merged away — they are priced and explained.**

### The effective-price idea in one table

*The Grand Imperial, New Delhi — Deluxe King, one night*

| Supplier | Room | Listed | Meals | Cancellation | Payment | Effective |
| --- | --- | --- | --- | --- | --- | --- |
| Meridian | King Deluxe | **₹4,500** | Room only | Non-refundable | Pay now | **₹5,288** |
| Atlas | Deluxe King | ₹5,000 | Breakfast | Free until 24h | Pay now | **₹5,175** |
| Horizon | Deluxe King | ₹5,200 | Breakfast | Free until 48h | Pay at hotel | **₹5,200** |

The cheapest listed price is the most expensive offer once the missing breakfast,
the lost cancellation right and prepayment cost are priced in — and the
recommended offer still changes when the agent switches the client profile from
*Budget* to *Flexible*.

---

## Repository structure

```
offerlens/
├── backend/                     FastAPI + SQLAlchemy service (Python 3.11+)
│   ├── app/
│   │   ├── api/                 HTTP routes (thin) + shared deps
│   │   ├── matching/            Layer-1 matcher: normalize, similarity, blocking
│   │   ├── models/              SQLAlchemy ORM (PostgreSQL-compatible schema)
│   │   ├── ranking/             Transparent listing-page ranking model
│   │   ├── schemas/             Pydantic request models
│   │   ├── services/            Business logic: pricing, fit, offers, review, analytics
│   │   ├── database/            Session, seed and demo dataset package
│   │   ├── config.py            Env-driven settings (no secrets in code)
│   │   └── main.py              App entrypoint + optional SPA serving
│   ├── scripts/                 export_demo_data.py
│   ├── tests/                   pytest suite (matching, pricing, API contracts)
│   ├── requirements.txt
│   └── README.md
├── frontend/                    React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/          ui/ primitives + domain/ composed widgets
│   │   ├── context/             Workspace state (source filter, toasts)
│   │   ├── hooks/               useApi, useDebounced
│   │   ├── layouts/             App shell
│   │   ├── pages/               One file per module
│   │   ├── services/            Typed API client
│   │   ├── types/               Shared response types
│   │   └── utils/               Formatting, confidence tone helpers
│   ├── package.json
│   └── README.md
├── data/
│   ├── sample/                  Drop point for TBO-provided sample data
│   ├── synthetic/               Exported demo dataset + provenance
│   └── README.md
├── docs/
│   ├── architecture.md          Pipeline, scale design, honesty boundaries
│   ├── data-dictionary.md       Tables, fields, enums
│   ├── api-contracts.md         Every endpoint with example payloads
│   └── demo-script.md           The 10-step judge walkthrough
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## Run it

### Option A — single process (production-style, recommended for demos)

```bash
# 1. Backend + API
cd backend
python3 -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000        # seeds SQLite on first run

# 2. Build the frontend once
cd ../frontend
npm install
npm run build

# 3. Open http://localhost:8000  (FastAPI serves the built SPA + /api)
#    API docs: http://localhost:8000/docs
```

### Option B — hot-reload development

```bash
# terminal 1
cd backend && uvicorn app.main:app --reload --port 8000
# terminal 2
cd frontend && npm install && npm run dev     # http://localhost:5173, proxies /api
```

### Tests

```bash
cd backend && python -m pytest -q          # 31 tests: matching, effective price, API
cd frontend && npm run typecheck           # strict TypeScript
```

### Reset the demo data

```bash
cd backend && python -m app.database.seed --force
```

---

## Environment setup

Copy `.env.example` to `.env` and edit as needed. **No credentials are ever
committed.**

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./offerlens.db` | Portable schema; switch to `postgresql+psycopg://…` for PostgreSQL |
| `SEED_ON_STARTUP` | `true` | Seed the demo dataset when the database is empty |
| `ENVIRONMENT` | `DEMO WORKSPACE` | Shown in the UI environment indicator |
| `CORS_ORIGINS` | `localhost:5173`, `127.0.0.1:5173` | Extra allowed browser origins (CSV or JSON); `*` allows all |
| `CORS_ORIGIN_REGEX` | Netlify / Render / Railway / Fly / Vercel / Heroku / PythonAnywhere / e2b / localhost | Regex fallback so hosted frontends and preview URLs work |
| `VITE_API_BASE_URL` | unset → `/api` | **Build-time** frontend variable: public URL of the deployed API |
| `VITE_API_TARGET` | `http://127.0.0.1:8000` | Dev-server proxy target for `/api` |

`pydantic-settings` reads `.env` automatically. Use a PostgreSQL driver
(`pip install "psycopg[binary]"`) only if you switch `DATABASE_URL`.

---

## Implemented vs simulated

### Implemented (real code, runs on the demo dataset)

- SQLAlchemy schema for suppliers, canonical products, supplier listings, room
  configurations, rate plans, activity configurations, activity offers, match
  candidates, review decisions, audit events, client profiles, value assumptions.
- **Layer-1 matcher**: text normalization, fuzzy token-set similarity,
  haversine geo decay, address similarity, canonicalized amenity agreement,
  confidence blend, safety caps (distance, star gap, contradictions), banding.
- Blocking → pairwise matching pipeline; candidates are *computed at seed time*
  by the same code the API exposes, not hand-written.
- **Confidence-aware review**: approve / reject / keep separate, low-band
  approvals blocked at the service layer, append-only audit trail, group
  confirmation updates. All interactions persist.
- **Layer 2**: room equivalence classes and activity-configuration classes with
  explicit difference labels.
- **Layer 3 + effective price**: component-by-component price build-up, every
  adjustment tied to a named, editable assumption with a disclosed source.
- **Fit scoring**: four client profiles, adjustable weights, recommendation
  trace, "cheapest is not automatically best" explanation. Recommendation
  demonstrably changes with the profile.
- **Ranking**: transparent weighted model with adjustable weights, per-component
  score breakdown, reasons, confidence warnings, before/after view.
- **Sightseeing** parity: same three-layer treatment, transfers/access/duration
  preserved.
- **Content enrichment**: consolidated naming, alias normalization, verified vs
  supplier-only amenities, conflict and gap reporting, image attribution stance.
- **Analytics**: measurement definitions with every metric marked
  "Evaluation metric — results pending"; no fabricated results.
- Global search, source filter, notifications, settings, filters, sorting,
  loading/error/empty states, responsive desktop-first layout.

### Simulated (deliberately)

- **Dataset**: 30 synthetic listings / 12 canonical products across three
  fictional suppliers. Real-world city and attraction names only.
- **Confidence values**: outputs of a transparent heuristic, not a trained
  classifier. No calibration data exists.
- **Monetary assumptions**: breakfast value, non-refundable risk premium,
  prepayment cost, transfers value — all illustrative and editable.
- **Content completeness scores** per listing: illustrative values in the seed.
- **Auth, supplier ingestion, payments, live availability**: out of scope.
  Buttons that would touch them say so and do not pretend to work.
- **All dashboard/report figures**: demo data, labelled as such in the UI.

---

## Known limitations

1. **No trained model.** Confidence is a weighted heuristic over hand-picked
   features. Precision/recall/F1 are unknown; the Analytics screen defines how
   they would be measured, not what they are.
2. **Small, hand-authored dataset.** 12 canonical products is enough to
   demonstrate, not to validate. Blocking is coarse (city + anchor token) and
   would need a proper inverted index at scale.
3. **Layer-2 normalization is rule-based** (`deluxe_king` style classes). Real
   supplier room taxonomies need a maintained attribute dictionary and a
   review-backed taxonomy owner.
4. **Effective price is a model, not a market price.** It encodes assumptions an
   agency must own; the numbers move when the assumptions move.
5. **Fit scores are relative to the comparison set**, so they are not portable
   across different offer sets.
6. **Sightseeing layer-2 classes are hand-assigned** in the seed; automated
   activity classification is future work.
7. **SQLite by default.** The schema is PostgreSQL-compatible but only SQLite
   has been exercised here.
8. **No authentication or tenancy.** Any reviewer name is accepted; a real
   deployment needs SSO and role-based permissions on review actions.
9. **Images are placeholders.** No supplier photography is reproduced; licensed
   imagery with clear provenance would be required before shipping.
10. **No live supplier feed.** Ingestion is a documented adapter boundary, not an
    implementation.

---

## Where to look first

| If you want to see… | Open |
| --- | --- |
| The whole product story | `/` Overview |
| Three supplier listings for one hotel + the three layers | `/hotels/HG-1001` |
| Cheapest ≠ best, and profile-driven recommendation | `/compare?group=HG-1001` |
| Confidence-aware human review | `/matches` |
| Same attraction, different tour | `/compare?group=SG-2001` |
| Transparent ranking with adjustable weights | `/ranking` |
| Content normalization and conflict handling | `/enrichment` |
| Honest measurement plan (no fake results) | `/analytics` |

The judge walkthrough is in [`docs/demo-script.md`](docs/demo-script.md).

---

## Deploy it

The frontend and the API deploy separately. A frontend alone cannot work — the
React app needs a reachable FastAPI URL at **build** time.

```bash
# 1. Backend (Render blueprint included)
#    backend/render.yaml  →  https://<service>.onrender.com/api/health
# 2. Frontend
cd frontend
VITE_API_BASE_URL=https://<service>.onrender.com npm ci && npm run build
# 3. Upload dist/ to Netlify (or connect the repo; netlify.toml handles SPA routing)
```

Full instructions, verification commands and troubleshooting:
**[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)** — it also explains why the existing
Netlify deploy returns 404 on every view (no backend deployed yet) and the exact
env var + clear-cache redeploy that fixes it.

Three archives are produced for hand-over:

| Archive | Contents |
| --- | --- |
| `OfferLens-Netlify-Ready.zip` | built `dist/` only (`index.html`, `assets/`, `_redirects`, `robots.txt`) |
| `OfferLens-Backend-Ready.zip` | FastAPI app, requirements, `Procfile`, `Dockerfile`, `render.yaml`, `railway.json`, tests |
| `OfferLens-Complete-Updated.zip` | full project incl. docs, tests, configs and Git history |

---

## Exporting this workspace to GitHub

Everything in this folder is plain source — no build artefacts or dependencies
are required to commit it (`node_modules/`, `dist/`, `*.db`, `.env` are
git-ignored).

This folder is already a git repository with one commit on `main`, containing
136 tracked source files. `node_modules/`, `dist/`, `*.db` and `.env` are
ignored, so the commit is clean and portable.

```bash
cd offerlens
git remote add origin git@github.com:<your-account>/offerlens.git
git push -u origin main
```

A ready-to-download archive also sits beside this folder:
`../offerlens-github-ready.tar.gz` (source + git history, no `node_modules`,
no build output, no local database).

```bash
tar -xzf offerlens-github-ready.tar.gz && cd offerlens
npm --prefix frontend install && npm --prefix frontend run build
cd backend && pip install -r requirements.txt && uvicorn app.main:app --port 8000
```

## Licence

MIT — see [LICENSE](LICENSE). The demonstration dataset's provenance is
documented in [`data/README.md`](data/README.md).
