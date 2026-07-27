import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className concatenator. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Normalisasi string Jepang untuk perbandingan duplikat (kotoba jp /
 * bunpou pattern): buang whitespace, lowercase. Dipakai konsisten di
 * deteksi duplikat AI (bulk kotoba & analisa bunpou).
 */
export function normalizeJaKey(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

/**
 * Heuristik: apakah satu baris input terlihat seperti KALIMAT Jepang
 * (bukan kata/pola)? Dipakai dialog tambah kotoba/bunpou untuk routing
 * otomatis ke analisa kalimat — tanpa toggle manual.
 *
 * Kalimat = ada tanda baca akhir Jepang, ATAU cukup panjang (≥8 aksara
 * Jepang) dan mengandung partikel umum. Baris berformat pasangan
 * ("kata = arti") atau yang diawali 〜 (pola bunpou) bukan kalimat.
 */
export function looksLikeJaSentence(line: string): boolean {
  const s = line.trim();
  if (!s) return false;
  if (s.includes("=") || s.includes("＝")) return false;
  if (/^[〜~～]/.test(s)) return false;
  const jaChars = s.match(/[぀-ヿ一-鿿㐀-䶿]/g)?.length ?? 0;
  if (jaChars === 0) return false;
  if (/[。！？]/.test(s)) return true;
  return jaChars >= 8 && /[をはがにで]/.test(s);
}

/**
 * Safe storage access — guarded for SSR / server components. Provides
 * both localStorage (default) and sessionStorage (`safeStorage.session`).
 */
export const safeStorage = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(key, value); } catch { /* quota / private mode */ }
  },
  remove(key: string): void {
    if (typeof window === "undefined") return;
    try { window.localStorage.removeItem(key); } catch { /* noop */ }
  },
  session: {
    get(key: string): string | null {
      if (typeof window === "undefined") return null;
      try { return window.sessionStorage.getItem(key); } catch { return null; }
    },
    set(key: string, value: string): void {
      if (typeof window === "undefined") return;
      try { window.sessionStorage.setItem(key, value); } catch { /* noop */ }
    },
    remove(key: string): void {
      if (typeof window === "undefined") return;
      try { window.sessionStorage.removeItem(key); } catch { /* noop */ }
    },
  },
};
