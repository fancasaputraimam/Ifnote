"use client";

import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PanelCardTone = "accent" | "lilac" | "leaf" | "amber" | "rose" | "slate";

interface PanelCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Small uppercase label di atas judul, mis. "🧠 Memory Deck". */
  eyebrow?: ReactNode;
  /** Judul utama panel. */
  title?: ReactNode;
  /** Deskripsi pendek di bawah judul. */
  description?: ReactNode;
  /** Slot kanan di header (mis. tombol "Lihat semua"). */
  headerAction?: ReactNode;
  /** Tone aksen untuk eyebrow + optional top stripe. */
  tone?: PanelCardTone;
  /** Padding default. Set "none" untuk full-bleed (mis. wrapper tabel). */
  padding?: "default" | "compact" | "lg" | "none";
  /**
   * Tampilkan strip aksen tipis di tepi atas kartu — mengikuti gaya
   * NotebookCard.stripe sehingga tetap konsisten dengan komponen lama.
   */
  stripe?: boolean;
  /** Slot footer di bawah body (mis. tombol primer). */
  footer?: ReactNode;
  /** Hover lift halus tanpa harus clickable. */
  interactive?: boolean;
  /** Click handler — kalau diisi panel jadi keyboard accessible. */
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * Shared "study panel" card shell untuk Home, Catatan, Hafalan, dan Quiz.
 *
 * Visual base mengambil dari template kartu hero di landing page (yang
 * dulu dipakai untuk streak card). PRD melarang menanam chart mingguan
 * (Senin/Selasa/...) di dalamnya — di sini hanya wadah / shell-nya saja
 * yang dipakai ulang sebagai bahasa visual seragam.
 *
 * Properti utama:
 *   - rounded-notebook + shadow-notebook-md + ring-1 ring-paper-200
 *   - background warm (paper-50 / ink-800), dark-mode safe
 *   - slot eyebrow + title + description + headerAction + footer
 *
 * Padding default `p-5` (mobile) → `p-6` (desktop). Pakai
 * `padding="none"` ketika body custom (mis. tabel / list rows) sudah
 * punya padding sendiri.
 */
export function PanelCard({
  eyebrow,
  title,
  description,
  headerAction,
  tone = "accent",
  padding = "default",
  stripe,
  footer,
  interactive,
  onClick,
  className,
  children,
  ...rest
}: PanelCardProps) {
  const isClickable = !!onClick;
  const hasHeader = !!(eyebrow || title || description || headerAction);

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "relative w-full max-w-full min-w-0 overflow-hidden rounded-notebook bg-white shadow-notebook-md ring-1 ring-paper-200/80 transition-shadow",
        "dark:bg-ink-800 dark:ring-ink-700",
        // Subtle warm tint matching the calm "study notebook" landing look.
        "bg-gradient-to-b from-white to-paper-50/70 dark:from-ink-800 dark:to-ink-800/95",
        stripe && cn("border-t-4", TONE_STRIPE[tone]),
        (interactive || isClickable) &&
          "hover:shadow-[0_2px_4px_rgba(20,18,12,0.06),0_18px_36px_-12px_rgba(20,18,12,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 dark:focus-visible:ring-offset-paper-900",
        isClickable && "cursor-pointer",
        PADDINGS[padding],
        className,
      )}
      {...rest}
    >
      {hasHeader ? (
        <header
          className={cn(
            "flex flex-wrap items-start gap-3",
            (children || footer) && "mb-4",
          )}
        >
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <div
                className={cn(
                  "text-[11px] font-medium uppercase tracking-wide",
                  TONE_TEXT[tone],
                )}
              >
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <h2 className="mt-0.5 text-base font-semibold tracking-tight text-ink-800 dark:text-paper-50 sm:text-lg">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-sm text-ink-400">{description}</p>
            ) : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </header>
      ) : null}

      {children}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}

const TONE_TEXT: Record<PanelCardTone, string> = {
  accent: "text-accent-600 dark:text-accent-300",
  lilac: "text-lilac-600 dark:text-lilac-400",
  leaf: "text-leaf-600 dark:text-leaf-500",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  slate: "text-ink-400",
};

const TONE_STRIPE: Record<PanelCardTone, string> = {
  accent: "border-t-accent-400 dark:border-t-accent-500",
  lilac: "border-t-lilac-400 dark:border-t-lilac-500",
  leaf: "border-t-leaf-500 dark:border-t-leaf-600",
  amber: "border-t-amber-400 dark:border-t-amber-500",
  rose: "border-t-rose-400 dark:border-t-rose-500",
  slate: "border-t-paper-200 dark:border-t-ink-700",
};

const PADDINGS = {
  none: "",
  compact: "p-4",
  default: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;
