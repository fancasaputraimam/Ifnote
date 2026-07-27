"use client";

import { cn } from "@/lib/utils";
import type { CatatanFilterType } from "@/features/catatan/useCatatan";

interface Props {
  kotoba: number;
  bunpou: number;
  /** Tipe filter aktif. Card berfungsi sebagai pemilih tipe. */
  type: CatatanFilterType;
  setType: (v: CatatanFilterType) => void;
}

const CARDS = [
  { key: "kotoba", kana: "言", label: "Kotoba", sub: "kosakata", jp: "ことば" },
  { key: "bunpou", kana: "文", label: "Bunpou", sub: "tata bahasa", jp: "ぶんぽう" },
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
 * Catatan summary + pemilih tipe (Sumi & Washi). Dua kartu dengan stempel
 * kana 言/文, jumlah serif besar, dan cincin aksen saat aktif. Klik untuk
 * memfilter list per tipe, klik lagi (card aktif) untuk kembali ke "Semua".
 */
export function SummaryRow({ kotoba, bunpou, type, setType }: Props) {
  const counts = { kotoba, bunpou } as const;
  const toggle = (v: CatatanFilterType) => setType(type === v ? "all" : v);

  return (
    <div className="grid grid-cols-2 gap-2 sm:max-w-md sm:gap-3">
      {CARDS.map((c) => {
        const t = TONE[c.key];
        const active = type === c.key;
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(c.key)}
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
              {c.kana}
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
                  "grid h-10 w-10 shrink-0 -rotate-3 place-items-center rounded-[10px] font-serif text-base ring-1 ring-inset",
                  t.stamp,
                )}
              >
                {c.kana}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className={cn("font-serif text-xl font-semibold leading-none tabular-nums", t.count)}>
                    {counts[c.key]}
                  </span>
                  <span className="truncate text-sm font-medium text-ink-800 dark:text-paper-50">
                    {c.label}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-ink-400">
                  {c.sub} · <span className="font-jp">{c.jp}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
