"""API contract smoke tests over the seeded demo database."""
from sqlalchemy import select

from app.models import MatchCandidate


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_overview_metrics_are_demo_labelled(client):
    payload = client.get("/api/overview").json()
    assert payload["metrics"]
    assert "DEMO DATA" in payload["data_notice"]
    assert payload["thresholds"]["high"] > payload["thresholds"]["medium"]
    assert payload["charts"]["confidence_bands"]


def test_hotel_inventory_and_detail(client):
    listing = client.get("/api/inventory/hotels").json()
    assert listing["total"] >= 5
    detail = client.get("/api/inventory/hotels/HG-1001").json()
    assert detail["summary"]["canonical_name"] == "The Grand Imperial, New Delhi"
    assert len(detail["listings"]) == 3
    assert detail["room_classes"]
    # Layer-1 evidence must be exposed for every pair inside the group.
    assert len(detail["identity_evidence"]) == 3


def test_unknown_group_returns_404(client):
    assert client.get("/api/inventory/hotels/HG-9999").status_code == 404


def test_compare_returns_effective_prices_and_assumptions(client):
    response = client.post("/api/offers/compare", json={"group_code": "HG-1001", "profile_key": "flexible"})
    payload = response.json()
    assert response.status_code == 200
    assert len(payload["offers"]) == 3
    cheapest_listed = min(payload["offers"], key=lambda offer: offer["listed_price"])
    assert payload["cheapest_trap_note"]
    assert cheapest_listed["effective"]["components"]
    assert all(assumption["source"] for assumption in payload["assumptions"])


def test_compare_supports_custom_weights(client):
    payload = client.post(
        "/api/offers/compare",
        json={"group_code": "HG-1001", "weights": {"price": 90, "meals": 10, "cancellation": 0,
                                                   "payment": 0, "convenience": 0}},
    ).json()
    assert round(sum(payload["weights"].values())) == 100


def test_ranking_weights_change_order(client):
    base = client.post("/api/ranking", json={"group_code": "HG-1001"}).json()
    assert [row["position"] for row in base["offers"]] == [1, 2, 3]
    price_led = client.post(
        "/api/ranking",
        json={"group_code": "HG-1001",
              "weights": {"effective_price": 90, "availability": 10, "content_completeness": 0,
                          "cancellation": 0, "match_confidence": 0}},
    ).json()
    assert price_led["offers"][0]["effective_price"] <= price_led["offers"][-1]["effective_price"]
    assert base["before"]["fragmented"] and base["after"]["offers"]


def test_low_confidence_pair_cannot_be_approved(client, db):
    low = db.scalar(select(MatchCandidate).where(MatchCandidate.band == "low"))
    response = client.post(f"/api/matches/{low.id}/decision", json={"decision": "approve"})
    assert response.status_code == 409


def test_medium_pair_can_be_approved_and_is_audited(client, db):
    candidate = db.scalar(
        select(MatchCandidate).where(MatchCandidate.band == "medium", MatchCandidate.status == "pending")
    )
    response = client.post(
        f"/api/matches/{candidate.id}/decision",
        json={"decision": "approve", "reviewer": "test.reviewer", "note": "Checked against supplier sheet"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "approved"
    assert payload["decisions"][0]["reviewer"] == "test.reviewer"
    # Reset so the seeded demo state stays intact for other tests.
    client.post(f"/api/matches/{candidate.id}/decision", json={"decision": "reset"})


def test_analytics_reports_no_measured_results(client):
    payload = client.get("/api/analytics").json()
    assert "results pending" in payload["notice"]
    assert all(metric["measured_value"] is None for metric in payload["metrics"])
    assert all(metric["status"] == "Evaluation metric — results pending." for metric in payload["metrics"])


def test_settings_update_roundtrip(client):
    updated = client.put("/api/settings", json={"default_profile": "budget"}).json()
    assert updated["workspace"]["default_profile"] == "budget"
    client.put("/api/settings", json={"default_profile": "flexible"})


def test_global_search(client):
    payload = client.get("/api/search", params={"q": "taj"}).json()
    assert payload["results"]
    assert all("href" in result for result in payload["results"])
