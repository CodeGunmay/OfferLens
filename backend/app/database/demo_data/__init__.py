"""Demo dataset package.

All supplier-style records in this package are synthetic demonstration data.
See the module docstrings in hotels.py / sightseeing.py for provenance notes.
"""
from app.database.demo_data.hotels import HOTEL_GROUPS, STANDALONE_LISTINGS
from app.database.demo_data.sightseeing import SIGHTSEEING_GROUPS

SUPPLIERS = [
    {"code": "ATLAS", "name": "Supplier Atlas", "tier": "Direct connect", "accent": "#16B8A6"},
    {"code": "MERIDIAN", "name": "Supplier Meridian", "tier": "Aggregator", "accent": "#3B82F6"},
    {"code": "HORIZON", "name": "Supplier Horizon", "tier": "Channel manager", "accent": "#8B5CF6"},
]

AUDIT_EVENTS = [
    {
        "kind": "match_run",
        "actor": "Matching batch job",
        "title": "Nightly property blocking + pairwise match run completed",
        "detail": "16 hotel listings · 12 blocked pairs · 7 suggested property groups",
        "category": "hotel",
        "minutes_ago": 42,
    },
    {
        "kind": "review",
        "actor": "ops.ananya",
        "title": "Approved match — Taj Palace, New Delhi",
        "detail": "Horizon listing confirmed against the Atlas canonical property",
        "category": "hotel",
        "minutes_ago": 96,
    },
    {
        "kind": "review",
        "actor": "ops.rahul",
        "title": "Kept listings separate — Grand Imperial Guest House",
        "detail": "Different star class and 1.9 km away; not the same property",
        "category": "hotel",
        "minutes_ago": 140,
    },
    {
        "kind": "enrichment",
        "actor": "Content pipeline",
        "title": "Amenity aliases normalized for 6 listings",
        "detail": "WiFi / Pool / Gym aliases mapped to the canonical amenity set",
        "category": "hotel",
        "minutes_ago": 188,
    },
    {
        "kind": "match_run",
        "actor": "Matching batch job",
        "title": "Sightseeing activity blocking run completed",
        "detail": "12 sightseeing listings · 8 blocked pairs · 5 suggested activity groups",
        "category": "sightseeing",
        "minutes_ago": 240,
    },
    {
        "kind": "review",
        "actor": "ops.meera",
        "title": "Requested content check — Taj Mahal Express Tour",
        "detail": "Supplier description does not state whether monument entry is included",
        "category": "sightseeing",
        "minutes_ago": 310,
    },
    {
        "kind": "review",
        "actor": "ops.ananya",
        "title": "Approved match — The Oberoi, Mumbai",
        "detail": "Meridian listing confirmed against the Atlas canonical property",
        "category": "hotel",
        "minutes_ago": 365,
    },
]

__all__ = ["AUDIT_EVENTS", "HOTEL_GROUPS", "SIGHTSEEING_GROUPS", "STANDALONE_LISTINGS", "SUPPLIERS"]
