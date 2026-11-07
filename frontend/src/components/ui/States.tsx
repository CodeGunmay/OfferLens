import { AlertTriangle, Inbox, Loader2, PlugZap, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { API_BASE } from "../../services/api";

export function LoadingState({ label = "Loading workspace data…" }: { label?: string }) {
  return (
    <div className="card flex items-center justify-center gap-2 px-4 py-14 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin text-teal" />
      {label}
    </div>
  );
}

/**
 * Shown under an API error: tells the operator exactly which base URL the
 * bundle was compiled with, which is the usual cause of a wall of 404s.
 */
function ApiDiagnostics() {
  return (
    <div className="mt-3 rounded-lg border border-rose-200/80 bg-white/70 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-rose-700">
        <PlugZap className="h-3 w-3" /> API endpoint this build is using
      </p>
      <code className="mt-1 block break-all font-mono text-[11.5px] text-rose-900">{API_BASE}</code>
      <p className="mt-1.5 text-[11px] leading-4 text-rose-700/90">
        If that is the Netlify domain, the bundle was built without a backend URL. Rebuild with{" "}
        <code className="rounded bg-rose-100 px-1 font-mono text-[10.5px]">VITE_API_BASE_URL</code> set to your
        deployed FastAPI origin, then redeploy.
      </p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
        <div>
          <p className="text-sm font-semibold text-rose-800">Could not load this view</p>
          <p className="mt-1 text-[13px] leading-5 text-rose-700">{message}</p>
          <ApiDiagnostics />
          {onRetry ? (
            <button type="button" onClick={onRetry} className="btn-secondary mt-3">
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <Inbox className="h-5 w-5 text-subtle" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {detail ? <p className="max-w-md text-[13px] text-muted">{detail}</p> : null}
      {action}
    </div>
  );
}

export function SkeletonRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <div
              key={columnIndex}
              className="h-3 animate-pulse rounded bg-slate-100"
              style={{ width: `${[38, 20, 14, 16, 12][columnIndex % 5]}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
