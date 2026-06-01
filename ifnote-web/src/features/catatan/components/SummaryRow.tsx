"use client";

import { StudyModeCard } from "@/components/ui/StudyModeCard";
import type { CatatanFilterType } from "@/features/catatan/useCatatan";

interface Props {
  kotoba: number;
  bunpou: number;
  /** Tipe filter aktif. Card berfungsi sebagai pemilih tipe. */
  type: CatatanFilterType;
  setType: (v: CatatanFilterType) => void;
}

/**
 * Catatan summary + pemilih tipe. Card Kotoba/Bunpou sekarang clickable:
 * klik untuk memfilter list per tipe, klik lagi (card aktif) untuk kembali
 * ke "Semua". Menggantikan grup "Tipe" yang dulu ada di dropdown filter.
 *
 * Tone mengikuti Hafalan: accent untuk Kotoba, lilac untuk Bunpou.
 */
export function SummaryRow({ kotoba, bunpou, type, setType }: Props) {
  const toggle = (v: CatatanFilterType) => setType(type === v ? "all" : v);
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:max-w-md">
      <StudyModeCard
        icon={<span>📖</span>}
        title="Kotoba"
        subtitle={`kosakata · ${kotoba}`}
        tone="accent"
        active={type === "kotoba"}
        onClick={() => toggle("kotoba")}
      />
      <StudyModeCard
        icon={<span>📐</span>}
        title="Bunpou"
        subtitle={`tata bahasa · ${bunpou}`}
        tone="lilac"
        active={type === "bunpou"}
        onClick={() => toggle("bunpou")}
      />
    </div>
  );
}
