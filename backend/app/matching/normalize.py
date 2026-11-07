"""Text normalization helpers used by the blocking and similarity pipeline."""
import re
import unicodedata

# Words that carry no identity signal for hotels / attractions.
_STOPWORDS = {
    "the", "a", "an", "and", "&", "of", "at", "by", "hotel", "hotels", "resort",
    "resorts", "inn", "suites", "the", "p", "ltd", "private", "limited",
}

# Geographic qualifiers — useful context, but they should not make two
# representations of the same property look different.
_GEO_TOKENS = {
    "new", "delhi", "mumbai", "agra", "jaipur", "north", "south", "east", "west",
    "central", "old", "ncr", "gurugram", "gurgaon", "noida", "india", "near",
    "airport", "city", "centre", "center",
}

# Tour-format vocabulary. These words describe the *configuration* of a
# sightseeing product ("2-hour guided visit with transfers"), not its identity,
# so they are stripped when matching attraction names and compared later at
# layer 2 instead.
_ACTIVITY_FORMAT_TOKENS = {
    "guided", "guide", "tour", "tours", "visit", "experience", "with", "without",
    "transfers", "transfer", "skip", "line", "half", "full", "day", "walk",
    "walking", "heritage", "ticket", "tickets", "entry", "small", "group",
    "private", "express", "hrs", "hour", "hours", "no", "pickup", "pick",
    "up", "drop", "excursion", "sightseeing", "sight", "seeing",
}

_NON_ALNUM = re.compile(r"[^a-z0-9\s]")


def normalize_text(value: str | None) -> str:
    """Lowercase, strip accents and collapse whitespace."""
    if not value:
        return ""
    text = unicodedata.normalize("NFKD", value)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = _NON_ALNUM.sub(" ", text.lower())
    return re.sub(r"\s+", " ", text).strip()


def tokenize(value: str | None) -> list[str]:
    return [t for t in normalize_text(value).split(" ") if t]


def core_tokens(value: str | None, category: str = "hotel") -> list[str]:
    """Identity-bearing tokens.

    Drops stopwords and geographic qualifiers; for sightseeing listings it also
    drops tour-format vocabulary so "Taj Mahal Guided Visit with Transfers" and
    "Taj Mahal Tour (2 hrs, no transfers)" both reduce to the attraction anchor.
    """
    tokens = [t for t in tokenize(value) if t not in _STOPWORDS]
    core = [t for t in tokens if t not in _GEO_TOKENS]
    if category == "sightseeing":
        core = [t for t in core if t not in _ACTIVITY_FORMAT_TOKENS] or core
    return core or tokens


def normalize_city(value: str | None) -> str:
    return normalize_text(value)


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in metres between two coordinates."""
    from math import asin, cos, radians, sin, sqrt

    if None in (lat1, lon1, lat2, lon2):
        return float("inf")
    if lat1 == 0 and lon1 == 0 or lat2 == 0 and lon2 == 0:
        return float("inf")
    r = 6_371_000
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))
