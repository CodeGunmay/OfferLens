# OfferLens — Deployment Guide

This document tells you exactly what to upload, where the backend goes, and how to
connect the two so the deployed site stops returning **404** on every data view.

> **Current state (read this first)**
> The frontend you deployed to Netlify (`profound-cocada-8a5e7b.netlify.app`) loads its
> React shell, but **no backend is deployed**, so every call to `/api/...` 404s.
> A frontend deployment alone can never fix that: **OfferLens needs a hosted FastAPI
> process.** Follow Part 1, then Part 2.

---

## 0. Why the 404s happened

| Symptom | Cause | Fixed in this build by |
| --- | --- | --- |
| "Could not load this view — Request failed (404)" on every page | The app called `/api/...` on the **Netlify origin**, where no API exists | `VITE_API_BASE_URL` is now read at build time; `resolveApiBase()` normalises it and `ApiError` explains a missing API base |
| Refreshing a deep link (e.g. `/compare?group=HG-1001`) 404s | No SPA rewrite | `netlify.toml` redirect `/* → /index.html` **and** `public/_redirects` (works for drag-and-drop too) |
| CORS errors after pointing at a real API | Backend only allowed `localhost` | `CORS_ORIGINS` / `CORS_ORIGIN_REGEX` — Netlify, Render, Railway, Fly, Vercel, Heroku, PythonAnywhere and e2b hosts are allowed by default |
| Empty database on a fresh host | DB file was never created | Startup lifespan seeds the synthetic dataset automatically if the DB is empty (`AUTO_SEED=true`) |

---

## 1. Deploy the backend (required)

Any Python 3.11+ host works. Three ready-made options are in `backend/`.

### Option A — Render (recommended, free tier)

1. Push this repository to GitHub (the ZIP keeps `.git`, or create a fresh repo and push).
2. Render → **New → Blueprint** → select the repo. Render reads `backend/render.yaml`.
   Manual alternative: **New → Web Service**, root directory `backend`, then
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Wait for the first deploy, then open:

   ```
   https://<your-service>.onrender.com/api/health
   ```

   Expected JSON — verified against this build running locally:

   ```json
   {"status":"ok","service":"OfferLens API","environment":"DEMO WORKSPACE",
    "database":"sqlite","database_ok":true,"listings":30,"product_groups":12,"pending_reviews":11}
   ```

   `database_ok:false` (with `status:"degraded"` and a `database_error`) means the API is
   up but cannot reach its database — check `DATABASE_URL` and the seed on first boot.

4. Copy the base URL — for example `https://offerlens-api.onrender.com`.
   **Do not append `/api`** — the frontend normalises either form.

> Free tiers sleep after ~15 minutes idle. The first request after a sleep can take
> 30–50 s; the UI shows an "API offline" pill and a retry button, then recovers.

### Option B — Railway

`backend/railway.json` is included. New Project → Deploy from repo → root directory
`backend`. Railway injects `$PORT`; the start command is already set.

### Option C — Docker / any VM

```bash
cd backend
docker build -t offerlens-api .
docker run -p 8000:8000 -e CORS_ORIGINS="*" offerlens-api
```

`Procfile` + `runtime.txt` are included for Heroku-style hosts; `python3 -m uvicorn
app.main:app --host 0.0.0.0 --port 8000` works anywhere.

### Optional: Postgres instead of SQLite

Free hosts rebuild the filesystem, so the SQLite file resets on redeploy (the dataset
reseeds automatically, which is fine for a demo). For persistence set:

```
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname
```

`psycopg[binary]` is already in `requirements.txt`.

### Relevant environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `CORS_ORIGINS` | empty | Comma-separated or JSON list of exact origins, e.g. `https://profound-cocada-8a5e7b.netlify.app`. `*` allows everything. |
| `CORS_ORIGIN_REGEX` | Netlify/Render/Railway/Fly/Vercel/Heroku/PythonAnywhere/e2b/localhost | Regex fallback so preview and deploy-preview URLs work. |
| `DATABASE_URL` | `sqlite:///./offerlens.db` | Any SQLAlchemy URL. |
| `SEED_ON_STARTUP` | `true` | Seed the synthetic dataset on boot when it is missing (idempotent). |

---

## 2. Point the Netlify site at the backend

Two ways — pick one.

### 2A. Environment variable (simplest)

1. Netlify → your site → **Site configuration → Environment variables → Add a variable**
   - Key: `VITE_API_BASE_URL`
   - Value: `https://offerlens-api.onrender.com` (your API base, no `/api`)
2. **Deploys → Trigger deploy → Clear cache and deploy site.** Vite inlines env values
   at build time, so a rebuild is mandatory — adding the variable alone changes nothing.
3. Open the site. The top bar should show a green **API live** pill; tooltip shows the
   base URL actually used.

### 2B. Same-origin proxy (no CORS, no env var)

Edit `frontend/netlify.toml`, uncomment the `/api/*` redirect, replace the host, then
rebuild **without** `VITE_API_BASE_URL`. The app calls `/api/...` on its own origin and
Netlify forwards to FastAPI.

### 2C. Drag-and-drop (no Git connection)

Upload `OfferLens-Netlify-Ready.zip` — but note this archive is a **pre-built**
bundle. It was built **without** an API base, so it must be combined with the proxy
option, or rebuilt:

```bash
cd frontend
VITE_API_BASE_URL=https://offerlens-api.onrender.com npm ci && npm run build
# then drag the contents of dist/ into Netlify → Deploys → "Drag and drop"
```

---

## 3. Verify it actually works

```bash
API=https://offerlens-api.onrender.com

curl -s $API/api/health                     # {"status":"ok", ...}
curl -s $API/api/overview | head -c 300     # KPI payload + price_insight + queue_preview
curl -s -X POST $API/api/offers/compare \
  -H 'Content-Type: application/json' \
  -d '{"group_code":"HG-1001","profile_key":"flexible"}' | head -c 300
```

Then in the browser:

| Check | Expected |
| --- | --- |
| Top-bar pill | green **API live**, tooltip shows the API base |
| Overview | 4 KPI tiles, price insight card with 3 offer bars, review queue |
| Hotel inventory | 7 canonical properties, expandable supplier listings |
| Compare (The Grand Imperial) | 3 supplier cards; Horizon recommended at ₹5,200 effective; Meridian listed ₹4,500 → ₹5,288 |
| Profile switch to Budget | recommendation flips to **Atlas** |
| Match Review | 11 pending; low-confidence rows show **Cannot approve** |
| Refresh any deep link | page still loads (no 404) |
| Browser console | no `404`/`CORS` errors |

---

## 4. The three archives

| Archive | Contents | Use it when |
| --- | --- | --- |
| `OfferLens-Netlify-Ready.zip` | `frontend/dist` exactly: `index.html`, `assets/`, `_redirects`, `robots.txt` | You want the built SPA only. Set `VITE_API_BASE_URL` **before** building, or use the proxy. |
| `OfferLens-Backend-Ready.zip` | `backend/`: FastAPI app, `requirements.txt`, `Procfile`, `runtime.txt`, `Dockerfile`, `render.yaml`, `railway.json`, tests, seed scripts (no DB file — it seeds on first boot) | Any Python host (Render / Railway / Docker / VM). |
| `OfferLens-Complete-Updated.zip` | Whole project: frontend source, backend source, `data/`, `docs/`, tests, Netlify + host configs, Git history | Source-level hand-over, or a single-service deploy where FastAPI serves the built SPA. |

### Single-origin option (one process, no CORS)

```bash
cd frontend && npm ci && npm run build          # no VITE_API_BASE_URL
cd ../backend && pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
# open http://localhost:8000  ->  API + UI on the same origin
```

`app/main.py` mounts `frontend/dist` at `/assets`, serves `index.html` for SPA routes
and exposes the API under `/api`. Render/Railway can run this single service too
(build: `cd frontend && npm ci && npm run build`, start: the uvicorn command above).

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Every page says "Request failed (404)" | No backend URL baked into the build | Set `VITE_API_BASE_URL`, **clear cache and redeploy** |
| Requests go to `https://<site>.netlify.app/api/...` | `VITE_API_BASE_URL` missing | Same as above, or enable the `/api/*` proxy |
| "Failed to fetch" / CORS in console | Origin not allowed | Add `CORS_ORIGINS=https://<site>.netlify.app` (or `*`) on the backend and restart |
| API responds but pages are empty | DB empty and seeding skipped | Set `AUTO_SEED=true`, delete the SQLite file, restart |
| Deep link 404 on refresh | `_redirects` missing | Ensure `frontend/public/_redirects` shipped in `dist` (it is in this build) |
| First load after idle is slow | Free host cold start | Wait ~40 s; the UI shows an offline pill then recovers |
| `python-docx`/wheels fail to build | Wrong Python version | Use Python 3.11 or 3.12 (`runtime.txt` pins 3.11.9) |

---

## 6. Is the deployed site fully functional?

- **Code and configuration:** yes — SPA routing, API base resolution, CORS, DB
  auto-seeding and host configs are all in this build.
- **The live Netlify site:** **not yet**, because it still has no backend URL. After
  Part 1 (deploy FastAPI) and Part 2 (set `VITE_API_BASE_URL` + clear-cache deploy),
  every page works: 11 routes, hotel/sightseeing inventories, three-layer comparison,
  effective-price recommendation, ranking, match review, enrichment, analytics and
  settings.
