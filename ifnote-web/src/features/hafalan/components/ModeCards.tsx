"use client";

import { NotebookCard } from "@/components/ui/NotebookCard";
import { cn } from "@/lib/utils";
import type { HafalanMode } from "@/lib/types";

interface Props {
  mode: HafalanMode;
  onChange: (m: HafalanMode) => void;
}

const MODES: Array<{ key: HafalanMode; label: string; icon: string; hint: string; tone: string }> = [
  { key: "kotoba", label: "Kotoba",   icon: "📖", hint: "kosakata saja",   tone: "text-accent-600 dark:text-accent-300" },
  { key: "bunpou", label: "Bunpou",   icon: "📐", hint: "tata bahasa",     tone: "text-lilac-600  dark:text-lilac-400" },
  { key: "mixed",  label: "Mixed",    icon: "🎲", hint: "campur semua",    tone: "text-leaf-600   dark:text-leaf-500" },
  { key: "weak",   label: "Weak Only", icon: "⚠️", hint: "yang sering salah", tone: "text-rose-600   dark:text-rose-400" },
];

export function ModeCards({ mode, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MODES.map((m) => {
        const active = mode === m.key;
        return (
          <button
            type="button"
            key={m.key}
            onClick={() => onChange(m.key)}
            aria-pressed={active}
            className={cn(
              "rounded-notebook border bg-white p-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
              "dark:bg-ink-800",
              active
                ? "border-accent-500 shadow-notebook ring-1 ring-accent-300 dark:border-accent-400"
                : "border-paper-200 hover:bg-paper-50 dark:border-ink-700 dark:hover:bg-ink-700",
            )}
          >
            <div className="flex items-center justify-between">
              <span aria-hidden className="text-xl">{m.icon}</span>
              {active ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-600 dark:text-accent-300">
                  Aktif
                </span>
              ) : null}
            </div>
            <div className={cn("mt-1 text-sm font-semibold", m.tone)}>{m.label}</div>
            <div className="text-[11px] text-ink-400">{m.hint}</div>
          </button>
        );
      })}
    </div>
  );
}
