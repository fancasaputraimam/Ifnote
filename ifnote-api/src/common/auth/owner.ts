/**
 * Owner / admin detection.
 *
 * Aturan owner (PART 1 dari task spec):
 *   1. user.role === "owner" (kolom DB)               → owner
 *   2. user.email === OWNER_EMAIL (case-insensitive)  → owner (fallback)
 *   3. lainnya                                        → user biasa
 *
 * Email diset case-insensitive supaya tidak bisa di-bypass dengan
 * variasi huruf besar/kecil saat register.
 */

import type { PrismaService } from "../../prisma/prisma.service";

/**
 * Email akun owner default. Hardcoded sesuai spec; kalau perlu di-override
 * di production, baca dari env (OWNER_EMAIL) tapi fallback ke konstanta ini.
 */
export const OWNER_EMAIL = (
  process.env.OWNER_EMAIL ?? "7384imamfancasaputraaa02@gmail.com"
)
  .trim()
  .toLowerCase();

/**
 * Cek dari objek user (sudah di-fetch dari DB) — pure, tanpa I/O.
 * Pakai overload supaya bisa dipanggil dengan partial user dari Prisma.
 */
export function isOwnerUser(
  user: { role?: string | null; email?: string | null } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "owner") return true;
  if (user.email && user.email.trim().toLowerCase() === OWNER_EMAIL) return true;
  return false;
}

/**
 * Cek async lewat Prisma (kalau cuma punya userId, mis. dari JWT).
 * Return false kalau user tidak ditemukan — jangan throw, biar guard yang
 * decide apakah harus 403 atau cuma menyaring response.
 */
export async function isOwnerUserById(
  prisma: PrismaService,
  userId: string,
): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });
  return isOwnerUser(u);
}

/**
 * Daftar field di payload settings yang dianggap "AI configuration".
 * Dipakai backend untuk menolak update AI dari non-owner.
 */
export const AI_CONFIG_FIELDS = [
  "aiProvider",
  "aiBaseUrl",
  "aiModelId",
  "aiRequestFormat",
  "useRealAi",
  "aiApiKey",
] as const;

export type AiConfigField = (typeof AI_CONFIG_FIELDS)[number];

export function pickAiConfigKeys(body: Record<string, unknown>): AiConfigField[] {
  return AI_CONFIG_FIELDS.filter((k) => Object.prototype.hasOwnProperty.call(body, k));
}
