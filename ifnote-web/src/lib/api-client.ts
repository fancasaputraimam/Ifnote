import { TOKEN_STORAGE_KEY } from "./constants";
import { safeStorage } from "./utils";

/**
 * Tiny typed fetch wrapper around the backend.
 *
 * - Reads NEXT_PUBLIC_API_BASE_URL at runtime (never hardcoded).
 * - Optionally attaches the Bearer token from localStorage (MVP).
 * - Always returns parsed JSON (or throws ApiError).
 * - 401 triggers a custom event 'ifnote:unauthorized' so the AuthProvider
 *   can clear the session.
 *
 * SECURITY TODO: localStorage tokens are vulnerable to XSS. Move to
 * httpOnly cookies once backend supports cookie/session auth.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOpts {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Skip Authorization header even if token exists (auth/login etc). */
  anonymous?: boolean;
}

function getBaseUrl(): string {
  // Read each call so a runtime change picks up. Falls back to localhost dev.
  return (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) ||
    "http://localhost:3001"
  ).replace(/\/+$/, "");
}

function buildQuery(query?: RequestOpts["query"]): string {
  if (!query) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOpts = {},
): Promise<T> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}${buildQuery(opts.query)}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  if (!opts.anonymous) {
    const token = safeStorage.get(TOKEN_STORAGE_KEY);
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    credentials: "omit", // switch to "include" once backend uses cookies
  });

  // 401 → broadcast for auth provider
  if (res.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ifnote:unauthorized"));
  }

  // 204 / empty body
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try { parsed = JSON.parse(text); }
    catch { parsed = text; }
  }

  if (!res.ok) {
    const body = parsed as { message?: string | string[] } | string | undefined;
    const msg = (() => {
      if (!body) return res.statusText || `HTTP ${res.status}`;
      if (typeof body === "string") return body;
      if (Array.isArray(body.message)) return body.message.join(", ");
      return body.message ?? res.statusText ?? `HTTP ${res.status}`;
    })();
    throw new ApiError(res.status, parsed, msg);
  }

  return parsed as T;
}

export const api = {
  get: <T = unknown>(path: string, opts: Omit<RequestOpts, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, opts: Omit<RequestOpts, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown, opts: Omit<RequestOpts, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "PUT", body }),
  delete: <T = unknown>(path: string, opts: Omit<RequestOpts, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "DELETE" }),
  patch: <T = unknown>(path: string, body?: unknown, opts: Omit<RequestOpts, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "PATCH", body }),
};

export function getApiBaseUrl(): string {
  return getBaseUrl();
}
