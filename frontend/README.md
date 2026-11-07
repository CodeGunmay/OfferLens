# OfferLens frontend

React 18 + TypeScript + Vite + Tailwind + Recharts + Lucide.

## Scripts

```bash
npm install
npm run dev        # http://localhost:5173 — proxies /api to http://127.0.0.1:8000
npm run build      # type-check + production build into dist/
npm run typecheck  # strict TypeScript, no emit
npm run preview    # serve the production build
```

The dev server binds `0.0.0.0` and proxies `/api`, so the browser only ever
issues same-origin requests. Set `VITE_API_TARGET` to change the proxy target or
`VITE_API_BASE` to call another host directly.

## Structure

```
src/
├── components/
│   ├── layout/    TopBar · Sidebar · BrandMark · ToastStack
│   ├── ui/        Card · Button · Badge · StatCard · Tabs · Modal ·
│   │              Meter · WeightEditor · PageHeader · States · InfoTip
│   └── domain/   ThreeLayerExplainer · IdentityEvidencePanel · AgreementTable ·
│                  RoomClassPanel · ActivityClassPanel · OfferComparisonTable ·
│                  EffectivePricePanel · DifferenceCardPanel · ProfileSelector ·
│                  RankingTable · MatchReviewModal · LayerStrip · EvidenceBar
├── context/       WorkspaceContext (source filter, toasts, review count)
├── hooks/         useApi · useDebounced
├── layouts/       AppLayout
├── pages/         Overview · HotelInventory · HotelDetail · SightseeingInventory ·
│                  SightseeingDetail · MatchReview · OfferComparison ·
│                  RankingIntelligence · ContentEnrichment · Analytics · Settings
├── services/      api.ts (typed client, single place that talks to the API)
├── types/         Shared response types
└── utils/         format.ts · confidence.ts
```

Design rules used throughout:

- Data fetching lives in pages via `useApi`; components receive props only.
- Business logic (pricing, matching, ranking) is **never** duplicated in the
  frontend — it comes from the API.
- Any number derived from a demo assumption is displayed next to its source.
- Every async view has an explicit loading, error and empty state.
- TypeScript is strict (`noUnusedLocals`, `noUnusedParameters`).

Design tokens (Tailwind): navy `#0F2A44`, deep navy `#102F4F`, teal `#16B8A6`,
canvas `#F5F8FB`, muted `#64748B`, line `#E2E8F0`. Cards are 1px-bordered with a
restrained shadow; motion is limited to 150–200 ms opacity/position transitions.
