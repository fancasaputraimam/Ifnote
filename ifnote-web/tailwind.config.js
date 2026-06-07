/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── ifNote 2.0 palette ────────────────────────────────────────
        // Calm "study notebook" identity, refreshed: cleaner warm paper
        // surfaces, a vivid-but-calm indigo primary, violet + emerald
        // secondaries. Token NAMES are unchanged so the whole app inherits
        // the new look automatically; scales are expanded for depth.
        paper: {
          50: "#fcfbf8", // app background (light)
          100: "#f5f3ec", // subtle raised / hover fill
          200: "#e9e4d6", // hairline borders
          300: "#d9d2bf", // stronger borders / dividers
          400: "#bdb49c",
          800: "#1b1a16", // (legacy) deep night
          900: "#121110", // app background (dark)
        },
        ink: {
          50: "#f6f6f7", // text on dark
          100: "#e8e8ea",
          200: "#d2d2d6",
          300: "#a6a6ad",
          400: "#6b6b75", // muted text (light)
          500: "#52525b",
          600: "#3a3a42",
          700: "#26262b", // dark borders
          800: "#1a1a1e", // dark surfaces / cards
          900: "#0d0d10",
        },
        // Primary — indigo, modern & confident but still calm.
        accent: {
          50: "#eef1ff",
          100: "#e0e5ff",
          200: "#c6cdff",
          300: "#a3acfb",
          400: "#7d86f3",
          500: "#5b63e6", // primary
          600: "#4a4fd1",
          700: "#3c3fab",
          800: "#323489",
          900: "#2c2e6e",
        },
        // Secondary — soft violet.
        lilac: {
          50: "#f6f1fd",
          100: "#ece1fb",
          200: "#dcc6f6",
          300: "#c6a3ee",
          400: "#b083e4",
          500: "#9a64d6",
          600: "#824cbd",
          700: "#693c99",
        },
        // Success / nature — calm emerald.
        leaf: {
          50: "#edf8f1",
          100: "#d3eede",
          200: "#a9ddc0",
          300: "#76c79e",
          400: "#4fb083",
          500: "#3d9870",
          600: "#2f7d5b",
          700: "#285f47",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "ui-sans-serif", "Segoe UI", "sans-serif"],
        jp: ["'Noto Sans JP'", "var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        "notebook-sm": "0.875rem",
        notebook: "1.25rem",
        "notebook-lg": "1.75rem",
      },
      boxShadow: {
        // Layered, soft shadows tuned for the warm background.
        notebook:
          "0 1px 2px rgba(20,18,12,0.04), 0 4px 14px -6px rgba(20,18,12,0.10)",
        "notebook-md":
          "0 2px 6px rgba(20,18,12,0.05), 0 14px 38px -16px rgba(20,18,12,0.20)",
        "notebook-lg":
          "0 6px 18px rgba(20,18,12,0.08), 0 28px 64px -24px rgba(20,18,12,0.30)",
        glow: "0 8px 28px -8px rgba(91,99,230,0.45)",
        "glow-sm": "0 4px 14px -4px rgba(91,99,230,0.40)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #6b73f0 0%, #5b63e6 50%, #7c5ad0 100%)",
        "accent-gradient-soft": "linear-gradient(135deg, #eef1ff 0%, #f6f1fd 100%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out both",
        "scale-in": "scale-in 0.18s cubic-bezier(0.22,0.61,0.36,1) both",
      },
    },
  },
  plugins: [],
};
