"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Sebelumnya
      </Button>

      <label className="text-sm text-ink-400">
        <span className="sr-only">Pilih slide</span>
        <select
          value={current}
          onChange={(e) => onJump(Number(e.target.value))}
          className="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700 shadow-sm ring-1 ring-inset ring-paper-300 transition-shadow hover:ring-paper-400 focus:outline-none focus:ring-2 focus:ring-accent-400 dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700"
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
        className="gap-1"
      >
        Selanjutnya
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
