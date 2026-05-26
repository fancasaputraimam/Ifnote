"use client";

import { LinkButton } from "@/components/ui/LinkButton";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/lib/constants";

interface Props {
  /** Total quiz attempts so far. Used to render a meaningful suggestion. */
  totalQuizAnswered: number;
  /** Suggested grammar point — null if user has nothing weak/recent. */
  suggestedPattern: string | null;
}

export function AIStudyPlanCard({ totalQuizAnswered, suggestedPattern }: Props) {
  return (
    <NotebookCard stripe="accent" className="p-5">
      <div className="flex items-center gap-2">
        <Badge tone="accent" size="sm">AI Study Plan</Badge>
      </div>
      <h2 className="mt-2 text-base font-semibold text-ink-800 dark:text-paper-50">
        Saran fokus berikutnya
      </h2>

      <ul className="mt-3 space-y-2 text-sm text-ink-700 dark:text-paper-50">
        {suggestedPattern ? (
          <li className="flex items-start gap-2">
            <span aria-hidden>🧱</span>
            <span>
              Tinjau ulang pola{" "}
              <span className="font-jp font-semibold text-accent-600 dark:text-accent-300">
                {suggestedPattern}
              </span>{" "}
              di Catatan kamu.
            </span>
          </li>
        ) : (
          <li className="flex items-start gap-2">
            <span aria-hidden>📚</span>
            <span>Tambahkan beberapa bunpou baru supaya AI bisa kasih saran yang lebih relevan.</span>
          </li>
        )}
        <li className="flex items-start gap-2">
          <span aria-hidden>🎯</span>
          <span>
            {totalQuizAnswered === 0
              ? "Coba quiz pertama untuk lihat skor awalmu."
              : `Sudah ${totalQuizAnswered} quiz dijawab — pertahankan momentum.`}
          </span>
        </li>
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <LinkButton size="sm" variant="secondary" href={ROUTES.app.catatan}>
          Latihan Bunpou
        </LinkButton>
        <LinkButton size="sm" variant="secondary" href={ROUTES.app.quiz}>
          Buat Quiz
        </LinkButton>
      </div>
    </NotebookCard>
  );
}
