"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { StudyCardTone } from "./StudyCard";
import { cn } from "@/lib/utils";

interface StudyModeCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  tone?: StudyCardTone;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Mode picker card — disamakan dengan kartu Kotoba/Bunpou di Home
 * (`StudyMetricCard`) supaya konsisten antara halaman dan tidak makan
 * tempat di mobile.
 *
 * Layout horizontal compact:
 *   [icon box kecil] [title + subtitle/count]
 *
 * Tidak ada panel gradient besar di kiri. Semua tone hanya muncul di
 * icon box, di teks title, dan di ring saat active.
 */
export function StudyModeCard({
  icon,
  title,
  subtitle,
  tone = "accent",
  active,
  disabled,
  onClick,
  className,
}: StudyModeCardProps) {
  const reducedMotion = useReducedMotion();
  const interactive = !!onClick && !disabled;

  const motionProps = reducedMotion
    ? {}
    : {
        whileHover: interactive ? { y: -1 } : undefined,
        whileTap: interactive ? { scale: 0.99 } : undefined,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 },
      };

  return (
    <motion.div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? !!active : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      {...motionProps}
      className={cn(
        "relative flex w-full max-w-full min-w-0 items-start gap-2.5 overflow-hidden rounded-2xl bg-white p-3.5 shadow-notebook ring-1 ring-inset ring-paper-200/90 transition-[transform,box-shadow] dark:bg-ink-800 dark:ring-ink-700",
        interactive &&
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-notebook-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 motion-reduce:hover:translate-y-0 dark:focus-visible:ring-offset-paper-900",
        active && cn("ring-2", TONE_RING[tone], TONE_ACTIVE[tone]),
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl text-base shrink-0 ring-1 ring-inset",
          TONE_BG[tone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm font-semibold tracking-tight truncate",
            TONE_TEXT[tone],
          )}
        >
          {title}
        </div>
        {subtitle ? (
          <div className="mt-0.5 truncate text-[11px] uppercase tracking-wide text-ink-400">
            {subtitle}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

const TONE_BG: Record<StudyCardTone, string> = {
  accent: "bg-accent-50 text-accent-700 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25",
  lilac: "bg-lilac-50 text-lilac-600 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/25",
  leaf: "bg-leaf-50 text-leaf-600 ring-leaf-200/70 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/25",
  amber: "bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/25",
  rose: "bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/25",
  slate: "bg-paper-100 text-ink-700 ring-paper-300/70 dark:bg-ink-700 dark:text-paper-50 dark:ring-ink-600",
};

const TONE_ACTIVE: Record<StudyCardTone, string> = {
  accent: "bg-accent-50/60 dark:bg-accent-500/10",
  lilac: "bg-lilac-50/60 dark:bg-lilac-500/10",
  leaf: "bg-leaf-50/60 dark:bg-leaf-500/10",
  amber: "bg-amber-50/60 dark:bg-amber-500/10",
  rose: "bg-rose-50/60 dark:bg-rose-500/10",
  slate: "bg-paper-100/60 dark:bg-ink-700/40",
};

const TONE_TEXT: Record<StudyCardTone, string> = {
  accent: "text-accent-600 dark:text-accent-300",
  lilac: "text-lilac-600 dark:text-lilac-400",
  leaf: "text-leaf-600 dark:text-leaf-500",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  slate: "text-ink-800 dark:text-paper-50",
};

const TONE_RING: Record<StudyCardTone, string> = {
  accent: "ring-accent-500",
  lilac: "ring-lilac-500",
  leaf: "ring-leaf-500",
  amber: "ring-amber-500",
  rose: "ring-rose-500",
  slate: "ring-ink-400",
};
