"use client";

import { FilterButton } from "@/components/ui/FilterButton";
import { SearchInput } from "@/components/ui/SearchInput";
import type { CatatanFilterStatus, CatatanFilterType } from "@/features/catatan/useCatatan";
import type { JlptLevel } from "@/lib/types";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  type: CatatanFilterType;
  setType: (v: CatatanFilterType) => void;
  level: JlptLevel | null;
  setLevel: (v: JlptLevel | null) => void;
  status: CatatanFilterStatus;
  setStatus: (v: CatatanFilterStatus) => void;
}

const LEVELS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

const STATUS_LABEL: Record<CatatanFilterStatus, string> = {
  all: "Semua status",
  good: "Lancar",
  mid: "Mid",
  weak: "Weak",
  review: "Review",
  new: "Baru",
};

export function CatatanFilters({
  search,
  setSearch,
  type,
  setType,
  level,
  setLevel,
  status,
  setStatus,
}: Props) {
  return (
    <div className="space-y-3">
      <SearchInput
        placeholder="Cari kotoba atau bunpou…"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        onClear={() => setSearch("")}
      />

      {/* Type filters */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterButton active={type === "all"} onClick={() => setType("all")}>Semua</FilterButton>
        <FilterButton active={type === "kotoba"} onClick={() => setType("kotoba")}>Kotoba</FilterButton>
        <FilterButton active={type === "bunpou"} onClick={() => setType("bunpou")}>Bunpou</FilterButton>

        <span aria-hidden className="self-center px-1 text-ink-400">·</span>

        {LEVELS.map((lv) => (
          <FilterButton key={lv} active={level === lv} onClick={() => setLevel(level === lv ? null : lv)}>
            {lv}
          </FilterButton>
        ))}

        <span aria-hidden className="self-center px-1 text-ink-400">·</span>

        <FilterButton active={status === "weak"} onClick={() => setStatus(status === "weak" ? "all" : "weak")}>
          Weak
        </FilterButton>
        <FilterButton active={status === "review"} onClick={() => setStatus(status === "review" ? "all" : "review")}>
          Review
        </FilterButton>
        <FilterButton active={status === "new"} onClick={() => setStatus(status === "new" ? "all" : "new")}>
          Baru
        </FilterButton>
      </div>

      {/* Active label */}
      {(level || (status !== "all" && status !== "new")) ? (
        <p className="text-xs text-ink-400">
          Filter aktif:
          {level ? <span className="ml-1 font-medium text-ink-700 dark:text-paper-50">{level}</span> : null}
          {status !== "all" ? <span className="ml-1 font-medium text-ink-700 dark:text-paper-50">{STATUS_LABEL[status]}</span> : null}
        </p>
      ) : null}
    </div>
  );
}
