"use client";

import { Button } from "@/components/ui/Button";

interface Props {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (slide: number) => void;
}

export function SlideNav({ current, total, onPrev, onNext, onJump }: Props) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={onPrev}
        disabled={current <= 1}
      >
        ← Sebelumnya
      </Button>

      <label className="text-sm text-ink-400">
        <span className="sr-only">Pilih slide</span>
        <select
          value={current}
          onChange={(e) => onJump(Number(e.target.value))}
          className="rounded-full border border-paper-200 bg-white px-3 py-1.5 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-accent-400 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
          aria-label="Pilih slide"
        >
          {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>Slide {n} / {total}</option>
          ))}
        </select>
      </label>

      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={onNext}
        disabled={current >= total}
      >
        Selanjutnya →
      </Button>
    </div>
  );
}
