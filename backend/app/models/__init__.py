"""ORM models. Imported here so metadata is complete for create_all()."""
from app.models.hotel import RatePlan, RoomConfig
from app.models.matching import AuditEvent, MatchCandidate, ReviewDecision
from app.models.preferences import AppSetting, ClientProfile, SavedRankingWeight, ValueAssumption
from app.models.product import ProductGroup, SupplierListing
from app.models.sightseeing import ActivityConfig, ActivityOffer
from app.models.supplier import Supplier

__all__ = [
    "ActivityConfig",
    "ActivityOffer",
    "AppSetting",
    "AuditEvent",
    "ClientProfile",
    "MatchCandidate",
    "ProductGroup",
    "RatePlan",
    "ReviewDecision",
    "RoomConfig",
    "SavedRankingWeight",
    "Supplier",
    "SupplierListing",
    "ValueAssumption",
]
