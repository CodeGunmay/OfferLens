/**
 * Thin typed client over the OfferLens API.
 *
 * Resolution order for the API origin:
 *   1. VITE_API_BASE_URL — recommended for deployments (Netlify, Vercel, …)
 *   2. VITE_API_BASE     — legacy name, still honoured
 *   3. "/api"            — same-origin: the Vite dev proxy, or FastAPI itself
 *                          when it serves the built SPA
 *
 * A configured base may be given with or without the "/api" suffix and with or
 * without a trailing slash; both are normalised, e.g.
 *   https://offerlens-api.onrender.com        -> https://offerlens-api.onrender.com/api
 *   https://offerlens-api.onrender.com/api/   -> https://offerlens-api.onrender.com/api
 */
import type {
  AnalyticsResponse,
  CompareResponse,
  EnrichmentResponse,
  GroupDetail,
  GroupSummary,
  ListResponse,
  MatchListResponse,
  MatchRow,
  OverviewResponse,
  RankingResponse,
  SearchResult,
  WorkspaceSettings,
} from "../types";

const RAW_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "";

export function resolveApiBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "/api";
  if (/\/api$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
}

export const API_BASE = resolveApiBase(RAW_BASE);
/** Absolute URL when a host is configured — useful for error messages. */
export const API_ORIGIN = /^https?:/i.test(API_BASE) ? API_BASE.replace(/\/api$/i, "") : window.location.origin;

const REQUEST_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  status: number;
  url: string;
  constructor(message: string, status: number, url = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}

function describeFailure(status: number, base: string): string {
  const hosted = /^https?:/i.test(base);
  if (status === 0) {
    return hosted
      ? `Could not reach the OfferLens API at ${base}. The service may be starting up (free tiers sleep) — retry in a moment, or check that the URL is correct and allows cross-origin requests.`
      : "Could not reach the OfferLens API. Start the backend with: uvicorn app.main:app --port 8000 — or set VITE_API_BASE_URL to your hosted API before building.";
  }
  if (status === 404) {
    return `The API returned 404 for this request. ${hosted ? `Check that ${base} is the OfferLens API root.` : "This build is pointing at its own origin, which only works when FastAPI serves the SPA."}`;
  }
  if (status === 502 || status === 503 || status === 504) {
    return "The API host is up but not responding (gateway error). If it is a free tier it may still be waking — retry shortly.";
  }
  return `Request failed (${status}).`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal: controller.signal,
      ...init,
    });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    throw new ApiError(
      aborted
        ? `The API did not respond within ${REQUEST_TIMEOUT_MS / 1000}s. A sleeping free-tier instance can take up to a minute to wake — try again.`
        : describeFailure(0, API_BASE),
      0,
      url,
    );
  } finally {
    window.clearTimeout(timer);
  }

  if (!response.ok) {
    let detail = describeFailure(response.status, API_BASE);
    try {
      const body = (await response.json()) as { detail?: string | { msg?: string }[] };
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail) && body.detail[0]?.msg) detail = body.detail[0].msg;
    } catch {
      /* non-JSON body: keep the status-based message */
    }
    throw new ApiError(detail, response.status, url);
  }

  // A static host (Netlify) answers unknown paths with index.html and a 200.
  // Detect that so the UI can explain the misconfiguration instead of failing
  // with a confusing "Unexpected token <".
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new ApiError(
      `The request for ${url} returned an HTML page instead of JSON. This usually means the frontend is served without an API behind /api — deploy the FastAPI backend and set VITE_API_BASE_URL to its public URL.`,
      404,
      url,
    );
  }

  return (await response.json()) as T;
}

const query = (params: object): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export interface InventoryParams {
  search?: string;
  city?: string;
  supplier?: string;
  status?: string;
  sort?: string;
}

export const api = {
  health: () => request<{ status: string; environment: string }>("/health"),

  overview: () => request<OverviewResponse>("/overview"),

  hotels: (params: InventoryParams = {}) =>
    request<ListResponse<GroupSummary>>(`/inventory/hotels${query(params)}`),

  hotel: (code: string) => request<GroupDetail>(`/inventory/hotels/${code}`),

  sightseeing: (params: InventoryParams = {}) =>
    request<ListResponse<GroupSummary>>(`/inventory/sightseeing${query(params)}`),

  sightseeingProduct: (code: string) => request<GroupDetail>(`/inventory/sightseeing/${code}`),

  content: () => request<EnrichmentResponse>("/inventory/content"),

  compare: (body: {
    group_code: string;
    category?: string;
    equivalence_class?: string | null;
    profile_key?: string;
    weights?: Record<string, number>;
    assumptions?: Record<string, number>;
  }) => request<CompareResponse>("/offers/compare", { method: "POST", body: JSON.stringify(body) }),

  profiles: () =>
    request<{ profiles: CompareResponse["profiles"]; assumptions: CompareResponse["assumptions"]; dimensions: string[] }>(
      "/offers/profiles",
    ),

  updateProfileWeights: (key: string, weights: Record<string, number>) =>
    request<{ key: string; name: string; weights: Record<string, number> }>(`/offers/profiles/${key}`, {
      method: "PUT",
      body: JSON.stringify({ weights }),
    }),

  updateAssumption: (key: string, value: number) =>
    request<{ key: string; value: number }>(`/offers/assumptions/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),

  matches: (params: { status?: string; band?: string; category?: string; search?: string; sort?: string } = {}) =>
    request<MatchListResponse>(`/matches${query(params)}`),

  decide: (id: number, body: { decision: string; reviewer?: string; note?: string }) =>
    request<MatchRow>(`/matches/${id}/decision`, { method: "POST", body: JSON.stringify(body) }),

  ranking: (body: { group_code: string; weights?: Record<string, number>; equivalence_class?: string | null }) =>
    request<RankingResponse>("/ranking", { method: "POST", body: JSON.stringify(body) }),

  analytics: () => request<AnalyticsResponse>("/analytics"),

  settings: () => request<WorkspaceSettings>("/settings"),

  updateSettings: (body: Record<string, string | number | boolean | null>) =>
    request<WorkspaceSettings>("/settings", { method: "PUT", body: JSON.stringify(body) }),

  search: (q: string) => request<{ query: string; results: SearchResult[] }>(`/search${query({ q })}`),
};
