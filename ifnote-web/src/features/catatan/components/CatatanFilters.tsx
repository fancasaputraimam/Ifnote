"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ActionSearchBar, type SearchAction } from "@/components/ui/action-search-bar";
import type { JlptLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  level: JlptLevel | null;
  setLevel: (v: JlptLevel | null) => void;
  /** Saran live (kotoba/bunpou yang sudah dimuat) untuk dropdown search. */
  suggestions?: SearchAction[];
}

const LEVELS: {
  value: JlptLevel;
  label: string;
  jp: string;
  stamp: string;
  activeRow: string;
}[] = [
  {
    value: "N5",
    label: "Pemula",
    jp: "にゅうもん",
    stamp:
      "bg-leaf-50 text-leaf-700 ring-leaf-200 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/30",
    activeRow: "bg-leaf-50/60 dark:bg-leaf-500/10",
  },
  {
    value: "N4",
    label: "Dasar",
    jp: "きそ",
    stamp:
      "bg-accent-50 text-accent-700 ring-accent-200 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30",
    activeRow: "bg-accent-50/60 dark:bg-accent-500/10",
  },
  {
    value: "N3",
    label: "Menengah",
    jp: "ちゅうきゅう",
    stamp:
      "bg-lilac-50 text-lilac-700 ring-lilac-200 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/30",
    activeRow: "bg-lilac-50/60 dark:bg-lilac-500/10",
  },
  {
    value: "N2",
    label: "Mahir",
    jp: "じょうきゅう",
    stamp:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
    activeRow: "bg-amber-50/60 dark:bg-amber-500/10",
  },
  {
    value: "N1",
    label: "Ahli",
    jp: "たつじん",
    stamp:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30",
    activeRow: "bg-rose-50/60 dark:bg-rose-500/10",
  },
];

/**
 * Catatan filter — search + level JLPT (Sumi & Washi).
 *
 * Tombol filter berbentuk stempel hanko 級 ("kyuu"/tingkat) yang miring
 * dan menegak saat dibuka; dropdown-nya kertas washi dengan garis margin
 * merah, tiap level jadi baris stempel berwarna khas JLPT (N5 matcha →
 * N1 rose). Filter TIPE (Kotoba/Bunpou) tetap di card SummaryRow.
 */
export function CatatanFilters({
  search,
  setSearch,
  level,
  setLevel,
  suggestions = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const hasActiveFilter = level !== null;
  const activeLevel = LEVELS.find((l) => l.value === level) ?? null;

  // Close panel when clicking outside (mobile-friendly).
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const selectLevel = (lv: JlptLevel) => {
    setLevel(level === lv ? null : lv);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* Search + filter toggle row */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ActionSearchBar
            query={search}
            onQueryChange={setSearch}
            actions={suggestions}
            onSelect={(a) => setSearch(a.label)}
            placeholder="Cari kotoba atau bunpou…"
            hint="Pilih untuk memfilter"
          />
        </div>
        {/* tombol filter — stempel hanko 級 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Tutup filter level" : "Buka filter level JLPT"}
          className={cn(
            "relative grid h-11 w-11 shrink-0 place-items-center rounded-[12px] font-serif text-lg ring-1 ring-inset transition-all duration-200",
            "active:scale-90 motion-reduce:active:scale-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
            open
              ? "rotate-0 bg-accent-gradient text-white shadow-glow-sm ring-transparent"
              : hasActiveFilter
                ? "-rotate-3 bg-accent-50 text-accent-600 ring-accent-200 hover:rotate-0 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30"
                : "-rotate-3 bg-white text-ink-500 ring-paper-300 hover:rotate-0 hover:bg-paper-100 hover:text-ink-800 dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700 dark:hover:bg-ink-700",
          )}
        >
          <span aria-hidden>級</span>
          {hasActiveFilter && !open ? (
            <span
              aria-hidden
              className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-accent-gradient text-[8px] font-sans font-bold not-italic text-white shadow-glow-sm"
            >
              {level?.slice(1)}
            </span>
          ) : null}
        </button>
      </div>

      {/* Active filter pill */}
      {hasActiveFilter && activeLevel ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-400">Level aktif:</span>
          <ActivePill onClear={() => setLevel(null)}>
            {activeLevel.value} · {activeLevel.label}
          </ActivePill>
        </div>
      ) : null}

      {/* Dropdown level — kertas washi bergaris margin merah */}
      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
            style={{ transformOrigin: "top" }}
            className={cn(
              "absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-notebook bg-white/95 shadow-notebook-md ring-1 ring-inset ring-paper-200/90 backdrop-blur-sm",
              "dark:bg-ink-800/95 dark:ring-ink-700",
            )}
            role="listbox"
            aria-label="Filter level JLPT"
          >
            {/* header washi */}
            <div className="relative overflow-hidden border-b border-paper-200 bg-paper-100/80 px-3 py-2.5 dark:border-ink-700 dark:bg-ink-900/50">
              <span aria-hidden className="absolute inset-y-1.5 left-2 w-px bg-accent-500/25" />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-1 -top-2 select-none font-jp text-3xl leading-none text-ink-800/[0.05] dark:text-paper-50/[0.05]"
              >
                級
              </span>
              <div className="relative flex items-center justify-between pl-2">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden className="h-1 w-1 rounded-full bg-accent-500" />
                  <span className="font-jp text-[10px] tracking-[0.28em] text-accent-600 dark:text-accent-400">
                    レベル
                  </span>
                  <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">
                    JLPT
                  </span>
                </div>
                {hasActiveFilter ? (
                  <button
                    type="button"
                    onClick={() => setLevel(null)}
                    className="text-[11px] font-medium text-ink-400 underline-offset-2 hover:text-accent-600 hover:underline dark:hover:text-accent-300"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>

            <ul className="p-1.5">
              {LEVELS.map((lv, i) => {
                const active = level === lv.value;
                return (
                  <motion.li
                    key={lv.value}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut", delay: i * 0.03 }}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => selectLevel(lv.value)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
                        active
                          ? lv.activeRow
                          : "hover:bg-paper-100 dark:hover:bg-ink-700/60",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-[8px] font-serif text-xs font-bold ring-1 ring-inset transition-transform duration-200",
                          active ? "rotate-0" : "-rotate-3 group-hover:rotate-0",
                          lv.stamp,
                        )}
                      >
                        {lv.value}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block leading-tight text-ink-800 dark:text-paper-50">
                          {lv.label}
                        </span>
                        <span className="block font-jp text-[10px] tracking-[0.18em] text-ink-400/70">
                          {lv.jp}
                        </span>
                      </span>
                      {active ? (
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                        />
                      ) : null}
                    </button>
                  </motion.li>
                );
              })}
            </ul>

            {/* kaki dropdown */}
            <div
              aria-hidden
              className="select-none border-t border-paper-200 px-3 py-1.5 text-center font-jp text-[9px] tracking-[0.3em] text-ink-300 dark:border-ink-700 dark:text-ink-600"
            >
              いっぽずつ、うえへ
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* -- subcomponents ----------------------------------------------------- */

function ActivePill({ children, onClear }: { children: ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 py-1 pl-2.5 pr-1.5 font-medium text-accent-700 ring-1 ring-inset ring-accent-200/70 dark:bg-accent-700/20 dark:text-accent-200 dark:ring-accent-400/25">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
      <button
        type="button"
        onClick={onClear}
        aria-label="Hapus filter level"
        className="grid h-4 w-4 place-items-center rounded-full bg-white/70 text-[10px] leading-none text-accent-700 transition-colors hover:bg-white dark:bg-ink-800/60 dark:text-accent-200 dark:hover:bg-ink-800"
      >
        ×
      </button>
    </span>
  );
}
