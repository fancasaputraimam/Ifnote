"use client";

import { StudyMetricCard } from "@/components/ui/StudyMetricCard";

interface Props {
  kotoba: number;
  bunpou: number;
}

/**
 * Home stats — disederhanakan jadi 2 kartu (Kotoba & Bunpou) sesuai
 * task spec PART 4. Review & Streak sengaja dihilangkan dari Home.
 *
 * Layout:
 *   - Mobile : 2 kolom (cukup ringkas)
 *   - Desktop: tetap 2 kolom, tidak melar memenuhi seluruh lebar
 */
export function StatsGrid({ kotoba, bunpou }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:max-w-md">
      <StudyMetricCard value={kotoba} label="Kotoba" tone="accent" icon="📖" />
      <StudyMetricCard value={bunpou} label="Bunpou" tone="lilac" icon="📐" />
    </div>
  );
}
