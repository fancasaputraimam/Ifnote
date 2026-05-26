import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className concatenator. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Safe localStorage access — guarded for SSR / server components.
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
};
