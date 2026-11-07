import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import type { SupplierRef } from "../types";

export interface Toast {
  id: number;
  title: string;
  detail?: string;
  tone: "success" | "info" | "warning" | "error";
}

interface WorkspaceValue {
  sourceFilter: string;
  setSourceFilter: (code: string) => void;
  suppliers: SupplierRef[];
  reviewLoad: number;
  refreshCounters: () => void;
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

const FALLBACK_SUPPLIERS: SupplierRef[] = [
  { code: "ATLAS", name: "Supplier Atlas", accent: "#16B8A6" },
  { code: "MERIDIAN", name: "Supplier Meridian", accent: "#3B82F6" },
  { code: "HORIZON", name: "Supplier Horizon", accent: "#8B5CF6" },
];

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [sourceFilter, setSourceFilter] = useState("all");
  const [suppliers, setSuppliers] = useState<SupplierRef[]>(FALLBACK_SUPPLIERS);
  const [reviewLoad, setReviewLoad] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [counterNonce, setCounterNonce] = useState(0);

  const refreshCounters = useCallback(() => setCounterNonce((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    api
      .overview()
      .then((data) => {
        if (cancelled) return;
        setSuppliers(
          data.supplier_distribution.map((supplier) => ({
            code: supplier.code,
            name: supplier.name,
            accent: supplier.accent,
          })),
        );
        setReviewLoad(data.readiness.review_load);
      })
      .catch(() => {
        /* the layout stays usable if the API is unreachable */
      });
    return () => {
      cancelled = true;
    };
  }, [counterNonce]);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo<WorkspaceValue>(
    () => ({
      sourceFilter,
      setSourceFilter,
      suppliers,
      reviewLoad,
      refreshCounters,
      toasts,
      pushToast,
      dismissToast,
    }),
    [sourceFilter, suppliers, reviewLoad, refreshCounters, toasts, pushToast, dismissToast],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
