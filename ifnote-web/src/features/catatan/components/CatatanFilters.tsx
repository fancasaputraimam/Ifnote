"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
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

const LEVELS: { value: JlptLevel; label: string }[] = [
  { value: "N5", label: "Pemula" },
  { value: "N4", label: "Dasar" },
  { value: "N3", label: "Menengah" },
  { value: "N2", label: "Lanjut" },
  { value: "N1", label: "Mahir" },
];

/**
 * Catatan filter — search + JLPT level.
 *
 * Filter TIPE (Kotoba/Bunpou) dipindah ke card Kotoba/Bunpou (SummaryRow)
 * yang sekarang clickable. Dropdown ini hanya berisi level JLPT (N5–N1),
 * ditampilkan sebagai daftar vertikal berjajar ke bawah dengan animasi.
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
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Tutup filter level" : "Buka filter level"}
          className={cn(
            "relative grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset transition-colors",
            "active:scale-90 motion-reduce:active:scale-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
            open
              ? "bg-accent-gradient text-white ring-transparent shadow-glow-sm"
              : "bg-white text-ink-600 ring-paper-300 hover:bg-paper-100 hover:text-ink-800 dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700 dark:hover:bg-ink-700",
          )}
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
          {hasActiveFilter ? (
            <span
              aria-hidden
              className={cn(
                "absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2",
                open ? "bg-white ring-accent-500" : "bg-lilac-500 ring-white dark:ring-ink-800",
              )}
            />
          ) : null}
        </button>
      </div>

      {/* Active filter pill */}
      {hasActiveFilter ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-400">Level aktif:</span>
          <ActivePill onClear={() => setLevel(null)}>{level}</ActivePill>
        </div>
      ) : null}

      {/* Filter panel — daftar level JLPT vertikal berjajar ke bawah */}
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
              "absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-notebook border border-paper-200 bg-white shadow-notebook-md",
              "dark:border-ink-700 dark:bg-ink-800",
            )}
            role="listbox"
            aria-label="Filter level JLPT"
          >
            <div className="flex items-center justify-between border-b border-paper-200 px-3 py-2 dark:border-ink-700">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">
                Level JLPT
              </span>
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
            <ul className="py-1">
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
                        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:bg-accent-50 dark:focus-visible:bg-accent-700/20",
                        active
                          ? "bg-accent-50 text-accent-700 dark:bg-accent-700/25 dark:text-accent-200"
                          : "text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-7 w-9 shrink-0 place-items-center rounded-lg font-jp text-xs font-bold",
                          active
                            ? "bg-accent-500 text-white"
                            : "bg-paper-100 text-ink-700 dark:bg-ink-700 dark:text-paper-50",
                        )}
                      >
                        {lv.value}
                      </span>
                      <span className="flex-1 leading-tight">{lv.label}</span>
                      {active ? (
                        <span aria-hidden className="text-accent-600 dark:text-accent-300">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* -- subcomponents ----------------------------------------------------- */

function ActivePill({ children, onClear }: { children: ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 font-medium text-accent-700 dark:bg-accent-700/20 dark:text-accent-200">
      {children}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Hapus filter ${children}`}
        className="grid h-4 w-4 place-items-center rounded-full bg-white/70 text-[10px] leading-none text-accent-700 hover:bg-white dark:bg-ink-800/60 dark:text-accent-200 dark:hover:bg-ink-800"
      >
        ×
      </button>
    </span>
  );
}
