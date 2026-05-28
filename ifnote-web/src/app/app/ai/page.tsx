import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Catatan · ifNote" };

/**
 * Legacy AI Tutor route.
 *
 * AI sebagai screen utama sudah dihapus (lihat task spec). Fungsi AI
 * sekarang ditanam di alur Tambah Kotoba dan Tambah Bunpou. Route
 * lama dialihkan ke Catatan dengan flag `?openAdd=ai-kotoba` supaya
 * link/bookmark lama tetap bisa dipakai user.
 */
export default function AiLegacyRedirect() {
  redirect("/app/catatan?openAdd=ai-kotoba");
}
