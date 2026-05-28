import { ApiError } from "./api-client";

/**
 * Map a thrown error (API or network) to a user-friendly Indonesian
 * message. Keeps console raw error untouched in dev for debugging.
 *
 * Heuristics:
 *  - 401/403 → autentikasi
 *  - 404      → tidak ditemukan
 *  - 409      → konflik / duplikat
 *  - 4xx validation (e.g. "limit must not be greater than 100") →
 *               generic "Permintaan tidak valid" instead of raw msg
 *  - 5xx      → server bermasalah
 *  - network  → "Koneksi terputus"
 */
export function mapApiErrorToMessage(err: unknown, fallback = "Terjadi kesalahan"): string {
  if (err instanceof ApiError) {
    const s = err.status;
    if (s === 401 || s === 403) {
      return "Sesi habis. Silakan masuk kembali.";
    }
    if (s === 404) return "Data tidak ditemukan.";
    if (s === 409) return "Data sudah ada.";
    if (s >= 400 && s < 500) {
      // Heuristic: hide validator noise like "X must not be greater than Y"
      if (/must not|must be|should not/i.test(err.message)) {
        return "Permintaan tidak valid.";
      }
      return err.message || "Permintaan tidak valid.";
    }
    if (s >= 500) {
      return "Server sedang bermasalah. Coba lagi nanti.";
    }
    return err.message || fallback;
  }
  if (err instanceof Error) {
    if (/Failed to fetch|NetworkError|ECONN/i.test(err.message)) {
      return "Koneksi ke server gagal.";
    }
    return err.message || fallback;
  }
  return fallback;
}

/**
 * True if error is purely transient/recoverable (network or 5xx).
 * Used by feature screens to decide whether to show offline banner.
 */
export function isTransientError(err: unknown): boolean {
  if (err instanceof ApiError) {
    if (err.status >= 500) return true;
    if (err.status === 0) return true; // network-ish (some clients map 0)
  }
  if (err instanceof Error && /Failed to fetch|NetworkError|ECONN/i.test(err.message)) {
    return true;
  }
  return false;
}
