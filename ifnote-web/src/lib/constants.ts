/**
 * Stable references so we never sprinkle string literals around the codebase.
 */

export const APP_NAME = "ifNote";

/**
 * Email kontak di halaman legal, About, dan Kontak. Default: alamat pemilik.
 * NEXT_PUBLIC_CONTACT_EMAIL menimpanya kalau alamat berubah.
 */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "founder@ifnote.app";

/**
 * Klaim "ditenagai Claude" di situs publik. Default mati: nyalakan hanya
 * setelah produksi memakai model Claude lewat jalur API resmi.
 */
export const POWERED_BY_CLAUDE = process.env.NEXT_PUBLIC_POWERED_BY_CLAUDE === "true";

export const ROUTES = {
  landing: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  // Tidak ada halaman terpisah lagi: keempatnya blok di landing.
  privacy: "/#privasi",
  terms: "/#ketentuan",
  about: "/#tentang",
  contact: "/#kontak",
  app: {
    home: "/app/home",
    catatan: "/app/catatan",
    hafalan: "/app/hafalan",
    quiz: "/app/quiz",
    ai: "/app/ai",
    settings: "/app/settings",
    profile: "/app/profile",
    admin: "/app/admin",
  },
} as const;

export const PROTECTED_PREFIX = "/app";

/** Bottom-nav order. Settings is intentionally NOT in this list. */
export const BOTTOM_NAV = [
  { href: ROUTES.app.home, label: "Home" },
  { href: ROUTES.app.catatan, label: "Catatan" },
  { href: ROUTES.app.hafalan, label: "Hafalan" },
  { href: ROUTES.app.quiz, label: "Quiz" },
] as const;

/**
 * localStorage key untuk penanda sesi (BUKAN token).
 *
 * Setelah migrasi ke httpOnly cookie, JWT mentah tidak lagi disimpan di
 * localStorage (rawan XSS). Yang disimpan hanya flag boolean "1" sebagai:
 *   - gate UI cepat (tahu harus panggil /me atau tidak tanpa network)
 *   - sinkronisasi lintas-tab (logout di satu tab → tab lain ikut)
 * Token sebenarnya hidup di cookie httpOnly yang tidak terbaca JavaScript.
 */
export const AUTH_PRESENT_KEY = "ifnote.auth.present";
