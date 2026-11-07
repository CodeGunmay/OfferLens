import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";

const TONES = {
  success: { ring: "border-emerald-200", icon: CheckCircle2, color: "text-emerald-600" },
  info: { ring: "border-line", icon: Info, color: "text-sky-600" },
  warning: { ring: "border-amber-200", icon: AlertTriangle, color: "text-amber-600" },
  error: { ring: "border-rose-200", icon: AlertTriangle, color: "text-rose-600" },
} as const;

export function ToastStack() {
  const { toasts, dismissToast } = useWorkspace();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex w-[340px] flex-col gap-2">
      {toasts.map((toast) => {
        const tone = TONES[toast.tone];
        const Icon = tone.icon;
        return (
          <div
            key={toast.id}
            className={`animate-slide-in rounded-xl border ${tone.ring} bg-white p-3 shadow-raised`}
          >
            <div className="flex items-start gap-2">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-ink">{toast.title}</p>
                {toast.detail ? <p className="mt-0.5 text-[11.5px] leading-4 text-muted">{toast.detail}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded p-0.5 text-subtle hover:bg-slate-100 hover:text-ink"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
