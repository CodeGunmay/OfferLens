"""Amenity alias normalization.

Suppliers describe the same facility in different words ("Free WiFi" vs "WiFi",
"Gym" vs "Fitness centre"). Normalizing aliases before comparison is a
normalization-layer job, and it is why attribute agreement is meaningful at all.

The same map powers the Content Enrichment screen, so what the matcher compares
is exactly what the agent sees.
"""
from app.matching.normalize import normalize_text

AMENITY_ALIASES: dict[str, str] = {
    "wifi": "wifi",
    "free wifi": "wifi",
    "wi fi": "wifi",
    "internet": "wifi",
    "high speed internet": "wifi",
    "pool": "pool",
    "outdoor pool": "pool",
    "swimming pool": "pool",
    "indoor pool": "pool",
    "fitness centre": "fitness",
    "fitness center": "fitness",
    "gym": "fitness",
    "spa": "spa",
    "wellness": "spa",
    "restaurant": "restaurant",
    "rooftop restaurant": "restaurant",
    "dining": "restaurant",
    "bar": "bar",
    "lounge": "bar",
    "airport transfer": "airport_transfer",
    "airport shuttle": "airport_transfer",
    "business centre": "business_centre",
    "business center": "business_centre",
    "room service": "room_service",
    "parking": "parking",
    "valet parking": "parking",
    "free parking": "parking",
    "concierge": "concierge",
    "laundry": "laundry",
    "air conditioning": "air_conditioning",
    "ac": "air_conditioning",
    "travel desk": "travel_desk",
    "garden": "garden",
    "sea view": "sea_view",
    "english guide": "guide",
    "licensed guide": "guide",
    "monument entry": "monument_entry",
    "monument entry ticket": "monument_entry",
    "hotel transfers": "transfers",
    "skip the line entry": "skip_the_line",
    "skip the line": "skip_the_line",
    "breakfast": "breakfast",
    "walking tour": "walking_tour",
}

CANONICAL_LABELS: dict[str, str] = {
    "wifi": "WiFi",
    "pool": "Swimming pool",
    "fitness": "Fitness centre",
    "spa": "Spa",
    "restaurant": "Restaurant",
    "bar": "Bar",
    "airport_transfer": "Airport transfer",
    "business_centre": "Business centre",
    "room_service": "Room service",
    "parking": "Parking",
    "concierge": "Concierge",
    "laundry": "Laundry",
    "air_conditioning": "Air conditioning",
    "travel_desk": "Travel desk",
    "garden": "Garden",
    "sea_view": "Sea view",
    "guide": "Licensed guide",
    "monument_entry": "Monument entry",
    "transfers": "Hotel transfers",
    "skip_the_line": "Skip-the-line entry",
    "breakfast": "Breakfast",
    "walking_tour": "Guided walking tour",
}


def canonicalize(amenity: str) -> str:
    key = normalize_text(amenity)
    if key in AMENITY_ALIASES:
        return AMENITY_ALIASES[key]
    return key.replace(" ", "_")


def canonical_set(amenities: list[str] | None) -> set[str]:
    return {canonicalize(item) for item in (amenities or []) if item}


def label_for(key: str) -> str:
    return CANONICAL_LABELS.get(key, key.replace("_", " ").title())


def normalized_amenities(amenities: list[str] | None) -> list[dict[str, str]]:
    """Original -> canonical mapping, used by the enrichment screen."""
    return [
        {"original": item, "canonical": canonicalize(item), "label": label_for(canonicalize(item))}
        for item in (amenities or [])
    ]
