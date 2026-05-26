"use client";

import { Badge } from "@/components/ui/Badge";
import { NotebookCard } from "@/components/ui/NotebookCard";
import type { QuizType } from "@/lib/types";

interface Props {
  type: QuizType;
  /** Stats for the current session (in-memory, resets per quiz). */
  sessionCorrect: number;
  sessionWrong: number;
  /** Persisted lifetime stats from backend, optional. */
  lifetimeCorrect?: number;
  lifetimeWrong?: number;
  lifetimeTotal?: number;
  lastScore?: number | null;
}

export function ProgressStrip({
  type,
  sessionCorrect,
  sessionWrong,
  lifetimeCorrect,
  lifetimeWrong,
  lifetimeTotal,
  lastScore,
}: Props) {
  const sessionTotal = sessionCorrect + sessionWrong;
  const sessionAcc = sessionTotal === 0 ? 0 : Math.round((sessionCorrect / sessionTotal) * 100);

  return (
    <NotebookCard className="p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <Badge tone="accent" size="sm">{type}</Badge>
          <span className="text-ink-400">sesi ini</span>
        </div>
        <div className="flex items-center gap-3 tabular-nums">
          <span className="text-leaf-600 dark:text-leaf-500">
            ✓ {sessionCorrect}
          </span>
          <span className="text-rose-600 dark:text-rose-400">
            ✗ {sessionWrong}
          </span>
          <span className="text-ink-400">
            akurasi <span className="font-semibold text-ink-700 dark:text-paper-50">{sessionAcc}%</span>
          </span>
        </div>
        {typeof lifetimeTotal === "number" && lifetimeTotal > 0 ? (
          <div className="ml-auto text-xs text-ink-400">
            lifetime <span className="font-medium text-ink-700 dark:text-paper-50">{lifetimeCorrect ?? 0}</span> /
            <span className="ml-1 font-medium text-ink-700 dark:text-paper-50">{lifetimeTotal}</span>
            {typeof lastScore === "number" ? (
              <span className="ml-1.5">· last score {lastScore}%</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </NotebookCard>
  );
}
