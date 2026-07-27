"use client";

import { cn } from "@/lib/utils";
import type { QuizType } from "@/lib/types";

interface Props {
  type: QuizType;
  onChange: (t: QuizType) => void;
  disabled?: boolean;
}

/**
 * Quiz type cards (Sumi & Washi) — stempel kana 言/文/作, seirama pemilih
 * di Catatan & Hafalan. Tipe legacy `mixed`/`ai` tetap ada di backend agar
 * tidak memecah data lama, tapi tidak diekspos di UI.
 */
const TYPES = [
  { key: "kotoba", kana: "言", label: "Kotoba", hint: "kosakata", jp: "ことば" },
  { key: "bunpou", kana: "文", label: "Bunpou", hint: "tata bahasa", jp: "ぶんぽう" },
  { key: "sakubun", kana: "作", label: "Sakubun", hint: "karangan AI", jp: "さくぶん" },
] as const;

const TONE: Record<
  (typeof TYPES)[number]["key"],
  { stamp: string; activeRing: string; dot: string }
> = {
  kotoba: {
    stamp:
      "bg-accent-50 text-accent-600 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25",
    activeRing: "ring-accent-400 dark:ring-accent-500",
    dot: "bg-accent-500",
  },
  bunpou: {
    stamp:
      "bg-lilac-50 text-lilac-600 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/25",
    activeRing: "ring-lilac-400 dark:ring-lilac-500",
    dot: "bg-lilac-500",
  },
  sakubun: {
    stamp:
      "bg-amber-50 text-amber-600 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/25",
    activeRing: "ring-amber-400 dark:ring-amber-500",
    dot: "bg-amber-500",
  },
};

export function QuizTypeCards({ type, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3">
      {TYPES.map((t) => {
        const tone = TONE[t.key];
        const active = type === t.key;
        return (
          <button
            key={t.key}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(t.key)}
            className={cn(
              "group relative overflow-hidden rounded-notebook bg-white p-3 text-left shadow-notebook transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:shadow-notebook-md disabled:pointer-events-none disabled:opacity-60 dark:bg-ink-800 sm:p-3.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 dark:focus-visible:ring-offset-paper-900",
              active
                ? cn("ring-2 ring-inset", tone.activeRing)
                : "ring-1 ring-inset ring-paper-200/90 dark:ring-ink-700",
            )}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-3 -right-1 select-none font-jp text-5xl leading-none text-ink-800/[0.04] transition-transform duration-300 group-hover:scale-110 dark:text-paper-50/[0.04]"
            >
              {t.kana}
            </span>
            {active ? (
              <span
                aria-hidden
                className={cn("absolute right-2.5 top-2.5 h-2 w-2 rounded-full", tone.dot)}
              />
            ) : null}

            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
              <span
                aria-hidden
                className={cn(
                  "grid h-9 w-9 shrink-0 -rotate-3 place-items-center rounded-[10px] font-serif text-sm ring-1 ring-inset transition-transform duration-200 group-hover:rotate-0 sm:h-10 sm:w-10 sm:text-base",
                  active && "rotate-0",
                  tone.stamp,
                )}
              >
                {t.kana}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink-800 dark:text-paper-50">
                  {t.label}
                </div>
                <div className="truncate text-xs text-ink-400">
                  {t.hint} · <span className="font-jp">{t.jp}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
