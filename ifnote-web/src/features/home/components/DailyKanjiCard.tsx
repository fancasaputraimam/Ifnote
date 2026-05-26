"use client";

import { useState } from "react";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { Button } from "@/components/ui/Button";
import { KanjiPopup } from "@/features/kanji/KanjiPopup";

interface Props {
  /** Single CJK character. When null, render an explanatory empty state. */
  kanji: string | null;
}

export function DailyKanjiCard({ kanji }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <NotebookCard stripe="leaf" className="p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
          Kanji Hari Ini
        </h2>
        <span className="text-xs text-ink-400">dari Catatan kamu</span>
      </div>

      {kanji ? (
        <div className="mt-3 flex items-center gap-4">
          <div className="font-jp text-5xl leading-none text-leaf-600 dark:text-leaf-500">
            {kanji}
          </div>
          <div className="flex-1">
            <p className="text-sm text-ink-700 dark:text-paper-50">
              Tap tombol untuk lihat arti, onyomi, kunyomi, dan contoh.
            </p>
            <div className="mt-3">
              <Button size="sm" onClick={() => setOpen(true)}>
                Lihat detail kanji
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-400">
          Belum ada kanji dari catatanmu. Tambah kotoba dengan kanji untuk
          fitur Kanji Hari Ini.
        </p>
      )}

      <KanjiPopup open={open} kanji={kanji} onClose={() => setOpen(false)} />
    </NotebookCard>
  );
}
