import { ApiError } from "./api-client";

// ----------------------------------------------------------------------
// Structured error → toast mapping
// ----------------------------------------------------------------------

export interface UserFacingError {
  title: string;
  message: string;
  variant: "error" | "warning" | "info";
}

/**
 * Map a thrown error (API or network) to a structured, user-facing
 * Indonesian message + toast variant. Used by `notify.apiError()` and
 * any place that wants a structured error message instead of a single
 * string.
 *
 * Heuristics:
 *  - 401      → "Sesi berakhir" (warning)
 *  - 403      → "Akses dibatasi" (warning)
 *  - 404      → "Data tidak ditemukan" (warning)
 *  - 409      → "Data sudah ada" (warning)
 *  - 4xx validation noise → "Data belum lengkap" (warning)
 *  - 4xx other (with safe msg)  → kept as-is (warning)
 *  - 5xx      → "Server bermasalah" (error)
 *  - network  → "Koneksi bermasalah" (error)
 *  - unknown  → "Terjadi kesalahan" (error)
 *
 * Raw backend error stays in the console (untouched) — we never surface
 * stack traces, validator objects, or AxiosError text to the UI.
 */
export function mapApiErrorToUserMessage(
  err: unknown,
  fallback?: { title?: string; message?: string },
): UserFacingError {
  if (err instanceof ApiError) {
    const s = err.status;

    if (s === 401) {
      return {
        title: "Sesi berakhir",
        message: "Silakan masuk lagi.",
        variant: "warning",
      };
    }
    if (s === 403) {
      return {
        title: "Akses dibatasi",
        message: "Kamu tidak punya izin untuk aksi ini.",
        variant: "warning",
      };
    }
    if (s === 404) {
      return {
        title: "Data tidak ditemukan",
        message: "Coba muat ulang halaman.",
        variant: "warning",
      };
    }
    if (s === 409) {
      return {
        title: "Data sudah ada",
        message: "Catatan ini sudah pernah kamu simpan.",
        variant: "warning",
      };
    }
    if (s === 429) {
      return {
        title: "Terlalu banyak permintaan",
        message: "Tunggu sebentar lalu coba lagi.",
        variant: "warning",
      };
    }
    if (s === 503) {
      // 503 = AI_NOT_CONFIGURED in this app, plus generic upstream issues.
      return {
        title: "Layanan belum siap",
        message: "Coba lagi sebentar atau cek pengaturan AI.",
        variant: "warning",
      };
    }
    if (s >= 400 && s < 500) {
      // Validator noise like "limit must not be greater than 100" — hide.
      if (isValidatorNoise(err.message)) {
        return {
          title: "Data belum lengkap",
          message: "Cek kembali input yang kamu isi.",
          variant: "warning",
        };
      }
      // Friendly-enough backend message: surface it as warning.
      return {
        title: fallback?.title ?? "Permintaan tidak valid",
        message: cleanMessage(err.message) ?? fallback?.message ?? "Cek kembali input yang kamu isi.",
        variant: "warning",
      };
    }
    if (s >= 500) {
      return {
        title: "Server bermasalah",
        message: "Coba lagi sebentar.",
        variant: "error",
      };
    }
    return {
      title: fallback?.title ?? "Terjadi kesalahan",
      message: cleanMessage(err.message) ?? fallback?.message ?? "Coba ulangi beberapa saat lagi.",
      variant: "error",
    };
  }

  if (err instanceof Error) {
    if (/Failed to fetch|NetworkError|ECONN|ENOTFOUND/i.test(err.message)) {
      return {
        title: "Koneksi bermasalah",
        message: "Periksa koneksi internet kamu.",
        variant: "error",
      };
    }
    return {
      title: fallback?.title ?? "Terjadi kesalahan",
      message: cleanMessage(err.message) ?? fallback?.message ?? "Coba ulangi beberapa saat lagi.",
      variant: "error",
    };
  }

  return {
    title: fallback?.title ?? "Terjadi kesalahan",
    message: fallback?.message ?? "Coba ulangi beberapa saat lagi.",
    variant: "error",
  };
}

/**
 * Same as `mapApiErrorToUserMessage` but flattened to a single string —
 * kept for legacy callers that only need a one-line message.
 *
 * @deprecated Prefer `mapApiErrorToUserMessage` + `notify.error/warning`.
 */
export function mapApiErrorToMessage(err: unknown, fallback = "Terjadi kesalahan"): string {
  const m = mapApiErrorToUserMessage(err, { title: fallback, message: fallback });
  return m.message ? `${m.title}. ${m.message}` : m.title;
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

// ----------------------------------------------------------------------
// internals
// ----------------------------------------------------------------------

/** Validator messages that should never reach the user. */
function isValidatorNoise(msg: string | undefined): boolean {
  if (!msg) return false;
  return /must not|must be|should not|isNotEmpty|isString|isInt|isUUID|isEmail|maxLength|minLength|each value/i.test(
    msg,
  );
}

/**
 * Strip stack-trace / object-y / framework-specific noise from an error
 * message before showing it to the user. Returns null if nothing useful
 * is left.
 */
function cleanMessage(msg: string | undefined): string | null {
  if (!msg) return null;
  // Drop things like "AxiosError: Request failed with status code 500"
  if (/AxiosError|Prisma|stack trace|undefined is not|TypeError:/i.test(msg)) {
    return null;
  }
  // Drop pure HTTP status strings.
  if (/^HTTP \d+$/i.test(msg.trim())) return null;
  // Drop validator-style noise.
  if (isValidatorNoise(msg)) return null;
  // Trim noise prefixes.
  const cleaned = msg.replace(/^Error:\s*/i, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}
