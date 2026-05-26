/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Calm Japanese notebook palette — see /docs in PRD §11
        paper: {
          50: "#fdfcf7",   // warm off-white background (light)
          100: "#f7f3e9",
          200: "#ebe2c8",
          800: "#1f1d18",  // deep night for dark mode bg
          900: "#15140f",
        },
        ink: {
          50: "#f5f5f6",
          400: "#52525b",
          600: "#3f3f46",
          700: "#27272a",
          800: "#18181b",
        },
        // Soft blue / lilac accents
        accent: {
          50:  "#eef3ff",
          200: "#c7d2fe",
          400: "#7c8cf0",
          500: "#5e6ee0",
          600: "#4854c4",
          700: "#3b46a1",
        },
        lilac: {
          400: "#b794e8",
          500: "#a07cd9",
          600: "#8861c2",
        },
        leaf: {
          500: "#5fa37a",
          600: "#4a8862",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "ui-sans-serif", "Segoe UI", "sans-serif"],
        jp: ["'Noto Sans JP'", "var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        notebook: "1.25rem",
      },
      boxShadow: {
        notebook: "0 1px 2px rgba(20,18,12,0.04), 0 8px 24px -12px rgba(20,18,12,0.10)",
        "notebook-md": "0 2px 4px rgba(20,18,12,0.05), 0 12px 32px -12px rgba(20,18,12,0.14)",
      },
    },
  },
  plugins: [],
};
