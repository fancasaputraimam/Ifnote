"use client";

import { NotebookCard } from "@/components/ui/NotebookCard";

interface Props {
  kotoba: number;
  bunpou: number;
  review: number;
  streakDays: number;
}

export function StatsGrid({ kotoba, bunpou, review, streakDays }: Props) {
  const items = [
    { label: "Kotoba", value: kotoba, accent: "text-accent-600 dark:text-accent-300" },
    { label: "Bunpou", value: bunpou, accent: "text-lilac-600 dark:text-lilac-400" },
    { label: "Review", value: review, accent: "text-amber-600 dark:text-amber-400" },
    {
      label: "Hari Streak",
      value: streakDays,
      accent: "text-leaf-600 dark:text-leaf-500",
      hint: streakDays === 0 ? "belum dilacak" : undefined,
    },
  ];

  return (
    <NotebookCard className="p-2 sm:p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-xl bg-paper-50/60 px-3 py-3 text-center dark:bg-ink-900/30"
          >
            <div className={`text-2xl font-semibold tabular-nums ${it.accent}`}>
              {it.value}
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-400">
              {it.label}
            </div>
            {it.hint ? (
              <div className="mt-0.5 text-[10px] italic text-ink-400">{it.hint}</div>
            ) : null}
          </div>
        ))}
      </div>
    </NotebookCard>
  );
}
