"use client";

import { cn } from "@/lib/utils";
import { AI_MODES } from "../modes";
import type { AiMode } from "../types";

interface Props {
  mode: AiMode;
  onChange: (m: AiMode) => void;
  disabled?: boolean;
}

export function AiModeCards({ mode, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {AI_MODES.map((m) => {
        const active = mode === m.key;
        return (
          <button
            type="button"
            key={m.key}
            onClick={() => onChange(m.key)}
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
              <span aria-hidden className="text-xl">{m.icon}</span>
              {active ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-600 dark:text-accent-300">
                  Aktif
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-sm font-semibold text-ink-800 dark:text-paper-50">
              {m.title}
            </div>
            <div className="text-[11px] text-ink-400">{m.subtitle}</div>
          </button>
        );
      })}
    </div>
  );
}
