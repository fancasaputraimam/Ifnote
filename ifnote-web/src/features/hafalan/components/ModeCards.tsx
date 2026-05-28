"use client";

import { StudyModeCard } from "@/components/ui/StudyModeCard";
import type { StudyCardTone } from "@/components/ui/StudyCard";
import type { HafalanMode } from "@/lib/types";

interface Props {
  mode: HafalanMode;
  onChange: (m: HafalanMode) => void;
  /** Counts to display under the label. */
  kotobaCount?: number;
  bunpouCount?: number;
}

interface ModeDef {
  key: HafalanMode;
  label: string;
  icon: string;
  hint: string;
  tone: StudyCardTone;
}

const MODES: ModeDef[] = [
  { key: "kotoba", label: "Kotoba", icon: "📖", hint: "kosakata", tone: "accent" },
  { key: "bunpou", label: "Bunpou", icon: "📐", hint: "tata bahasa", tone: "lilac" },
];

/**
 * Hafalan mode picker — sengaja hanya menampilkan Kotoba & Bunpou.
 *
 * Mixed dan Weak Only sengaja disembunyikan dari UI per task spec PART 5.
 * Backend masih menerima `mode=mixed|weak` jadi tidak ada migrasi data;
 * frontend hanya mengabaikan keduanya.
 */
export function ModeCards({ mode, onChange, kotobaCount, bunpouCount }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:max-w-md">
      {MODES.map((m) => {
        const count =
          m.key === "kotoba" ? kotobaCount : m.key === "bunpou" ? bunpouCount : undefined;
        return (
          <StudyModeCard
            key={m.key}
            icon={<span>{m.icon}</span>}
            title={m.label}
            subtitle={
              typeof count === "number" ? `${m.hint} · ${count}` : m.hint
            }
            tone={m.tone}
            active={mode === m.key}
            onClick={() => onChange(m.key)}
          />
        );
      })}
    </div>
  );
}
