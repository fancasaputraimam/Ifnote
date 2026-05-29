"use client";

import LoaderGrid from "@/components/ui/loader-grid";
import { cn } from "@/lib/utils";

interface AiLoadingProps {
  /** Headline. Defaults to a friendly Indonesian message. */
  title?: string;
  /** Secondary line. Defaults to "Tunggu sebentar ya." */
  description?: string;
  /** Compact variant for tight spaces (e.g. inside a row/card). */
  compact?: boolean;
  className?: string;
}

/**
 * AiLoading — calm AI/analysis loading panel using LoaderGrid.
 *
 * Use this for AI actions only (analyze, explain, bulk import, sakubun
 * generate, kanji AI lookup). Don't use for plain page/list fetches —
 * those keep the lightweight `LoadingState` spinner.
 *
 * Visual:
 *   [LoaderGrid]  AI sedang menganalisa…
 *                 Tunggu sebentar ya.
 *
 * Theme:
 *   - rounded-notebook + soft border
 *   - paper-50 / ink-800 backgrounds (dark mode safe)
 *   - lilac stripe matches the loading-toast accent in Toast.tsx
 */
export function AiLoading({
  title = "AI sedang menganalisa…",
  description = "Tunggu sebentar ya.",
  compact = false,
  className,
}: AiLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative flex items-center gap-4 overflow-hidden",
        "rounded-notebook border border-paper-200 bg-paper-50/70",
        "shadow-notebook ring-1 ring-paper-200/60",
        "dark:border-ink-700 dark:bg-ink-800/80 dark:ring-ink-700",
        compact ? "gap-3 p-3" : "p-4 sm:p-5",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-lilac-500/80"
      />
      <LoaderGrid
        label={title}
        className={cn(
          "shrink-0 pl-1",
          compact ? "text-[0.5rem]" : "text-[0.7rem]",
        )}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-semibold leading-snug text-ink-800 dark:text-paper-50",
            compact ? "text-sm" : "text-base",
          )}
        >
          {title}
        </p>
        {description ? (
          <p
            className={cn(
              "mt-0.5 text-ink-400",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
