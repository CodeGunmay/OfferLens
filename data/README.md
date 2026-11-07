# Data

## Provenance rules

1. **Priority 1 — TBO-provided sample inventory.** If TBO supplies sample
   supplier data, it replaces everything in `synthetic/`. Nothing in this
   repository should ever be described as TBO data unless it came from that
   source.
2. **Fallback (what this prototype uses).** A synthetic dataset built in
   `backend/app/database/demo_data/`:
   - fictional suppliers: **Atlas, Meridian, Horizon**;
   - fictional supplier property IDs, prices and rate plans;
   - real-world anchors for legibility: city names and attraction names
     (Taj Mahal, India Gate, Qutub Minar, Amber Fort, Agra Fort), with
     approximate coordinates used only to exercise geo-blocking;
   - deliberate **hard negatives**: nearby properties with similar names
     (`Grand Imperial Guest House`, `Grand Imperial Residency Suites`) that the
     matcher must *not* merge.
3. **Landmark photography** is not included. The UI shows neutral placeholders
   labelled *"Illustrative image — source verification required"*.

## Layout

```
data/
├── sample/      Placeholder for TBO-provided sample data (see sample/README.md)
├── synthetic/   The demo dataset exported from the seed, with provenance notes
└── README.md
```

`synthetic/offerlens_demo_dataset.json` is generated — do not hand-edit it:

```bash
cd backend
python -m scripts.export_demo_data
```

## Licence and attribution

The synthetic records are released with the repository under the MIT licence.
If OpenStreetMap data is substituted later, ODbL attribution and share-alike
obligations apply and must be shown in the UI (the Content Enrichment screen
already displays a source/attribution row).

## What must never happen

- Presenting synthetic listings as real TBO inventory.
- Presenting confidence values as validated model accuracy.
- Publishing fabricated precision / recall / conversion numbers.
