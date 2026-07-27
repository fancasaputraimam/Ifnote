"use client";

import { ReactNode } from "react";
import { StudyCard, type StudyCardTone } from "./StudyCard";
import { cn } from "@/lib/utils";

interface StudyMetricCardProps {
  /** Angka utama (e.g. 128). */
  value: number | string;
  /** Label di bawah angka. */
  label: string;
  /** Icon optional di pojok atas. */
  icon?: ReactNode;
  tone?: StudyCardTone;
  /** Buat card clickable. */
  onClick?: () => void;
  className?: string;
}

/**
 * Compact metric card untuk grid summary di Home/Catatan.
 *
 * Pakai layout vertikal (icon kecil di top, angka besar tengah, label
 * di bawah) supaya rapat di grid `grid-cols-2 sm:grid-cols-4`.
 */
export function StudyMetricCard({
  value,
  label,
  icon,
  tone = "accent",
  onClick,
  className,
}: StudyMetricCardProps) {
  return (
    <StudyCard
      tone={tone}
      compact
      hideLeftPanel
      onClick={onClick}
      className={cn("min-w-0", className)}
      title=""
    >
      <div className="flex items-start gap-2">
        {icon ? (
          <span className={cn("grid h-7 w-7 place-items-center rounded-lg text-sm", TONE_BG[tone])}>
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className={cn("text-xl font-semibold tabular-nums sm:text-2xl", TONE_TEXT[tone])}>
            {value}
          </div>
          <div className="mt-0.5 truncate text-[11px] uppercase tracking-wide text-ink-400">
            {label}
          </div>
        </div>
      </div>
    </StudyCard>
  );
}

const TONE_BG: Record<StudyCardTone, string> = {
  accent: "bg-accent-50 text-accent-700 dark:bg-accent-700/20 dark:text-accent-200",
  lilac: "bg-lilac-400/15 text-lilac-600 dark:bg-lilac-400/20 dark:text-lilac-400",
  leaf: "bg-leaf-500/15 text-leaf-600 dark:bg-leaf-500/20 dark:text-leaf-500",
  amber: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  rose: "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
  slate: "bg-paper-200 text-ink-700 dark:bg-ink-700 dark:text-paper-50",
};

const TONE_TEXT: Record<StudyCardTone, string> = {
  accent: "text-accent-600 dark:text-accent-300",
  lilac: "text-lilac-600 dark:text-lilac-400",
  leaf: "text-leaf-600 dark:text-leaf-500",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  slate: "text-ink-800 dark:text-paper-50",
};
