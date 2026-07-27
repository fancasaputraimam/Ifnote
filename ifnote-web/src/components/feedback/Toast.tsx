"use client";

/**
 * ifNote Toast / Notification system (Sumi & Washi).
 *
 * Design rules:
 *  - position fixed top-center, above modals (z-[100]), safe-area aware
 *  - kartu washi: putih semi-transparan + blur, hairline, shadow notebook
 *  - stempel kanji miring per jenis: ○ sukses, ✕ error, 注 warning,
 *    報 info, ensō berputar untuk loading (icon override tetap dihormati)
 *  - progress bar sisa waktu di dasar kartu, PAUSE saat kursor di atasnya
 *  - lima varian: success / error / warning / info / loading
 *  - max 3 visible; toast loading tidak pernah tergusur oleh cap
 *  - dark-mode compatible
 *
 * Public API: import { notify } from "@/lib/toast"
 */

import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
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
  /** Optional emoji/icon override. Defaults to variant's kanji stamp. */
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

/** Stempel kanji default per jenis — gaya maru/batsu ala Jepang. */
const DEFAULT_ICON: Record<ToastVariant, string> = {
  success: "○",
  error:   "✕",
  warning: "注",
  info:    "報",
  loading: "", // dirender sebagai ensō berputar
};

const DEFAULT_DURATION: Record<ToastVariant, number> = {
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
      const next = [...s.items, item];
      if (next.length > MAX_VISIBLE) {
        // Gusur yang tertua TAPI jangan toast persisten (loading, duration 0)
        // — dulu loading toast bisa hilang tergusur sebelum sempat di-update.
        const evictIdx = next.findIndex((t) => t.duration > 0);
        next.splice(evictIdx === -1 ? 0 : evictIdx, 1);
      }
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
// Variant styling — warna hanya di stempel + progress bar
// ----------------------------------------------------------------------

const STAMP: Record<ToastVariant, string> = {
  success:
    "bg-leaf-50 text-leaf-600 ring-leaf-200 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/30",
  error:
    "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30",
  warning:
    "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
  info:
    "bg-lilac-50 text-lilac-600 ring-lilac-200 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/30",
  loading:
    "bg-accent-50 text-accent-600 ring-accent-200 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30",
};

const BAR: Record<ToastVariant, string> = {
  success: "bg-leaf-500",
  error: "bg-rose-500",
  warning: "bg-amber-400",
  info: "bg-lilac-500",
  loading: "bg-accent-500",
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
        "top-[calc(env(safe-area-inset-top,0px)+16px)]",
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
  const [paused, setPaused] = useState(false);
  /** Sisa waktu hidup (dibekukan saat hover). */
  const remainingRef = useRef(item.duration);
  const armedAtRef = useRef(0);
  /** Restart progress bar saat toast di-upgrade (loading → success dll). */
  const [progressKey, setProgressKey] = useState(0);

  // Re-init saat identitas waktu berubah (upgrade varian / duration baru).
  useEffect(() => {
    remainingRef.current = item.duration;
    setProgressKey((k) => k + 1);
    setPaused(false);
  }, [item.id, item.duration, item.variant]);

  // Timer auto-dismiss dengan dukungan pause: cleanup membekukan sisa
  // waktu, re-arm memakai sisa itu — hover = berhenti, leave = lanjut.
  useEffect(() => {
    if (item.duration <= 0 || paused) return;
    armedAtRef.current = Date.now();
    const t = setTimeout(() => remove(item.id), remainingRef.current);
    return () => {
      clearTimeout(t);
      remainingRef.current = Math.max(
        0,
        remainingRef.current - (Date.now() - armedAtRef.current),
      );
    };
  }, [paused, item.id, item.duration, item.variant, remove]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      className="pointer-events-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        role={item.variant === "error" ? "alert" : "status"}
        className="relative overflow-hidden rounded-notebook bg-white/95 shadow-notebook-md ring-1 ring-inset ring-paper-200/90 backdrop-blur-sm dark:bg-ink-800/95 dark:ring-ink-700"
      >
        <div className="flex items-start gap-3 px-3.5 py-3">
          {/* stempel jenis notifikasi */}
          <span
            aria-hidden
            className={cn(
              "grid h-9 w-9 shrink-0 -rotate-3 place-items-center rounded-[9px] font-serif text-base ring-1 ring-inset",
              STAMP[item.variant],
            )}
          >
            {item.variant === "loading" ? <MiniEnso /> : item.icon}
          </span>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold leading-snug text-ink-800 dark:text-paper-50">
              {item.title}
            </p>
            {item.message ? (
              <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{item.message}</p>
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
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                    "bg-paper-100 text-ink-800 ring-paper-200 hover:bg-paper-200",
                    "dark:bg-ink-700 dark:text-paper-50 dark:ring-ink-600 dark:hover:bg-ink-600",
                  )}
                >
                  {item.action.label}
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => remove(item.id)}
            aria-label="Tutup notifikasi"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-paper-100 hover:text-ink-700 dark:hover:bg-ink-700 dark:hover:text-paper-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        {/* progress sisa waktu — berhenti saat hover */}
        {item.duration > 0 ? (
          <span
            key={progressKey}
            aria-hidden
            className={cn("absolute bottom-0 left-0 block h-0.5", BAR[item.variant])}
            style={{
              animation: `ifnote-toast-progress ${item.duration}ms linear forwards`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        ) : null}
      </div>
    </motion.li>
  );
}

/** Ensō mini berputar untuk toast loading. */
function MiniEnso() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="h-5 w-5 animate-[spin_1.6s_linear_infinite]"
      aria-hidden
    >
      <circle
        cx="24"
        cy="24"
        r="19"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="96 24"
      />
    </svg>
  );
}
