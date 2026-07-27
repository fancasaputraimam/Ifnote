/**
 * Tiny typed fetch wrapper around the backend.
 *
 * AUTH MODEL (httpOnly cookie):
 *  - Requests use RELATIVE paths ("/api/...") so the browser talks
 *    same-origin. Production VPS routes /api → backend via Nginx; Vercel
 *    and local dev use a Next.js rewrite proxy (see next.config.js).
 *  - `credentials: "include"` sends the httpOnly auth cookie automatically.
 *  - No Authorization header / no token in JS: the JWT lives only in the
 *    httpOnly cookie, so XSS cannot read it.
 *  - 401 triggers a custom event 'ifnote:unauthorized' so the AuthProvider
 *    can clear the session.
 *
 * To point at a cross-origin backend WITHOUT the proxy you would also need
 * the backend cookie to be SameSite=None; Secure. The proxy approach keeps
 * everything same-origin and is the supported path.
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
  /** Kept for source-compat; cookie auth means we never attach a token anyway. */
  anonymous?: boolean;
}

/**
 * Base URL for API calls. Default is "" (relative → same-origin), which is
 * what the cookie auth model needs. An explicit NEXT_PUBLIC_API_BASE_URL is
 * honored for legacy/absolute setups, but cross-origin cookies then require
 * SameSite=None on the backend.
 */
function getBaseUrl(): string {
  const explicit =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined;
  return (explicit ?? "").replace(/\/+$/, "");
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

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    // Send + receive the httpOnly auth cookie.
    credentials: "include",
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
