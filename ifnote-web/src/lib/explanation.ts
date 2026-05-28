/**
 * Helpers untuk menentukan apakah satu Kotoba/Bunpou sudah punya
 * penjelasan yang cukup di catatan user. Dipakai untuk:
 *   - Menyembunyikan tombol AI Jelaskan di Catatan/Hafalan kalau item
 *     sudah dijelaskan.
 *   - Menentukan apakah auto-AI boleh memanggil endpoint cache.
 *
 * Logic disengajakan loose: cukup salah satu field penjelasan terisi,
 * item dianggap sudah dijelaskan. Backend punya pemeriksaan lebih ketat
 * sebagai second-line defense.
 */

import type { Bunpou, CatatanItem, Kotoba } from "@/lib/types";

function nonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function kotobaHasExplanation(k: Partial<Kotoba>): boolean {
  return (
    nonEmpty(k.type) ||
    nonEmpty(k.beginnerExample) ||
    nonEmpty(k.normalExample) ||
    nonEmpty(k.furiganaExample) ||
    nonEmpty(k.exampleMeaning)
  );
}

export function bunpouHasExplanation(b: Partial<Bunpou>): boolean {
  return (
    nonEmpty(b.formula) ||
    nonEmpty(b.usage) ||
    nonEmpty(b.note) ||
    nonEmpty(b.commonMistake) ||
    nonEmpty(b.beginnerExample) ||
    nonEmpty(b.normalExample) ||
    nonEmpty(b.furiganaExample)
  );
}

/**
 * Versi yang menerima detail blob dari endpoint /api/catatan/list.
 * Detail di-flatten jadi `Record<string, unknown>` di backend, jadi
 * helper ini cek field-nya saja.
 */
export function catatanItemHasExplanation(item: CatatanItem): boolean {
  const d = item.detail as Record<string, unknown>;
  if (item.noteType === "kotoba") {
    return kotobaHasExplanation(d as Partial<Kotoba>);
  }
  return bunpouHasExplanation(d as Partial<Bunpou>);
}
