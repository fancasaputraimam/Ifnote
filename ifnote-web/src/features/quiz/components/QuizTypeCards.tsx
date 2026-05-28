"use client";

import { StudyModeCard } from "@/components/ui/StudyModeCard";
import type { StudyCardTone } from "@/components/ui/StudyCard";
import type { QuizType } from "@/lib/types";

interface Props {
  type: QuizType;
  onChange: (t: QuizType) => void;
  disabled?: boolean;
}

/**
 * Public Quiz cards. Tipe legacy `mixed` dan `ai` tetap ada di backend
 * agar tidak memecah data lama, tapi tidak diekspos di UI.
 */
const TYPES: Array<{
  key: QuizType;
  label: string;
  icon: string;
  hint: string;
  tone: StudyCardTone;
}> = [
  {
    key: "kotoba",
    label: "Kotoba",
    icon: "📖",
    hint: "kosakata",
    tone: "accent",
  },
  {
    key: "bunpou",
    label: "Bunpou",
    icon: "📐",
    hint: "tata bahasa",
    tone: "lilac",
  },
  {
    key: "sakubun",
    label: "Sakubun",
    icon: "✍️",
    hint: "buat sakubun AI",
    tone: "amber",
  },
];

export function QuizTypeCards({ type, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 sm:max-w-2xl">
      {TYPES.map((t) => (
        <StudyModeCard
          key={t.key}
          icon={<span>{t.icon}</span>}
          title={t.label}
          subtitle={t.hint}
          tone={t.tone}
          active={type === t.key}
          disabled={disabled}
          onClick={() => onChange(t.key)}
        />
      ))}
    </div>
  );
}
