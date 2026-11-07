import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { useState } from "react";
import type { MatchRow } from "../../types";
import { confidence, inr, relativeTime } from "../../utils/format";
import { BandBadge, StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { EvidenceBar } from "./EvidenceBar";

export function MatchReviewModal({
  candidate,
  onClose,
  onDecide,
  busy,
}: {
  candidate: MatchRow | null;
  onClose: () => void;
  onDecide: (decision: "approve" | "reject" | "separate" | "reset", note: string) => Promise<void>;
  busy: boolean;
}) {
  const [note, setNote] = useState("");
  if (!candidate) return null;

  const evidence = candidate.evidence;
  const canApprove = candidate.band !== "low";

  return (
    <Modal
      open={Boolean(candidate)}
      onClose={onClose}
      title="Match review"
      subtitle={`Candidate #${candidate.id} · ${candidate.category === "hotel" ? "Hotel inventory" : "Sightseeing inventory"}`}
      width="max-w-4xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={() => onDecide("separate", note)}
            disabled={busy || candidate.status === "separate"}
          >
            Keep separate
          </Button>
          <Button variant="secondary" onClick={() => onDecide("reject", note)} disabled={busy || candidate.status === "rejected"}>
            Reject match
          </Button>
          <Button
            variant="accent"
            onClick={() => onDecide("approve", note)}
            disabled={busy || !canApprove || candidate.status === "approved"}
            title={canApprove ? undefined : "Low-confidence pairs cannot be approved"}
          >
            Approve match
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <BandBadge band={candidate.band} />
          <StatusBadge status={candidate.status} />
          <span className="chip num">Confidence {confidence(candidate.confidence)}</span>
          {candidate.auto_suggestable ? <span className="chip">Auto-suggest eligible</span> : null}
          <span className="text-[11px] text-subtle">Created {relativeTime(candidate.created_at)}</span>
        </div>

        <p className="rounded-lg border border-line bg-[#F8FAFC] px-3 py-2 text-[12px] leading-5 text-ink/80">
          {candidate.guidance} {candidate.summary}
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {[candidate.listing_a, candidate.listing_b].map((listing, index) => (
            <div key={listing?.id ?? index} className="rounded-xl border border-line bg-white p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Listing {index === 0 ? "A" : "B"}
                </span>
                <span className="text-[11.5px] font-medium text-ink">{listing?.supplier_name}</span>
              </div>
              <p className="mt-1.5 text-[13px] font-semibold leading-5 text-ink">{listing?.name}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-muted">{listing?.address}</p>
              <dl className="mt-2 space-y-1 text-[11.5px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Supplier ID</dt>
                  <dd className="mono text-ink">{listing?.supplier_property_id}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Coordinates</dt>
                  <dd className="num text-ink">
                    {listing?.latitude.toFixed(4)}, {listing?.longitude.toFixed(4)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Star rating</dt>
                  <dd className="num text-ink">{listing?.star_rating ? `${listing.star_rating}★` : "n/a"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Mapping status</dt>
                  <dd className="text-ink">{listing?.mapping_status}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">From</dt>
                  <dd className="num text-ink">
                    {inr(
                      Math.min(
                        ...[
                          ...(listing?.rooms.flatMap((room) => room.rate_plans.map((plan) => plan.base_price)) ?? []),
                          ...(listing?.activities.flatMap((activity) => activity.offers.map((offer) => offer.price)) ?? []),
                        ].filter((value) => Number.isFinite(value)),
                      ),
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <div className="grid gap-4 rounded-xl border border-line bg-white p-4 md:grid-cols-2">
          <div className="space-y-3">
            <EvidenceBar label="Name similarity" value={evidence.name_similarity} tone="bg-teal" />
            <EvidenceBar
              label="Location proximity"
              value={evidence.geo_similarity}
              detail={evidence.distance_m === null ? "Coordinates missing" : `${evidence.distance_m.toLocaleString("en-IN")} m apart`}
              tone="bg-sky-500"
            />
            <EvidenceBar label="Address similarity" value={evidence.address_similarity} tone="bg-indigo-500" />
            <EvidenceBar label="Attribute agreement" value={evidence.attribute_agreement} tone="bg-violet-500" />
          </div>
          <div className="space-y-2">
            <div>
              <p className="section-label mb-1">Conflicting attributes</p>
              {candidate.conflicts.length === 0 ? (
                <p className="flex items-center gap-1 text-[11.5px] text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> No conflicts detected
                </p>
              ) : (
                <ul className="space-y-1">
                  {candidate.conflicts.map((conflict) => (
                    <li key={conflict} className="flex items-start gap-1 text-[11.5px] text-amber-800">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {conflict}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="section-label mb-1">Missing attributes</p>
              {candidate.missing.length === 0 ? (
                <p className="text-[11.5px] text-muted">Nothing missing</p>
              ) : (
                <ul className="space-y-1">
                  {candidate.missing.map((item) => (
                    <li key={item} className="flex items-start gap-1 text-[11.5px] text-muted">
                      <XCircle className="mt-0.5 h-3 w-3 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!canApprove ? (
              <p className="flex items-start gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] leading-4 text-slate-600">
                <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
                Low-confidence pairs are protected: approval is disabled to avoid unsafe merges.
              </p>
            ) : null}
            <div>
              <label className="section-label mb-1 block" htmlFor="review-note">
                Review note (stored in the audit trail)
              </label>
              <textarea
                id="review-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                maxLength={240}
                placeholder="e.g. Confirmed against supplier contract sheet…"
                className="input resize-none text-[12px]"
              />
            </div>
          </div>
        </div>

        {candidate.decisions.length > 0 ? (
          <div>
            <p className="section-label mb-1.5">Audit trail</p>
            <ul className="space-y-1">
              {candidate.decisions.map((decision, index) => (
                <li key={`${decision.decided_at}-${index}`} className="flex items-center gap-2 text-[11.5px] text-muted">
                  <ArrowRight className="h-2.5 w-2.5" />
                  <span className="font-medium text-ink">{decision.decision}</span> by {decision.reviewer} ·{" "}
                  {relativeTime(decision.decided_at)}
                  {decision.note ? <span className="truncate">— {decision.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
