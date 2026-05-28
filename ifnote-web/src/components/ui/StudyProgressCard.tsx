"use client";

import { ReactNode } from "react";
import { StudyCard, type StudyCardTone } from "./StudyCard";
import { cn } from "@/lib/utils";

interface StudyProgressCardProps {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  /** Progress 0..100. */
  progress?: number;
  /** Label di bawah bar (e.g. "12 / 20 item"). */
  progressLabel?: string;
  status?: ReactNode;
  statusTone?: StudyCardTone;
  tone?: StudyCardTone;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Card besar dengan progress bar — cocok untuk:
 *   - Today Mission di Home
 *   - Fokus Hari Ini di Catatan
 *   - Hafalan slide progress
 */
export function StudyProgressCard({
  icon,
  eyebrow,
  title,
  subtitle,
  progress,
  progressLabel,
  status,
  statusTone,
  tone = "accent",
  actions,
  children,
  className,
}: StudyProgressCardProps) {
  const pct = typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <StudyCard
      tone={tone}
      icon={icon}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      status={status}
      statusTone={statusTone}
      actions={actions}
      className={className}
      metric={pct !== null ? `${pct}%` : undefined}
      metricLabel={progressLabel}
    >
      {pct !== null ? (
        <div className="space-y-1">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="h-2 w-full overflow-hidden rounded-full bg-paper-200/70 dark:bg-ink-700"
          >
            <div
              className={cn("h-full rounded-full transition-[width]", BAR_BG[tone])}
              style={{ width: `${pct}%` }}
            />
          </div>
          {progressLabel ? (
            <div className="text-xs text-ink-400">{progressLabel}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </StudyCard>
  );
}

const BAR_BG: Record<StudyCardTone, string> = {
  accent: "bg-gradient-to-r from-accent-400 to-accent-600",
  lilac: "bg-gradient-to-r from-lilac-400 to-lilac-600",
  leaf: "bg-gradient-to-r from-leaf-500 to-emerald-600",
  amber: "bg-gradient-to-r from-amber-400 to-amber-600",
  rose: "bg-gradient-to-r from-rose-400 to-rose-600",
  slate: "bg-gradient-to-r from-paper-200 to-paper-100 dark:from-ink-700 dark:to-ink-800",
};
