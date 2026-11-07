# `data/sample/` — TBO-provided sample data

This directory is intentionally empty.

It is the drop point for TBO sample supplier inventory if it becomes available.
Expected shape (one file per supplier, JSON or CSV):

| Field | Notes |
| --- | --- |
| `supplier_code` | e.g. `ATLAS` |
| `supplier_property_id` | Supplier's own ID — must be stored verbatim |
| `name`, `address`, `city`, `country` | Raw supplier content, unnormalized |
| `latitude`, `longitude` | WGS84; may be missing |
| `star_rating` | Supplier's own rating |
| `amenities` | Free-text list |
| `rooms[]` | room category, bed type, view, occupancy, size |
| `rate_plans[]` | price, meal plan, refundable flag, cancellation window, payment terms |
| `activities[]` | for sightseeing: duration, access, transfers, inclusions, price |

Ingestion contract: an adapter writes to the existing tables
(`suppliers`, `product_groups`, `supplier_listings`, `room_configs`,
`rate_plans`, `activity_configs`, `activity_offers`). No matching, pricing or UI
code needs to change.

Until such a file exists, every screen in OfferLens is driven by the synthetic
dataset in `../synthetic/`, and the UI labels it accordingly.
