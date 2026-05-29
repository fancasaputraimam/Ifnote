"use client";

/**
 * ifNote Toast / Notification system.
 *
 * Design rules (PRD promt.txt PART 1–11):
 *  - position fixed top-center, above modals (z-[100])
 *  - safe-area aware (env(safe-area-inset-top))
 *  - rounded-notebook + soft border + subtle shadow + light backdrop blur
 *  - emoji/icon on the left, title + optional message, optional action button
 *  - five variants: success / error / warning / info / loading
 *  - smooth enter/exit animation (180–250ms), respects prefers-reduced-motion
 *  - dark-mode compatible
 *  - max 3 visible, stacks vertically
 *
 * Public API: import { notify } from "@/lib/toast"
 *
 * The legacy `toast(message, tone)` export is kept as a thin shim so any
 * call site we missed still renders cleanly until it's migrated.
 */

import { useEffect } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  variant: ToastVariant;
  /** Short bold heading. Indonesian, friendly. */
  title: string;
  /** Optional secondary line. */
  message?: string;
  /** Optional emoji/icon override. Defaults to variant's themed icon. */
  icon?: string;
  /** Auto-dismiss in ms. 0 = manual only. Default per variant. */
  duration?: number;
  /** Optional inline action button. */
  action?: ToastAction;
}

export interface ToastItem extends Required<Pick<ToastInput, "variant" | "title">> {
  id: number;
  message?: string;
  icon: string;
  duration: number;
  action?: ToastAction;
}

interface ToastStore {
  items: ToastItem[];
  add: (input: ToastInput) => number;
  update: (id: number, patch: Partial<ToastInput>) => void;
  remove: (id: number) => void;
  clear: () => void;
}

// ----------------------------------------------------------------------
// Defaults
// ----------------------------------------------------------------------

const MAX_VISIBLE = 3;

const DEFAULT_ICON: Record<ToastVariant, string> = {
  success: "🌸",
  error:   "⚠️",
  warning: "🍂",
  info:    "📘",
  loading: "✨",
};

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  // PRD PART 7
  success: 3500,
  info:    3500,
  warning: 4500,
  error:   5500,
  loading: 0, // manual dismiss / update
};

// ----------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------

let nextId = 1;

const useToastStore = create<ToastStore>((set) => ({
  items: [],
  add: (input) => {
    const id = nextId++;
    const item: ToastItem = {
      id,
      variant: input.variant,
      title: input.title,
      message: input.message,
      icon: input.icon ?? DEFAULT_ICON[input.variant],
      duration: input.duration ?? DEFAULT_DURATION[input.variant],
      action: input.action,
    };
    set((s) => {
      // Cap visible toasts; oldest gets pushed out.
      const next = [...s.items, item];
      if (next.length > MAX_VISIBLE) next.splice(0, next.length - MAX_VISIBLE);
      return { items: next };
    });
    return id;
  },
  update: (id, patch) =>
    set((s) => ({
      items: s.items.map((t) => {
        if (t.id !== id) return t;
        const variant = patch.variant ?? t.variant;
        return {
          ...t,
          variant,
          title: patch.title ?? t.title,
          message: patch.message !== undefined ? patch.message : t.message,
          icon: patch.icon ?? (patch.variant ? DEFAULT_ICON[patch.variant] : t.icon),
          duration:
            patch.duration !== undefined
              ? patch.duration
              : patch.variant
                ? DEFAULT_DURATION[patch.variant]
                : t.duration,
          action: patch.action !== undefined ? patch.action : t.action,
        };
      }),
    })),
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
  clear: () => set({ items: [] }),
}));

// ----------------------------------------------------------------------
// Imperative store API (consumed by lib/toast.ts)
// ----------------------------------------------------------------------

export const toastStore = {
  add: (input: ToastInput) => useToastStore.getState().add(input),
  update: (id: number, patch: Partial<ToastInput>) =>
    useToastStore.getState().update(id, patch),
  remove: (id: number) => useToastStore.getState().remove(id),
  clear: () => useToastStore.getState().clear(),
};

// ----------------------------------------------------------------------
// Variant tokens (Tailwind classes)
// ----------------------------------------------------------------------

interface VariantTokens {
  /** Left accent strip color. */
  stripe: string;
  /** Container ring/border. */
  ring: string;
  /** Background tint behind icon. */
  iconBg: string;
  /** Icon foreground (rare — most icons are emoji and self-colored). */
  iconFg: string;
}

const TOKENS: Record<ToastVariant, VariantTokens> = {
  success: {
    stripe: "bg-leaf-500",
    ring:   "ring-leaf-500/20 dark:ring-leaf-500/30",
    iconBg: "bg-leaf-500/15",
    iconFg: "text-leaf-600 dark:text-leaf-500",
  },
  error: {
    stripe: "bg-rose-500",
    ring:   "ring-rose-300/40 dark:ring-rose-500/30",
    iconBg: "bg-rose-500/15",
    iconFg: "text-rose-600 dark:text-rose-300",
  },
  warning: {
    stripe: "bg-amber-500",
    ring:   "ring-amber-300/40 dark:ring-amber-500/30",
    iconBg: "bg-amber-500/15",
    iconFg: "text-amber-700 dark:text-amber-300",
  },
  info: {
    stripe: "bg-accent-500",
    ring:   "ring-accent-300/40 dark:ring-accent-500/30",
    iconBg: "bg-accent-500/15",
    iconFg: "text-accent-600 dark:text-accent-300",
  },
  loading: {
    stripe: "bg-lilac-500",
    ring:   "ring-lilac-400/40 dark:ring-lilac-500/30",
    iconBg: "bg-lilac-500/15",
    iconFg: "text-lilac-600 dark:text-lilac-400",
  },
};

// ----------------------------------------------------------------------
// Viewport
// ----------------------------------------------------------------------

/**
 * Top-center viewport. Mounted once at app root via Providers. Stays out of
 * the way until at least one toast exists; supports up to MAX_VISIBLE
 * stacked toasts. Above modals (z-[100]).
 */
export function ToastViewport() {
  const items = useToastStore((s) => s.items);

  // Container intentionally render-always — keeps aria-live region stable so
  // screen readers don't get re-attached. Pointer-events disabled when empty.
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      role="region"
      aria-label="Notifikasi"
      className={cn(
        "fixed left-1/2 z-[100] -translate-x-1/2 px-3 sm:px-0",
        // Top-center, safe-area aware (PRD PART 1)
        "top-[calc(env(safe-area-inset-top,0px)+16px)]",
        // Mobile: full-width minus padding, capped at 420px
        // Desktop (sm+): 440px max
        "w-[calc(100%-24px)] max-w-[420px] sm:max-w-[440px]",
        items.length === 0 && "pointer-events-none",
      )}
    >
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <ToastCard key={t.id} item={t} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

// ----------------------------------------------------------------------
// Individual toast card
// ----------------------------------------------------------------------

function ToastCard({ item }: { item: ToastItem }) {
  const remove = useToastStore((s) => s.remove);
  const tokens = TOKENS[item.variant];

  // Auto-dismiss timer. Re-armed if the item's duration changes (e.g. a
  // loading toast was upgraded to success/error via notify.update).
  useEffect(() => {
    if (item.duration <= 0) return;
    const t = setTimeout(() => remove(item.id), item.duration);
    return () => clearTimeout(t);
  }, [item.id, item.duration, remove]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      // Reduced motion is honored by framer-motion globally via the user's
      // OS-level prefers-reduced-motion. As an extra guard we also clamp
      // scale/translate via CSS-level rule below.
      className={cn(
        "pointer-events-auto relative overflow-hidden",
        "rounded-notebook border border-paper-200 bg-white/95 backdrop-blur",
        "shadow-notebook-md ring-1",
        tokens.ring,
        "dark:border-ink-700 dark:bg-ink-800/95",
      )}
    >
      {/* left accent strip */}
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", tokens.stripe)}
      />

      <div className="flex items-start gap-3 px-3.5 py-3 pl-4 pr-2">
        {/* icon bubble */}
        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base",
            tokens.iconBg,
            tokens.iconFg,
          )}
        >
          {item.variant === "loading" ? <Spinner /> : <span>{item.icon}</span>}
        </span>

        {/* content */}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="break-words text-sm font-semibold leading-snug text-ink-800 dark:text-paper-50">
            {item.title}
          </p>
          {item.message ? (
            <p className="mt-0.5 break-words text-xs leading-relaxed text-ink-700 dark:text-paper-50/80">
              {item.message}
            </p>
          ) : null}

          {item.action ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  item.action?.onClick();
                  remove(item.id);
                }}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  "bg-paper-100 text-ink-800 hover:bg-paper-200",
                  "dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600",
                )}
              >
                {item.action.label}
              </button>
            </div>
          ) : null}
        </div>

        {/* close button */}
        <button
          type="button"
          aria-label="Tutup notifikasi"
          onClick={() => remove(item.id)}
          className={cn(
            "shrink-0 rounded-full p-1 text-ink-400 transition-colors",
            "hover:bg-paper-100 hover:text-ink-700",
            "dark:hover:bg-ink-700 dark:hover:text-paper-50",
          )}
        >
          <CloseIcon />
        </button>
      </div>
    </motion.li>
  );
}

// ----------------------------------------------------------------------
// Tiny inline icons (no extra deps)
// ----------------------------------------------------------------------

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 3l8 8M11 3l-8 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      role="presentation"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        // Reduced motion — fallback to opacity pulse handled in globals.css
        "motion-reduce:animate-pulse motion-reduce:border-t-current",
      )}
    />
  );
}

// ----------------------------------------------------------------------
// Legacy compatibility shim
// ----------------------------------------------------------------------

/**
 * @deprecated Use `notify.success/error/warning/info/loading` from `@/lib/toast`.
 * Kept so any not-yet-migrated call site still renders correctly.
 */
export function toast(
  message: string,
  tone: "info" | "success" | "error" | "warning" = "info",
): void {
  toastStore.add({
    variant: tone,
    title: message,
  });
}
