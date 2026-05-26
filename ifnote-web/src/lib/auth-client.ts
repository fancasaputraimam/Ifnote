import { api } from "./api-client";
import { TOKEN_STORAGE_KEY } from "./constants";
import type { AuthResponse, MeResponse } from "./types";
import { safeStorage } from "./utils";

/**
 * Auth client. MVP storage uses localStorage. Move to httpOnly cookies
 * once the backend session/cookie path is implemented.
 *
 * Endpoints:
 *  POST /api/auth/register
 *  POST /api/auth/login
 *  POST /api/auth/logout (no-op on stateless JWT)
 *  GET  /api/auth/me
 */

export const authClient = {
  async register(body: { email: string; password: string; name?: string }) {
    const r = await api.post<AuthResponse>("/api/auth/register", body, { anonymous: true });
    saveToken(r.token);
    return r;
  },

  async login(body: { email: string; password: string }) {
    const r = await api.post<AuthResponse>("/api/auth/login", body, { anonymous: true });
    saveToken(r.token);
    return r;
  },

  async logout() {
    try {
      await api.post("/api/auth/logout").catch(() => undefined);
    } finally {
      clearToken();
    }
  },

  async me(): Promise<MeResponse> {
    return api.get<MeResponse>("/api/auth/me");
  },

  hasToken(): boolean {
    return !!safeStorage.get(TOKEN_STORAGE_KEY);
  },

  clearToken,
  saveToken,
};

function saveToken(token: string) {
  safeStorage.set(TOKEN_STORAGE_KEY, token);
}

function clearToken() {
  safeStorage.remove(TOKEN_STORAGE_KEY);
}
