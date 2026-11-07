"""Pydantic request bodies. Responses are plain JSON dicts documented in docs/api-contracts.md."""
from typing import Literal

from pydantic import BaseModel, Field, field_validator

PROFILE_KEYS = ("price", "meals", "cancellation", "payment", "convenience")
RANKING_KEYS = ("effective_price", "availability", "content_completeness", "cancellation", "match_confidence")


class CompareRequest(BaseModel):
    group_code: str = Field(..., min_length=3, max_length=24)
    category: Literal["hotel", "sightseeing"] | None = None
    equivalence_class: str | None = None
    profile_key: str | None = None
    weights: dict[str, float] | None = None
    assumptions: dict[str, float] | None = None


class RankingRequest(BaseModel):
    group_code: str = Field(..., min_length=3, max_length=24)
    weights: dict[str, float] | None = None
    equivalence_class: str | None = None


class DecisionRequest(BaseModel):
    decision: Literal["approve", "reject", "separate", "reset"]
    reviewer: str = Field(default="Demo reviewer", max_length=80)
    note: str = Field(default="", max_length=240)


class ProfileUpdateRequest(BaseModel):
    weights: dict[str, float]

    @field_validator("weights")
    @classmethod
    def check_weights(cls, value: dict[str, float]) -> dict[str, float]:
        unknown = set(value) - set(PROFILE_KEYS)
        if unknown:
            raise ValueError(f"Unknown weight keys: {', '.join(sorted(unknown))}")
        if any(weight < 0 for weight in value.values()):
            raise ValueError("Weights must be non-negative")
        if not value or sum(value.values()) <= 0:
            raise ValueError("At least one weight must be greater than zero")
        return value


class AssumptionUpdateRequest(BaseModel):
    value: float = Field(..., ge=0, le=1_000_000)


class SettingsUpdateRequest(BaseModel):
    auto_match_threshold: float | None = Field(default=None, ge=0.5, le=0.99)
    review_threshold: float | None = Field(default=None, ge=0.4, le=0.98)
    default_profile: str | None = None
    show_demo_badges: bool | None = None
