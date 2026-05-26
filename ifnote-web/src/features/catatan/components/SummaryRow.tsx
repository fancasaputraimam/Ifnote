"use client";

import { NotebookCard } from "@/components/ui/NotebookCard";

interface Props {
  kotoba: number;
  bunpou: number;
  review: number;
  weak: number;
}

export function SummaryRow({ kotoba, bunpou, review, weak }: Props) {
  const items = [
    { label: "Kotoba", value: kotoba, color: "text-accent-600 dark:text-accent-300" },
    { label: "Bunpou", value: bunpou, color: "text-lilac-600 dark:text-lilac-400" },
    { label: "Review", value: review, color: "text-amber-600 dark:text-amber-400" },
    { label: "Weak",   value: weak,   color: "text-rose-600 dark:text-rose-400" },
  ];
  return (
    <NotebookCard className="p-2 sm:p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl bg-paper-50/60 px-3 py-2.5 text-center dark:bg-ink-900/30">
            <div className={`text-xl font-semibold tabular-nums ${it.color}`}>{it.value}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-400">{it.label}</div>
          </div>
        ))}
      </div>
    </NotebookCard>
  );
}
