"use client";

import { StudyMetricCard } from "@/components/ui/StudyMetricCard";

interface Props {
  kotoba: number;
  bunpou: number;
}

/**
 * Catatan summary — disederhanakan jadi 2 kartu (Kotoba & Bunpou) sesuai
 * task spec PART 1. Review & Weak sengaja dihilangkan.
 *
 * Layout:
 *   - Mobile : 2 kolom, tidak meluap.
 *   - Desktop: tetap 2 kolom, max-w-md supaya tidak melar.
 */
export function SummaryRow({ kotoba, bunpou }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:max-w-md">
      <StudyMetricCard value={kotoba} label="Kotoba" tone="accent" icon="📖" />
      <StudyMetricCard value={bunpou} label="Bunpou" tone="lilac" icon="📐" />
    </div>
  );
}
