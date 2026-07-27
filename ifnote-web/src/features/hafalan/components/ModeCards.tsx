"use client";

import { cn } from "@/lib/utils";
import type { HafalanMode } from "@/lib/types";

interface Props {
  mode: HafalanMode;
  onChange: (m: HafalanMode) => void;
  /** Counts to display under the label. */
  kotobaCount?: number;
  bunpouCount?: number;
}

const MODES = [
  { key: "kotoba", kana: "言", label: "Kotoba", hint: "kosakata", jp: "ことば" },
  { key: "bunpou", kana: "文", label: "Bunpou", hint: "tata bahasa", jp: "ぶんぽう" },
] as const;

const TONE = {
  kotoba: {
    stamp:
      "bg-accent-50 text-accent-600 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25",
    count: "text-accent-700 dark:text-accent-200",
    activeRing: "ring-accent-400 dark:ring-accent-500",
    dot: "bg-accent-500",
  },
  bunpou: {
    stamp:
      "bg-lilac-50 text-lilac-600 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/25",
    count: "text-lilac-700 dark:text-lilac-300",
    activeRing: "ring-lilac-400 dark:ring-lilac-500",
    dot: "bg-lilac-500",
  },
} as const;

/**
 * Hafalan mode picker (Sumi & Washi) — kartu stempel kana 言/文 dengan
 * jumlah item serif, seirama SummaryRow di Catatan. Sengaja hanya
 * Kotoba & Bunpou (mixed/weak disembunyikan per task spec PART 5;
 * backend tetap menerimanya, frontend mengabaikan).
 */
export function ModeCards({ mode, onChange, kotobaCount, bunpouCount }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:max-w-md sm:gap-3">
      {MODES.map((m) => {
        const t = TONE[m.key];
        const active = mode === m.key;
        const count = m.key === "kotoba" ? kotobaCount : bunpouCount;
        return (
          <button
            key={m.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(m.key)}
            className={cn(
              "group relative overflow-hidden rounded-notebook bg-white p-3.5 text-left shadow-notebook transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:shadow-notebook-md dark:bg-ink-800",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 dark:focus-visible:ring-offset-paper-900",
              active
                ? cn("ring-2 ring-inset", t.activeRing)
                : "ring-1 ring-inset ring-paper-200/90 dark:ring-ink-700",
            )}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-3 -right-1 select-none font-jp text-5xl leading-none text-ink-800/[0.04] transition-transform duration-300 group-hover:scale-110 dark:text-paper-50/[0.04]"
            >
              {m.kana}
            </span>
            {active ? (
              <span
                aria-hidden
                className={cn("absolute right-2.5 top-2.5 h-2 w-2 rounded-full", t.dot)}
              />
            ) : null}

            <div className="relative flex items-center gap-2.5">
              <span
                aria-hidden
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] font-serif text-base ring-1 ring-inset transition-transform duration-200",
                  active ? "rotate-0" : "-rotate-3 group-hover:rotate-0",
                  t.stamp,
                )}
              >
                {m.kana}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  {typeof count === "number" ? (
                    <span
                      className={cn(
                        "font-serif text-xl font-semibold leading-none tabular-nums",
                        t.count,
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                  <span className="truncate text-sm font-medium text-ink-800 dark:text-paper-50">
                    {m.label}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-ink-400">
                  {m.hint} · <span className="font-jp">{m.jp}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
