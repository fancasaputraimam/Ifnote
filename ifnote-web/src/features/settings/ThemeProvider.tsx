"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { safeStorage } from "@/lib/utils";

type Theme = "system" | "light" | "dark";
const STORAGE_KEY = "ifnote.theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Initial pull from localStorage (guarded for SSR)
  useEffect(() => {
    const stored = safeStorage.get(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored);
    }
  }, []);

  // Apply class to <html>
  useEffect(() => {
    const mql = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const apply = () => {
      const isDark = theme === "dark" || (theme === "system" && !!mql?.matches);
      const root = document.documentElement;
      root.classList.toggle("dark", isDark);
      setResolved(isDark ? "dark" : "light");
    };
    apply();
    if (theme === "system" && mql) {
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
    return;
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    safeStorage.set(STORAGE_KEY, t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
