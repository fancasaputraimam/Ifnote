import { api } from "./api-client";
import { AUTH_PRESENT_KEY } from "./constants";
import type { AuthResponse, MeResponse } from "./types";
import { safeStorage } from "./utils";

/**
 * Auth client. Token disimpan oleh backend sebagai httpOnly cookie —
 * JavaScript tidak pernah memegang JWT mentah (mitigasi XSS).
 *
 * Di sisi frontend kita hanya menyimpan penanda sesi (`AUTH_PRESENT_KEY`)
 * di localStorage untuk gating UI cepat + sinkronisasi lintas-tab. Ini
 * bukan kredensial: dipalsukan pun, request tetap gagal di backend karena
 * cookie-nya yang menentukan.
 *
 * Endpoints:
 *  POST /api/auth/register  → set cookie
 *  POST /api/auth/login     → set cookie
 *  POST /api/auth/logout    → clear cookie
 *  GET  /api/auth/me
 */

export const authClient = {
  async register(body: { email: string; password: string; name?: string }) {
    const r = await api.post<AuthResponse>("/api/auth/register", body, { anonymous: true });
    markPresent();
    return r;
  },

  async login(body: { email: string; password: string }) {
    const r = await api.post<AuthResponse>("/api/auth/login", body, { anonymous: true });
    markPresent();
    return r;
  },

  async logout() {
    try {
      await api.post("/api/auth/logout").catch(() => undefined);
    } finally {
      clearPresent();
    }
  },

  async me(): Promise<MeResponse> {
    return api.get<MeResponse>("/api/auth/me");
  },

  /** Cepat (tanpa network): apakah kemungkinan ada sesi aktif. */
  hasToken(): boolean {
    return !!safeStorage.get(AUTH_PRESENT_KEY);
  },

  clearToken: clearPresent,
  saveToken: markPresent,
};

function markPresent() {
  safeStorage.set(AUTH_PRESENT_KEY, "1");
}

function clearPresent() {
  safeStorage.remove(AUTH_PRESENT_KEY);
}
