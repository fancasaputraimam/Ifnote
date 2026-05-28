/**
 * Stable references so we never sprinkle string literals around the codebase.
 */

export const APP_NAME = "ifNote";

export const ROUTES = {
  landing: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  app: {
    home: "/app/home",
    catatan: "/app/catatan",
    hafalan: "/app/hafalan",
    quiz: "/app/quiz",
    ai: "/app/ai",
    settings: "/app/settings",
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

/** localStorage key for the JWT token (MVP only — see TODO in auth-client). */
export const TOKEN_STORAGE_KEY = "ifnote.auth.token";
