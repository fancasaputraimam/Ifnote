"use client";

import { LinkButton } from "@/components/ui/LinkButton";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/lib/constants";
import type { CatatanItem } from "@/lib/types";

interface Props {
  bunpou: CatatanItem | null;
}

export function FocusBunpouCard({ bunpou }: Props) {
  return (
    <NotebookCard stripe="lilac" className="p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
          Bunpou Fokus Hari Ini
        </h2>
        {bunpou?.mastery ? (
          <Badge tone={bunpou.mastery === "weak" ? "danger" : bunpou.mastery === "mid" ? "warn" : "leaf"}>
            {bunpou.mastery}
          </Badge>
        ) : null}
      </div>

      {bunpou ? (
        <>
          <p className="mt-3 font-jp text-2xl text-lilac-600 dark:text-lilac-400">
            {bunpou.jpOrPattern}
          </p>
          <p className="mt-1 text-sm text-ink-400">{bunpou.meaning}</p>

          {typeof bunpou.detail?.formula === "string" && bunpou.detail.formula ? (
            <p className="mt-2 text-xs text-ink-700 dark:text-paper-50">
              <span className="font-medium">Formula: </span>
              <span className="font-jp">{bunpou.detail.formula as string}</span>
            </p>
          ) : null}

          {bunpou.example ? (
            <p className="mt-2 rounded-xl bg-paper-50/60 px-3 py-2 font-jp text-sm text-ink-700 dark:bg-ink-900/30 dark:text-paper-50">
              {bunpou.example}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton size="sm" variant="secondary" href={ROUTES.app.catatan}>
              Lihat Bunpou
            </LinkButton>
            <LinkButton size="sm" variant="secondary" href={ROUTES.app.quiz}>
              Latihan Quiz
            </LinkButton>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-ink-400">
          Belum ada bunpou di catatanmu. Tambah pola pertama lewat Catatan
          atau AI Tutor.
        </p>
      )}
    </NotebookCard>
  );
}
