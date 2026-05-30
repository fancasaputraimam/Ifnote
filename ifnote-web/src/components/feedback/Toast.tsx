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
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  AlertToolbar,
} from "@/components/ui/alert-1";
import LoaderGrid from "@/components/ui/loader-grid";
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
// Variant → Alert variant mapping
// ----------------------------------------------------------------------
//
// Setiap jenis notifikasi memakai warna Alert-nya sendiri (sesuai
// komponen Alert yang diminta): success=hijau, error=merah,
// warning=amber, info=biru-accent, loading=primary. Ini membuat
// notifikasi terlihat jelas berbeda per jenis, bukan netral seragam.

const VARIANT_TO_ALERT: Record<
  ToastVariant,
  "primary" | "success" | "destructive" | "info" | "warning"
> = {
  success: "success",
  error: "destructive",
  warning: "warning",
  info: "info",
  loading: "primary",
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
      className="pointer-events-auto"
    >
      <Alert
        role={item.variant === "error" ? "alert" : "status"}
        variant={VARIANT_TO_ALERT[item.variant]}
        appearance="light"
        close
        onClose={() => remove(item.id)}
        className="shadow-notebook-md"
      >
        <AlertIcon>
          {item.variant === "loading" ? (
            <LoaderGrid label={item.title} className="text-[0.4rem]" />
          ) : (
            <span>{item.icon}</span>
          )}
        </AlertIcon>
        <AlertContent>
          <AlertTitle>{item.title}</AlertTitle>
          {item.message ? (
            <AlertDescription>{item.message}</AlertDescription>
          ) : null}
          {item.action ? (
            <AlertToolbar>
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
            </AlertToolbar>
          ) : null}
        </AlertContent>
      </Alert>
    </motion.li>
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
