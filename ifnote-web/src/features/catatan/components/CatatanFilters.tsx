"use client";

import { ButtonHTMLAttributes, ReactNode, useEffect, useId, useRef, useState } from "react";
import { ActionSearchBar, type SearchAction } from "@/components/ui/action-search-bar";
import type { CatatanFilterType } from "@/features/catatan/useCatatan";
import type { JlptLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  type: CatatanFilterType;
  setType: (v: CatatanFilterType) => void;
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

const TYPE_OPTIONS: { value: CatatanFilterType; icon: string; label: string }[] = [
  { value: "all", icon: "※", label: "Semua" },
  { value: "kotoba", icon: "📖", label: "Kotoba" },
  { value: "bunpou", icon: "📐", label: "Bunpou" },
];

/**
 * Catatan filter — search + tipe + JLPT level only.
 *
 * Status filter (Weak/Review/Baru/Lainnya) sengaja dihapus per task spec
 * PART 2. Mastery info masih tampil di tiap row, tapi tidak lagi
 * dipakai untuk memfilter list.
 */
export function CatatanFilters({
  search,
  setSearch,
  type,
  setType,
  level,
  setLevel,
  suggestions = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const hasActiveFilter = type !== "all" || level !== null;

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

  const resetAll = () => {
    setType("all");
    setLevel(null);
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
          aria-label={open ? "Tutup filter" : "Buka filter"}
          className={cn(
            "relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
            open
              ? "border-accent-500 bg-accent-500 text-white"
              : "border-paper-200 bg-white text-ink-700 hover:bg-paper-100 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50 dark:hover:bg-ink-700",
          )}
        >
          <span aria-hidden className="text-base leading-none">☷</span>
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
          <span className="text-ink-400">Filter aktif:</span>
          {type !== "all" ? (
            <ActivePill onClear={() => setType("all")}>
              {type === "kotoba" ? "Kotoba" : "Bunpou"}
            </ActivePill>
          ) : null}
          {level ? (
            <ActivePill onClear={() => setLevel(null)}>{level}</ActivePill>
          ) : null}
          <button
            type="button"
            onClick={resetAll}
            className="ml-auto text-ink-400 underline-offset-4 hover:text-ink-700 hover:underline dark:hover:text-paper-50"
          >
            Reset semua
          </button>
        </div>
      ) : null}

      {/* Filter panel */}
      <div
        id={panelId}
        hidden={!open}
        className={cn(
          "absolute left-0 right-0 z-20 mt-1 origin-top overflow-hidden rounded-notebook border border-paper-200 bg-gradient-to-b from-white to-paper-100 shadow-notebook-md",
          "dark:border-ink-700 dark:from-ink-800 dark:to-ink-700",
        )}
        role="dialog"
        aria-label="Filter Catatan"
      >
        <div className="flex items-start justify-between gap-3 border-b border-paper-200 px-4 py-3 dark:border-ink-700">
          <div>
            <div className="text-sm font-semibold text-ink-800 dark:text-paper-50">Filter Catatan</div>
            <div className="mt-0.5 text-[11px] text-ink-400">
              Pilih tipe atau level JLPT.
            </div>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="shrink-0 rounded-full border border-paper-200 bg-paper-50 px-3 py-1 text-xs font-medium text-ink-400 transition-colors hover:bg-accent-50 hover:text-accent-700 dark:border-ink-700 dark:bg-ink-900/30 dark:hover:bg-accent-700/20 dark:hover:text-accent-200"
          >
            Reset
          </button>
        </div>

        <FilterGroup label="Tipe">
          {TYPE_OPTIONS.map((opt) => (
            <FilterOption
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              active={type === opt.value}
              onClick={() => setType(opt.value)}
            />
          ))}
        </FilterGroup>

        <FilterGroup label="JLPT Level" last>
          {LEVELS.map((lv) => (
            <FilterOption
              key={lv.value}
              icon={lv.value}
              label={lv.label}
              active={level === lv.value}
              onClick={() => setLevel(level === lv.value ? null : lv.value)}
            />
          ))}
        </FilterGroup>
      </div>
    </div>
  );
}

/* -- subcomponents ----------------------------------------------------- */

function FilterGroup({
  label,
  last,
  children,
}: {
  label: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "px-4 pb-3 pt-3",
        !last && "border-b border-paper-200 dark:border-ink-700",
      )}
    >
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">
        {label}
      </div>
      <div className="grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4">{children}</div>
    </div>
  );
}

interface FilterOptionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
  active?: boolean;
}

function FilterOption({ icon, label, active, className, ...rest }: FilterOptionProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-xl border bg-white px-2 py-2.5 text-center text-[11.5px] font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
        active
          ? "border-accent-500 bg-accent-50 text-accent-700 shadow-[0_0_0_2px_rgba(94,110,224,0.18)] dark:bg-accent-700/30 dark:text-accent-200"
          : "border-paper-200 text-ink-700 hover:-translate-y-0.5 hover:border-accent-200 hover:bg-accent-50 hover:text-accent-700 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50 dark:hover:bg-accent-700/20",
        className,
      )}
      aria-pressed={active}
      {...rest}
    >
      <span
        aria-hidden
        className={cn(
          "grid h-7 w-7 place-items-center rounded-lg font-jp text-[13px] font-bold transition-colors",
          active
            ? "bg-accent-500 text-white"
            : "bg-paper-100 text-ink-700 dark:bg-ink-700 dark:text-paper-50",
        )}
      >
        {icon}
      </span>
      <span className="leading-tight">{label}</span>
    </button>
  );
}

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
