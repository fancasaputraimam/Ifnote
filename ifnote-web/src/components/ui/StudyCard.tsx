"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type StudyCardTone =
  | "accent"
  | "lilac"
  | "leaf"
  | "amber"
  | "rose"
  | "slate";

interface StudyCardProps {
  /** Icon node ditampilkan di panel kiri (gradient). */
  icon?: ReactNode;
  /** Eyebrow kecil di atas title (e.g. "📚 Study Notes"). */
  eyebrow?: string;
  /** Headline utama di panel kanan. */
  title?: string;
  /** Penjelasan singkat di bawah title. */
  subtitle?: ReactNode;
  /** Angka besar di panel kiri (e.g. "128"). */
  metric?: ReactNode;
  /** Label kecil di bawah metric (e.g. "Kotoba"). */
  metricLabel?: string;
  /** Status pill di panel kanan (e.g. "Mid"). */
  status?: ReactNode;
  /** Tone status pill, default mengikuti `tone`. */
  statusTone?: StudyCardTone;
  /** Tema warna utama card. */
  tone?: StudyCardTone;
  /** Action row di bawah body (button group). */
  actions?: ReactNode;
  /** Body custom — di-render setelah subtitle. */
  children?: ReactNode;
  className?: string;
  /** Padding lebih kecil; cocok untuk grid summary. */
  compact?: boolean;
  /** Buat seluruh card clickable. */
  onClick?: () => void;
  /** Tampilkan card dalam mode aktif (border + ring). */
  active?: boolean;
  /** Hilangkan panel kiri kalau tidak punya icon/metric. */
  hideLeftPanel?: boolean;
}

const TONE_STYLES: Record<
  StudyCardTone,
  {
    /** Background gradient di left panel. */
    leftBg: string;
    /** Warna text di left panel. */
    leftText: string;
    /** Warna ring/border saat active. */
    activeRing: string;
    /** Status pill background. */
    pill: string;
    /** Accent border-l untuk hideLeftPanel mode. */
    accent: string;
  }
> = {
  accent: {
    leftBg:
      "bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 dark:from-accent-600 dark:via-accent-700 dark:to-accent-800",
    leftText: "text-white",
    activeRing: "ring-accent-500",
    pill: "bg-accent-50 text-accent-700 dark:bg-accent-700/30 dark:text-accent-200",
    accent: "border-l-accent-500",
  },
  lilac: {
    leftBg:
      "bg-gradient-to-br from-lilac-400 via-lilac-500 to-lilac-600 dark:from-lilac-500 dark:via-lilac-600 dark:to-accent-700",
    leftText: "text-white",
    activeRing: "ring-lilac-500",
    pill: "bg-lilac-400/15 text-lilac-600 dark:bg-lilac-400/20 dark:text-lilac-400",
    accent: "border-l-lilac-500",
  },
  leaf: {
    leftBg:
      "bg-gradient-to-br from-leaf-500 via-leaf-600 to-emerald-700 dark:from-leaf-500 dark:via-leaf-600 dark:to-emerald-800",
    leftText: "text-white",
    activeRing: "ring-leaf-500",
    pill: "bg-leaf-500/15 text-leaf-600 dark:bg-leaf-500/20 dark:text-leaf-500",
    accent: "border-l-leaf-500",
  },
  amber: {
    leftBg:
      "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 dark:from-amber-500 dark:via-amber-600 dark:to-amber-700",
    leftText: "text-white",
    activeRing: "ring-amber-500",
    pill: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    accent: "border-l-amber-500",
  },
  rose: {
    leftBg:
      "bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 dark:from-rose-500 dark:via-rose-600 dark:to-rose-700",
    leftText: "text-white",
    activeRing: "ring-rose-500",
    pill: "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    accent: "border-l-rose-500",
  },
  slate: {
    leftBg:
      "bg-gradient-to-br from-paper-200 via-paper-200 to-paper-100 dark:from-ink-700 dark:via-ink-700 dark:to-ink-800",
    leftText: "text-ink-800 dark:text-paper-50",
    activeRing: "ring-ink-400",
    pill: "bg-paper-200 text-ink-700 dark:bg-ink-700 dark:text-paper-50",
    accent: "border-l-ink-400",
  },
};

/**
 * Base reusable card untuk seluruh ifNote app.
 *
 * Layout:
 *   [Left gradient panel: icon, metric, metricLabel]
 *   [Right content panel : eyebrow, title, subtitle, children, actions]
 *
 * Mobile (<sm):
 *   - stack vertical (left jadi atas, lebih tipis)
 *   - tidak ada horizontal overflow
 *
 * Desktop (sm+):
 *   - split horizontal (left ~33%, right ~67%)
 *
 * Kalau `hideLeftPanel`, render single-panel dengan border accent kiri saja.
 */
export function StudyCard({
  icon,
  eyebrow,
  title,
  subtitle,
  metric,
  metricLabel,
  status,
  statusTone,
  tone = "accent",
  actions,
  children,
  className,
  compact,
  onClick,
  active,
  hideLeftPanel,
}: StudyCardProps) {
  const reducedMotion = useReducedMotion();
  const styles = TONE_STYLES[tone];
  const pillStyles = TONE_STYLES[statusTone ?? tone].pill;

  const interactive = !!onClick;

  const motionProps = reducedMotion
    ? {}
    : {
        whileHover: interactive ? { y: -2 } : undefined,
        whileTap: interactive ? { scale: 0.99 } : undefined,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 },
      };

  return (
    <motion.div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
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
        "relative flex w-full max-w-full min-w-0 overflow-hidden rounded-2xl border bg-white shadow-notebook",
        "border-paper-200 transition-shadow",
        "dark:border-ink-700 dark:bg-ink-800",
        interactive && "cursor-pointer hover:shadow-notebook-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 dark:focus-visible:ring-offset-paper-900",
        active && cn("ring-2 ring-offset-1", styles.activeRing),
        hideLeftPanel ? "flex-row" : "flex-col sm:flex-row",
        className,
      )}
    >
      {hideLeftPanel ? (
        // Tipis accent bar di kiri (untuk note/list rows)
        <div className={cn("w-1.5 shrink-0", styles.leftBg)} aria-hidden />
      ) : (
        <div
          className={cn(
            "relative flex shrink-0 flex-col items-start justify-between gap-3 overflow-hidden",
            styles.leftBg,
            styles.leftText,
            compact ? "p-3" : "p-4 sm:p-5",
            "sm:w-[38%] sm:max-w-[200px]",
          )}
        >
          {/* Decorative dot grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
              backgroundSize: "12px 12px",
            }}
          />

          {icon ? (
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-lg backdrop-blur-sm ring-1 ring-white/20">
              {icon}
            </div>
          ) : null}

          {metric !== undefined ? (
            <div className="relative">
              <div className={cn("font-semibold tabular-nums", compact ? "text-2xl" : "text-3xl")}>
                {metric}
              </div>
              {metricLabel ? (
                <div className={cn("mt-0.5 uppercase tracking-wider opacity-80", compact ? "text-[10px]" : "text-[11px]")}>
                  {metricLabel}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          "min-w-0 flex-1",
          compact ? "p-3" : "p-4 sm:p-5",
        )}
      >
        {(eyebrow || status) && (
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            {eyebrow ? (
              <div className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                {eyebrow}
              </div>
            ) : <span />}
            {status ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  pillStyles,
                )}
              >
                {status}
              </span>
            ) : null}
          </div>
        )}

        {title ? (
          <h3 className={cn(
            "font-semibold tracking-tight text-ink-800 dark:text-paper-50",
            compact ? "text-sm" : "text-base sm:text-lg",
          )}>
            {title}
          </h3>
        ) : null}

        {subtitle ? (
          <div className={cn(
            "mt-1 break-words text-ink-400",
            compact ? "text-xs" : "text-sm",
          )}>
            {subtitle}
          </div>
        ) : null}

        {children ? <div className="mt-3 min-w-0">{children}</div> : null}

        {actions ? (
          <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
    </motion.div>
  );
}
