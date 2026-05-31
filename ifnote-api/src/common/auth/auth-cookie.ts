import type { CookieOptions, Response } from "express";
import { loadEnv } from "../../config/env";

/**
 * Nama cookie httpOnly yang menyimpan JWT. Dibaca oleh JwtStrategy
 * (lewat custom extractor) dan di-set/di-clear oleh AuthController.
 *
 * Kenapa httpOnly cookie, bukan localStorage:
 *  - Token tidak bisa dibaca JavaScript → mitigasi pencurian token saat XSS.
 *  - SameSite=Lax mencegah CSRF untuk request cross-site berbahaya
 *    (login/register tetap jalan karena top-level navigation aman).
 *
 * Topologi deploy ifNote same-origin (Nginx proxy /api → backend,
 * /* → frontend), jadi SameSite=Lax cukup. Untuk dev, frontend pakai
 * Next.js rewrite proxy supaya juga same-origin.
 */
export const AUTH_COOKIE_NAME = "ifnote_token";

/** Parse "7d" / "12h" / "30m" / "3600" (detik) / "3600s" → milidetik. */
export function expiresInToMs(expiresIn: string): number {
  const DEFAULT = 7 * 24 * 60 * 60 * 1000; // 7 hari
  if (!expiresIn) return DEFAULT;
  const m = expiresIn.trim().match(/^(\d+)\s*([smhd])?$/i);
  if (!m) return DEFAULT;
  const value = Number(m[1]);
  const unit = (m[2] ?? "s").toLowerCase();
  const mult =
    unit === "d" ? 86_400_000 : unit === "h" ? 3_600_000 : unit === "m" ? 60_000 : 1_000;
  return value * mult;
}

/** Opsi cookie konsisten untuk set & clear (harus identik kecuali maxAge). */
function baseCookieOptions(): CookieOptions {
  const env = loadEnv();
  const isProd = env.nodeEnv === "production";
  return {
    httpOnly: true,
    // Secure hanya di production (dev pakai http://localhost).
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string): void {
  const env = loadEnv();
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: expiresInToMs(env.jwt.expiresIn),
  });
}

export function clearAuthCookie(res: Response): void {
  // clearCookie harus pakai opsi yang sama (path/sameSite/secure) agar
  // browser benar-benar menghapusnya.
  res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions());
}
