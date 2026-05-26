"use client";

import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { Badge } from "@/components/ui/Badge";

interface Props {
  totalSlides: number;
  totalItems: number;
  currentSlide: number;
  currentCount: number;
  hideMeaning: boolean;
  shuffled: boolean;
  shuffling: boolean;
  onToggleMeaning: () => void;
  onShuffle: () => void;
  onResetShuffle: () => void;
}

export function SessionCard({
  totalSlides,
  totalItems,
  currentSlide,
  currentCount,
  hideMeaning,
  shuffled,
  shuffling,
  onToggleMeaning,
  onShuffle,
  onResetShuffle,
}: Props) {
  return (
    <NotebookCard stripe="leaf" ruled className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
            Hafalan Hari Ini
          </h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Slide tetap · 20 item per slide
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone="leaf">
            Slide {totalSlides === 0 ? 0 : currentSlide} / {totalSlides}
          </Badge>
          <Badge tone="neutral">{currentCount} item</Badge>
        </div>
      </div>

      <p className="mt-3 text-sm text-ink-700 dark:text-paper-50">
        Total {totalItems} item dalam mode ini.
        {totalSlides > 1 && currentSlide === totalSlides && currentCount < 20 ? (
          <span className="text-ink-400"> Slide terakhir lebih pendek karena tidak diisi paksa.</span>
        ) : null}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onToggleMeaning}>
          {hideMeaning ? "Tampilkan Arti" : "Sembunyikan Arti"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onShuffle} loading={shuffling}>
          Acak Sementara
        </Button>
        {shuffled ? (
          <Button size="sm" variant="ghost" onClick={onResetShuffle}>
            Urutan Asli
          </Button>
        ) : null}
      </div>

      {shuffled ? (
        <p className="mt-2 text-xs text-ink-400">
          Pengacakan hanya tampilan, urutan asli di server tidak berubah.
        </p>
      ) : null}
    </NotebookCard>
  );
}
