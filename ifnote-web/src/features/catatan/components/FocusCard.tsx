"use client";

import { LinkButton } from "@/components/ui/LinkButton";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ROUTES } from "@/lib/constants";

interface Props {
  weakCount: number;
  reviewCount: number;
}

export function FocusCard({ weakCount, reviewCount }: Props) {
  const totalAttention = weakCount + reviewCount;
  return (
    <NotebookCard stripe="lilac" ruled className="p-5">
      <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
        Fokus Catatan Hari Ini
      </h2>
      <p className="mt-1 text-sm text-ink-700 dark:text-paper-50">
        Review kata kerja N5 dan bunpou yang sering salah. {" "}
        {totalAttention === 0
          ? "Belum ada item yang perlu fokus — pertahankan ritmenya."
          : `Ada ${totalAttention} item yang menunggu kamu (${weakCount} weak, ${reviewCount} review).`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <LinkButton size="sm" href={ROUTES.app.hafalan}>Mulai Hafalan</LinkButton>
        <LinkButton size="sm" variant="secondary" href={ROUTES.app.quiz}>Buat Quiz</LinkButton>
      </div>
    </NotebookCard>
  );
}
