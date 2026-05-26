"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastStore {
  items: ToastItem[];
  push: (message: string, tone?: Tone) => void;
  remove: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (message, tone = "info") =>
    set((s) => ({ items: [...s.items, { id: nextId++, message, tone }] })),
  remove: (id) =>
    set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export function toast(message: string, tone?: Tone) {
  useToastStore.getState().push(message, tone);
}

export function ToastViewport() {
  const items = useToastStore((s) => s.items);
  const remove = useToastStore((s) => s.remove);

  // Auto-dismiss
  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map((t) => setTimeout(() => remove(t.id), 4000));
    return () => timers.forEach(clearTimeout);
  }, [items, remove]);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-notebook border px-4 py-3 text-sm shadow-notebook-md",
            t.tone === "info" && "bg-white border-paper-200 text-ink-800 dark:bg-ink-800 dark:border-ink-700 dark:text-paper-50",
            t.tone === "success" && "bg-leaf-500/10 border-leaf-500/30 text-leaf-600 dark:text-leaf-500",
            t.tone === "error" && "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-700/20 dark:border-rose-700 dark:text-rose-200",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
