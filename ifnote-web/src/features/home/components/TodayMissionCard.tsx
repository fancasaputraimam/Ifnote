"use client";

import { LinkButton } from "@/components/ui/LinkButton";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ROUTES } from "@/lib/constants";

interface Props {
  /** Total tasks completed today (0..total). UI sembunyikan progress bar
   * kalau total = 0 supaya tidak menampilkan angka palsu. */
  done: number;
  total: number;
}

export function TodayMissionCard({ done, total }: Props) {
  const safeTotal = total > 0 ? total : 0;
  const safeDone = Math.max(0, Math.min(done, safeTotal));
  const pct = safeTotal === 0 ? 0 : Math.round((safeDone / safeTotal) * 100);

  return (
    <NotebookCard stripe="lilac" className="p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
          Misi Hari Ini
        </h2>
        {safeTotal > 0 ? (
          <span className="text-xs tabular-nums text-ink-400">{pct}%</span>
        ) : null}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-ink-700 dark:text-paper-50">
        <li className="flex items-start gap-2">
          <span aria-hidden>📒</span>
          <span>Review 10 kotoba N5 di Hafalan</span>
        </li>
        <li className="flex items-start gap-2">
          <span aria-hidden>🧱</span>
          <span>Latihan 1 pola bunpou di Catatan</span>
        </li>
        <li className="flex items-start gap-2">
          <span aria-hidden>🈯</span>
          <span>Pelajari 1 kanji baru lewat AI Tutor</span>
        </li>
      </ul>

      {safeTotal > 0 ? (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-paper-200 dark:bg-ink-700">
          <div
            className="h-full rounded-full bg-accent-500 transition-[width] duration-500"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={safeTotal}
            aria-valuenow={safeDone}
          />
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-400">
          Mulai sesi pertama untuk melacak progress.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <LinkButton size="sm" href={ROUTES.app.hafalan}>Mulai Belajar</LinkButton>
        <LinkButton size="sm" variant="secondary" href={ROUTES.app.ai}>Tanya AI</LinkButton>
      </div>
    </NotebookCard>
  );
}
