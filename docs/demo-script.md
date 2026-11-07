# Demo script (10 steps, ~6 minutes)

Designed to be understandable to a non-technical judge and to land one idea:
**OfferLens is an inventory intelligence layer, not a matching algorithm with a
UI bolted on.**

Before you start: `uvicorn app.main:app --port 8000` and open
`http://localhost:8000`. Everything below runs on synthetic demo data — say so
once, early, and then let the product speak.

---

### Step 1 — Overview (30s)
**Screen:** `/`

Say: *"Three fictional suppliers, 30 listings, 12 products — and already 12 groups
that are the same product listed more than once. The queue on the right is what an
ops team would work through."*

Point at: the KPI row, the confidence distribution, the pending-review count, and
the amber *"All metrics are demo data"* tag. Honesty first builds trust with a
judge.

---

### Step 2 — Hotel inventory (40s)
**Screen:** `/hotels` → expand *The Grand Imperial, New Delhi*

Say: *"One hotel, three supplier representations: 'Grand Imperial Hotel Delhi',
'The Grand Imperial New Delhi', 'Grand Imperial, Central Delhi'. Different names,
different supplier IDs, different addresses — same building."*

Show the expanded row: supplier IDs, coordinates, star ratings, confidence per
listing, mapping status.

---

### Step 3 — The three layers (60s)
**Screen:** `/hotels/HG-1001`

Say: *"This is the core of the product. Matching a hotel is only the first layer."*

- **Layer 1 — property identity.** Scroll the evidence panels: name similarity,
  85 m apart, address similarity, attribute agreement — with the weighted
  contributions visible. Then the agreement table: star rating agrees, amenities
  partially agree, addresses differ in wording.
- **Layer 2 — room configuration.** Two room classes; the Deluxe King maps across
  all three suppliers, but "Max occupancy differs (2–3 guests)".
- **Layer 3 — rate plan.** The three Deluxe King rate plans differ on meals,
  cancellation and payment.

Close with the line the product is built on: *"Same property does not mean same
room. Same room does not mean same rate plan."*

---

### Step 4 — Confidence-aware review (45s)
**Screen:** `/matches`

Say: *"Nothing merges silently."*

- Filter to **Low**: those pairs are the hard negatives — a Paharganj guest house
  called "Grand Imperial Guest House", 2 km away and 3-star. Point at the disabled
  Approve button: *"The API refuses this too, not just the UI."*
- Filter to **Medium**: pick the ITC Mughal pair, click **Inspect**. Show the
  conflict ("Star rating differs (5★ vs 4★)"), the missing attributes, and the
  safety cap that kept it out of the auto-suggest band.
- Approve it (or keep separate). Show the toast and the audit-trail line that
  appears. Refresh: it persists.

---

### Step 5 — Cheapest is not best (60s)
**Screen:** `/compare?group=HG-1001` (Deluxe King, *Flexible Traveller*)

Say: *"Meridian is ₹4,500 and looks like the winner. OfferLens disagrees."*

- Read the comparison table row by row.
- Open the **Effective-price build-up** for Meridian: ₹4,500 + ₹450 breakfast gap
  + ₹270 non-refundable risk + ₹68 prepayment cost = **₹5,288**.
- Point at the assumption chips and their source label: *"Every rupee we add is
  named, editable, and marked as an illustrative assumption — we are not
  pretending to know market rates."*
- Show the difference card (identical / different / included / excluded) and the
  "Cheapest is not automatically best" panel.

---

### Step 6 — Change the client profile (40s)
**Screen:** same page

Click **Budget Traveller**: Atlas moves to the top (₹5,175 effective, breakfast
included). Click **Flexible Traveller**: Horizon takes over because it is free to
cancel until 48h and payable at the hotel. A toast states the recommendation
changed.

Say: *"Same three offers, same effective prices — different client, different
recommendation. And the agent can open Customize Preferences and set the weights
themselves."*

Open the weights modal, move a slider, apply. The recommendation recalculates.

---

### Step 7 — Sightseeing preserves the differences (45s)
**Screen:** `/sightseeing` → `/compare?group=SG-2001`

Say: *"Tours break naive matching: 'Taj Mahal guided visit' is four different
products."*

- Show the three tour variants: 4h guided with transfers + breakfast; 2h express,
  no transfers, non-refundable; 3h skip-the-line small group, partial
  cancellation.
- Note that identity matched at the *attraction* level while duration, access,
  transfers and inclusions stayed separate.
- Point at the effective price adding ₹600 transfers + ₹250 meals for the express
  offer.

---

### Step 8 — Ranking intelligence (40s)
**Screen:** `/ranking`

Say: *"Once you have a consolidated product, you can rank the offers inside it —
transparently."*

- Expand a row: component weights, component scores and the points each
  contributed.
- Change a weight: the order moves.
- Show **before / after**: three fragmented listings versus one product with three
  ranked, comparable offers.
- Say explicitly: *"No popularity signal — we have no booking data, and inventing
  one would be worse than leaving it out. We claim no conversion lift."*

---

### Step 9 — Content enrichment (30s)
**Screen:** `/enrichment`

Show: three supplier names collapsing into one consolidated name, amenity aliases
mapped (`Free WiFi` → `WiFi`), verified versus supplier-only amenities, conflicts,
and the placeholder image with *"Illustrative image — source verification
required"*.

Say: *"No supplier photography, no unlicensed assets — attribution is a product
requirement, not an afterthought."*

---

### Step 10 — Close on the overview + honesty (30s)
**Screen:** `/` then `/analytics`

Say: *"The last thing worth showing is what we have not claimed."*

On Analytics: every metric is marked *"Evaluation metric — results pending"*,
alongside the labelled sample, the calibration plan and the shade-review path.
Close on the overview:

> *"This is not just a matching algorithm. It is an inventory intelligence layer:
> it resolves supplier fragmentation, keeps commercial differences intact, prices
> them honestly, and puts a human in the loop exactly where the evidence is weak."*

---

## Q&A prep

| Likely question | Answer |
| --- | --- |
| "How accurate is the matching?" | Unknown and deliberately not claimed. The heuristic is transparent; precision/recall need a labelled set — the plan is on the Analytics screen. |
| "Why not an LLM / embeddings?" | An agent-facing recommendation must be reproducible and auditable. Every score here is arithmetic you can check. An embedding model could *add* features later, but it would not replace the banding + review contract. |
| "What about scale?" | Matching is an offline batch job; request paths read precomputed groups. Blocking keeps pair counts sane. Postgres is the target store. |
| "Where does the money assumption come from?" | Nowhere verifiable — that is why it is editable, labelled, and shown next to every derived number. The agency owns those values, not us. |
| "Is this real TBO data or a TBO product?" | No. Synthetic dataset, independent prototype, no TBO branding or endorsement. |
| "What would you build next?" | A calibrated classifier on a hand-labelled sample, a maintained room/activity taxonomy, and ingestion adapters with drift alerts. |

## Failure modes to avoid on stage

- Do not claim conversion or revenue improvement.
- Do not call the confidence a "model accuracy".
- Do not merge the three Taj Mahal offers into "one tour" — the whole point is that
  they stay distinct.
- If the API is not running, pages show an explicit error state rather than
  fabricated content; mention that instead of clicking around.
