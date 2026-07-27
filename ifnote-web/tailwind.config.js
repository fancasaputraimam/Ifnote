/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── ifNote "Zen Ink" palette ──────────────────────────────────
        // Modern Japanese stationery: clean white paper, sumi-ink text,
        // a vermillion (shu-iro) hanko red as the single strong accent,
        // ai-iro indigo and matcha green as quiet secondaries.
        // Token NAMES are unchanged so the whole app inherits the new
        // look automatically.
        paper: {
          50: "#fdfdfc", // app background (light) — clean white
          100: "#f6f5f2", // subtle raised / hover fill
          200: "#e8e6e1", // hairline borders
          300: "#d5d2ca", // stronger borders / dividers
          400: "#aaa69c",
          800: "#161514", // (legacy) deep night
          900: "#0f0e0d", // app background (dark) — sumi black
        },
        ink: {
          50: "#f7f7f6", // text on dark
          100: "#eaeae8",
          200: "#d4d4d1",
          300: "#a5a5a1",
          400: "#6e6e69", // muted text (light)
          500: "#54544f",
          600: "#3b3b37",
          700: "#262624", // dark borders
          800: "#1a1a18", // dark surfaces / cards
          900: "#0c0c0b",
        },
        // Primary — vermillion (朱色), the hanko-seal red.
        accent: {
          50: "#fdf2ef",
          100: "#fbe3dd",
          200: "#f7c6ba",
          300: "#f0a08c",
          400: "#e5765c",
          500: "#d94f33", // primary
          600: "#ba3c23",
          700: "#97311e",
          800: "#7a2b1d",
          900: "#64261b",
        },
        // Secondary — ai-iro (藍色), Japanese indigo. Token name kept.
        lilac: {
          50: "#f0f4f8",
          100: "#dfe7ef",
          200: "#c0d0de",
          300: "#94b0c6",
          400: "#6b8fa9",
          500: "#4f7690",
          600: "#3e5f76",
          700: "#344d5f",
        },
        // Success / nature — matcha (抹茶) green. Token name kept.
        leaf: {
          50: "#f3f6ee",
          100: "#e3ecd7",
          200: "#c8d9af",
          300: "#a6c184",
          400: "#86a763",
          500: "#6d8d4c",
          600: "#57723c",
          700: "#465a32",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "ui-sans-serif", "Segoe UI", "sans-serif"],
        jp: ["'Zen Kaku Gothic New'", "'Noto Sans JP'", "var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        "notebook-sm": "0.625rem",
        notebook: "1rem",
        "notebook-lg": "1.5rem",
      },
      boxShadow: {
        // Quiet, ink-tinted shadows — cards mostly rely on hairlines.
        notebook:
          "0 1px 2px rgba(15,14,13,0.04), 0 2px 8px -4px rgba(15,14,13,0.06)",
        "notebook-md":
          "0 1px 3px rgba(15,14,13,0.05), 0 10px 30px -18px rgba(15,14,13,0.14)",
        "notebook-lg":
          "0 2px 8px rgba(15,14,13,0.06), 0 24px 56px -28px rgba(15,14,13,0.22)",
        glow: "0 8px 24px -8px rgba(217,79,51,0.45)",
        "glow-sm": "0 4px 12px -4px rgba(217,79,51,0.38)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #e2603f 0%, #d94f33 55%, #c03a24 100%)",
        "accent-gradient-soft": "linear-gradient(135deg, #fdf2ef 0%, #f0f4f8 100%)",
        "ink-gradient": "linear-gradient(135deg, #3b3b37 0%, #1a1a18 60%, #0c0c0b 100%)",
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
