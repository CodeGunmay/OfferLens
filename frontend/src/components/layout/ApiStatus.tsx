import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE, api } from "../../services/api";

type Health = "checking" | "live" | "offline";

/**
 * Live indicator for the FastAPI connection. Deployments are the usual place
 * where the frontend and the API disagree about where /api lives, so the
 * header always shows which base URL the bundle is using.
 */
export function ApiStatus() {
  const [state, setState] = useState<Health>("checking");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let cancelled = false;
    const probe = () => {
      api
        .health()
        .then((health) => {
          if (cancelled) return;
          setState("live");
          setDetail(`${health.environment} · ${API_BASE}`);
        })
        .catch((error: Error) => {
          if (cancelled) return;
          setState("offline");
          setDetail(`${API_BASE} — ${error.message}`);
        });
    };
    probe();
    const timer = window.setInterval(probe, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const tone =
    state === "live"
      ? "border-teal/40 bg-teal-tint text-teal-dark"
      : state === "offline"
        ? "border-coral/40 bg-coral-tint text-coral-dark"
        : "border-line bg-[#F8FAFC] text-muted";

  return (
    <span
      className={`pill hidden gap-1.5 border md:inline-flex ${tone}`}
      title={detail || "Checking the OfferLens API…"}
    >
      {state === "live" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : state === "offline" ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {state === "live" ? "API live" : state === "offline" ? "API offline" : "API…"}
    </span>
  );
}
