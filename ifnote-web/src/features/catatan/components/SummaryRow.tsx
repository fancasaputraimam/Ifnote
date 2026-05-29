"use client";

import { StudyModeCard } from "@/components/ui/StudyModeCard";

interface Props {
  kotoba: number;
  bunpou: number;
}

/**
 * Catatan summary — disamakan dengan card Kotoba/Bunpou di halaman
 * Hafalan (`ModeCards`) supaya bahasa visual antar halaman konsisten:
 *   [📖 Kotoba]  kosakata · N
 *   [📐 Bunpou]  tata bahasa · N
 *
 * Tone mengikuti Hafalan: accent untuk Kotoba, lilac untuk Bunpou.
 * Card tidak clickable di Catatan (tidak ada `onClick`) supaya tetap
 * berperan sebagai summary panel, bukan filter picker.
 */
export function SummaryRow({ kotoba, bunpou }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:max-w-md">
      <StudyModeCard
        icon={<span>📖</span>}
        title="Kotoba"
        subtitle={`kosakata · ${kotoba}`}
        tone="accent"
      />
      <StudyModeCard
        icon={<span>📐</span>}
        title="Bunpou"
        subtitle={`tata bahasa · ${bunpou}`}
        tone="lilac"
      />
    </div>
  );
}
