"use client";

import { cn } from "@/lib/utils";
import type { QuizType } from "@/lib/types";

interface Props {
  type: QuizType;
  onChange: (t: QuizType) => void;
  disabled?: boolean;
}

const TYPES: Array<{ key: QuizType; label: string; icon: string; hint: string; tone: string }> = [
  { key: "kotoba", label: "Kotoba",       icon: "📖", hint: "kosakata",         tone: "text-accent-600 dark:text-accent-300" },
  { key: "bunpou", label: "Bunpou",       icon: "📐", hint: "tata bahasa",      tone: "text-lilac-600  dark:text-lilac-400"  },
  { key: "mixed",  label: "Mixed",        icon: "🎲", hint: "campur",            tone: "text-leaf-600   dark:text-leaf-500"   },
  { key: "ai",     label: "AI Generated", icon: "🤖", hint: "soal dari AI",      tone: "text-amber-600  dark:text-amber-400"  },
];

export function QuizTypeCards({ type, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TYPES.map((t) => {
        const active = type === t.key;
        return (
          <button
            type="button"
            key={t.key}
            onClick={() => onChange(t.key)}
            disabled={disabled}
            aria-pressed={active}
            className={cn(
              "rounded-notebook border bg-white p-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "dark:bg-ink-800",
              active
                ? "border-accent-500 shadow-notebook ring-1 ring-accent-300 dark:border-accent-400"
                : "border-paper-200 hover:bg-paper-50 dark:border-ink-700 dark:hover:bg-ink-700",
            )}
          >
            <div className="flex items-center justify-between">
              <span aria-hidden className="text-xl">{t.icon}</span>
              {active ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-600 dark:text-accent-300">
                  Aktif
                </span>
              ) : null}
            </div>
            <div className={cn("mt-1 text-sm font-semibold", t.tone)}>{t.label}</div>
            <div className="text-[11px] text-ink-400">{t.hint}</div>
          </button>
        );
      })}
    </div>
  );
}
