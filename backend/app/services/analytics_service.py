"""Measurement plan.

This module deliberately contains NO measured results. It defines the metrics the
proposed system will be evaluated on, how each one is computed, and what data it
requires. Where a chart is shown it is an explicitly labelled sample scenario.
"""
from typing import Any

EVALUATION_NOTE = "Evaluation metric — results pending."

METRICS = [
    {
        "key": "match_precision",
        "label": "Match precision",
        "definition": "Of the pairs the system merged, the share that a human label agrees are the same property.",
        "method": "Hand-labelled validation set + sampled audit of production merges.",
        "target": "≥ 0.95 (proposed acceptance bar, not a measured result)",
        "group": "Identity matching",
    },
    {
        "key": "match_recall",
        "label": "Match recall",
        "definition": "Of the true duplicate pairs in the labelled sample, the share the blocking + matcher found.",
        "method": "Full pairwise review of the labelled sample.",
        "target": "≥ 0.85 (proposed acceptance bar)",
        "group": "Identity matching",
    },
    {
        "key": "f1",
        "label": "F1 score",
        "definition": "Harmonic mean of precision and recall on the labelled sample.",
        "method": "Derived from the two metrics above.",
        "target": "Reported, not targeted",
        "group": "Identity matching",
    },
    {
        "key": "false_merge_rate",
        "label": "False-merge rate",
        "definition": "Share of merged groups that contain a listing belonging to a different property.",
        "method": "Manual audit of every auto-merged group.",
        "target": "≤ 1% (hard safety bar)",
        "group": "Identity matching",
    },
    {
        "key": "cluster_accuracy",
        "label": "Cluster-level accuracy",
        "definition": "Share of product groups whose exact member set matches the ground-truth grouping.",
        "method": "Exact-match cluster comparison on the labelled sample.",
        "target": "Reported per supplier",
        "group": "Identity matching",
    },
    {
        "key": "confidence_calibration",
        "label": "Confidence calibration",
        "definition": "Agreement between predicted confidence bands and observed accuracy.",
        "method": "Reliability diagram + expected calibration error.",
        "target": "ECE ≤ 0.05",
        "group": "Confidence model",
    },
    {
        "key": "human_review_share",
        "label": "Human-review share",
        "definition": "Share of candidate pairs that fall in the medium/low bands and need a person.",
        "method": "Counted from review queue telemetry.",
        "target": "Operational efficiency measure",
        "group": "Confidence model",
    },
    {
        "key": "room_equivalence_accuracy",
        "label": "Room-equivalence accuracy",
        "definition": "Share of layer-2 room groupings that a human agrees are comparable.",
        "method": "Stratified sample of room classes per city.",
        "target": "≥ 0.90",
        "group": "Offer intelligence",
    },
    {
        "key": "rate_plan_accuracy",
        "label": "Rate-plan classification accuracy",
        "definition": "Share of rate plans whose meal / cancellation / payment attributes were extracted correctly.",
        "method": "Field-level comparison against supplier contract sheets.",
        "target": "≥ 0.95 on meal and cancellation fields",
        "group": "Offer intelligence",
    },
    {
        "key": "content_completeness",
        "label": "Content completeness",
        "definition": "Average share of required attributes present after normalization.",
        "method": "Attribute coverage audit per supplier feed.",
        "target": "≥ 0.90",
        "group": "Content",
    },
]

SAMPLE_SCENARIOS = [
    {
        "key": "calibration_sample",
        "title": "Calibration — sample scenario",
        "note": "Illustrative shape only. These are not measured outputs of a trained model.",
        "series": [
            {"band": "0.5–0.6", "predicted": 0.55, "observed": 0.52},
            {"band": "0.6–0.7", "predicted": 0.65, "observed": 0.63},
            {"band": "0.7–0.8", "predicted": 0.75, "observed": 0.74},
            {"band": "0.8–0.9", "predicted": 0.85, "observed": 0.83},
            {"band": "0.9–1.0", "predicted": 0.95, "observed": 0.94},
        ],
    },
    {
        "key": "review_mix_sample",
        "title": "Review queue mix — sample scenario",
        "note": "Illustrative target split of a future production queue.",
        "series": [
            {"band": "High", "share": 62},
            {"band": "Medium", "share": 29},
            {"band": "Low", "share": 9},
        ],
    },
]


def analytics_payload(db=None) -> dict[str, Any]:
    return {
        "notice": EVALUATION_NOTE,
        "summary": (
            "No model has been trained or validated in this prototype. The metrics below define "
            "how the proposed system would be measured once labelled data is available."
        ),
        "metrics": [{**metric, "status": EVALUATION_NOTE, "measured_value": None} for metric in METRICS],
        "sample_scenarios": SAMPLE_SCENARIOS,
        "data_requirements": [
            "TBO-provided sample supplier inventory (preferred), or",
            "OpenStreetMap-derived property records with attribution, plus",
            "manually hand-labelled duplicate / non-duplicate pairs for validation",
            "Hard negatives: nearby properties with similar names",
        ],
        "measurement_plan": [
            {"step": 1, "title": "Build labelled sample", "detail": "200–300 hand-labelled pairs across 3 cities, balanced by band."},
            {"step": 2, "title": "Freeze thresholds", "detail": "Calibrate high/medium bands on the sample, not on the demo data."},
            {"step": 3, "title": "Offline evaluation", "detail": "Precision, recall, F1, cluster accuracy, calibration error."},
            {"step": 4, "title": "Shadow review", "detail": "Run matching without auto-merging; compare against reviewer decisions."},
            {"step": 5, "title": "Pilot", "detail": "Enable auto-suggestion in one city; keep human approval in the loop."},
        ],
    }
