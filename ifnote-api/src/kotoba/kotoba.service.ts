import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { appendHafalanOrder, retryOnUniqueViolation } from "../common/utils/hafalan-order.util";
import { normalizeKotobaQuery } from "../common/utils/normalize-query";
import { AiService } from "../ai/ai.service";
import { CreateKotobaDto, UpdateKotobaDto } from "./dto";

function kotobaHasExplanation(k: {
  type: string | null;
  beginnerExample: string | null;
  normalExample: string | null;
  furiganaExample: string | null;
  exampleMeaning: string | null;
}): boolean {
  // Field-list mengikuti definisi `hasExplanation` di task spec PART 5.
  // Item dianggap punya penjelasan jika memiliki contoh kalimat ATAU
  // (jenis kata + makna sudah ada di model dengan default).
  return Boolean(
    (k.type && k.type.length > 0) ||
      (k.beginnerExample && k.beginnerExample.length > 0) ||
      (k.normalExample && k.normalExample.length > 0) ||
      (k.furiganaExample && k.furiganaExample.length > 0) ||
      (k.exampleMeaning && k.exampleMeaning.length > 0),
  );
}

@Injectable()
export class KotobaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  /**
   * Database-first lookup. Cek apakah user sudah punya kotoba yang cocok
   * dengan query (Jepang/Indonesia/romaji). Match logic:
   *   1. exact `jp` (case-insensitive)
   *   2. exact `reading`
   *   3. exact `romaji`
   *   4. exact `meaning` (untuk input Indonesia)
   *   5. fallback: `contains` di salah satu field di atas
   *
   * Tidak memanggil AI.
   */
  async lookup(
    userId: string,
    rawQuery: string,
  ): Promise<{ found: false } | { found: true; item: unknown }> {
    const norm = normalizeKotobaQuery(rawQuery);
    if (!norm) return { found: false };
    const raw = rawQuery.trim();

    const exact = await this.prisma.kotoba.findFirst({
      where: {
        userId,
        OR: [
          { jp: { equals: raw, mode: Prisma.QueryMode.insensitive } },
          { jp: { equals: norm, mode: Prisma.QueryMode.insensitive } },
          { reading: { equals: raw, mode: Prisma.QueryMode.insensitive } },
          { reading: { equals: norm, mode: Prisma.QueryMode.insensitive } },
          { romaji: { equals: raw, mode: Prisma.QueryMode.insensitive } },
          { romaji: { equals: norm, mode: Prisma.QueryMode.insensitive } },
          { meaning: { equals: raw, mode: Prisma.QueryMode.insensitive } },
          { meaning: { equals: norm, mode: Prisma.QueryMode.insensitive } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
    if (exact) return { found: true, item: exact };

    if (norm.length >= 2) {
      const contains = await this.prisma.kotoba.findFirst({
        where: {
          userId,
          OR: [
            { jp: { contains: norm, mode: Prisma.QueryMode.insensitive } },
            { reading: { contains: norm, mode: Prisma.QueryMode.insensitive } },
            { romaji: { contains: norm, mode: Prisma.QueryMode.insensitive } },
            { meaning: { contains: norm, mode: Prisma.QueryMode.insensitive } },
          ],
        },
        orderBy: { createdAt: "asc" },
      });
      if (contains) return { found: true, item: contains };
    }

    return { found: false };
  }

  /**
   * Bulk version of lookup — cek banyak query sekaligus, return Map keyed
   * oleh *normalized query*. Dipakai oleh `bulk-kotoba` AI flow agar item
   * yang sudah ada di catatan tidak ikut dikirim ke AI.
   */
  async bulkLookup(
    userId: string,
    queries: string[],
  ): Promise<Map<string, { id: string; jp: string; reading: string | null; meaning: string }>> {
    const result = new Map<
      string,
      { id: string; jp: string; reading: string | null; meaning: string }
    >();
    const normalized = Array.from(
      new Set(queries.map((q) => normalizeKotobaQuery(q)).filter(Boolean)),
    );
    if (normalized.length === 0) return result;

    const rows = await this.prisma.kotoba.findMany({
      where: {
        userId,
        OR: normalized.flatMap((n) => [
          { jp: { equals: n, mode: Prisma.QueryMode.insensitive } },
          { reading: { equals: n, mode: Prisma.QueryMode.insensitive } },
          { romaji: { equals: n, mode: Prisma.QueryMode.insensitive } },
          { meaning: { equals: n, mode: Prisma.QueryMode.insensitive } },
        ]),
      },
      select: { id: true, jp: true, reading: true, romaji: true, meaning: true },
    });

    for (const r of rows) {
      const candidates = [
        normalizeKotobaQuery(r.jp),
        r.reading ? normalizeKotobaQuery(r.reading) : null,
        r.romaji ? normalizeKotobaQuery(r.romaji) : null,
        normalizeKotobaQuery(r.meaning),
      ];
      for (const c of candidates) {
        if (!c) continue;
        if (normalized.includes(c) && !result.has(c)) {
          result.set(c, {
            id: r.id,
            jp: r.jp,
            reading: r.reading,
            meaning: r.meaning,
          });
        }
      }
    }
    return result;
  }

  list(userId: string) {
    return this.prisma.kotoba.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(userId: string, id: string) {
    const item = await this.prisma.kotoba.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException("Kotoba tidak ditemukan");
    return item;
  }

  async create(userId: string, dto: CreateKotobaDto) {
    return retryOnUniqueViolation(async () => {
      const created = await this.prisma.kotoba.create({
        data: {
          userId,
          jp: dto.jp,
          reading: dto.reading ?? null,
          romaji: dto.romaji ?? null,
          meaning: dto.meaning,
          type: dto.type ?? null,
          level: dto.level ?? null,
          tags: dto.tags ?? [],
          beginnerExample: dto.beginnerExample ?? null,
          beginnerExampleReading: dto.beginnerExampleReading ?? null,
          beginnerExampleMeaning: dto.beginnerExampleMeaning ?? null,
          normalExample: dto.normalExample ?? null,
          normalExampleReading: dto.normalExampleReading ?? null,
          normalExampleMeaning: dto.normalExampleMeaning ?? null,
          furiganaExample: dto.furiganaExample ?? null,
          exampleReading: dto.exampleReading ?? null,
          exampleMeaning: dto.exampleMeaning ?? null,
          mastery: dto.mastery ?? "mid",
        },
      });
      await appendHafalanOrder(this.prisma, userId, "kotoba", created.id);
      return created;
    });
  }

  async update(userId: string, id: string, dto: UpdateKotobaDto) {
    await this.getById(userId, id); // ensures ownership
    return this.prisma.kotoba.update({
      where: { id },
      data: {
        ...(dto.jp !== undefined ? { jp: dto.jp } : {}),
        ...(dto.reading !== undefined ? { reading: dto.reading } : {}),
        ...(dto.romaji !== undefined ? { romaji: dto.romaji } : {}),
        ...(dto.meaning !== undefined ? { meaning: dto.meaning } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
        ...(dto.beginnerExample !== undefined ? { beginnerExample: dto.beginnerExample } : {}),
        ...(dto.beginnerExampleReading !== undefined
          ? { beginnerExampleReading: dto.beginnerExampleReading }
          : {}),
        ...(dto.beginnerExampleMeaning !== undefined
          ? { beginnerExampleMeaning: dto.beginnerExampleMeaning }
          : {}),
        ...(dto.normalExample !== undefined ? { normalExample: dto.normalExample } : {}),
        ...(dto.normalExampleReading !== undefined
          ? { normalExampleReading: dto.normalExampleReading }
          : {}),
        ...(dto.normalExampleMeaning !== undefined
          ? { normalExampleMeaning: dto.normalExampleMeaning }
          : {}),
        ...(dto.furiganaExample !== undefined ? { furiganaExample: dto.furiganaExample } : {}),
        ...(dto.exampleReading !== undefined ? { exampleReading: dto.exampleReading } : {}),
        ...(dto.exampleMeaning !== undefined ? { exampleMeaning: dto.exampleMeaning } : {}),
        ...(dto.mastery !== undefined ? { mastery: dto.mastery } : {}),
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.getById(userId, id);
    // Remove from hafalan order too — Hafalan may keep gaps.
    await this.prisma.$transaction([
      this.prisma.hafalanOrder.deleteMany({
        where: { userId, itemType: "kotoba", itemId: id },
      }),
      this.prisma.kotoba.delete({ where: { id } }),
    ]);
    return { ok: true };
  }

  /**
   * AI explanation cache logic (task spec PART 3 + PART 6).
   *
   *   1. Cek item exists + milik user.
   *   2. Jika sudah punya penjelasan, return apa adanya — jangan call AI
   *      (hemat token).
   *   3. Kalau kosong, panggil AI proxy, parsing hasilnya, dan simpan ke DB
   *      (hanya field yang masih kosong supaya manual edit user tidak
   *      ke-overwrite).
   *   4. Kembalikan row yang sudah ter-update.
   *
   * Bila AI gagal: lempar error — row tidak diubah.
   */
  async aiExplain(userId: string, id: string) {
    const item = await this.getById(userId, id);
    if (kotobaHasExplanation(item)) {
      return { item, generated: false as const };
    }

    // Memanggil AiService.explainKotoba di-bagikan dengan endpoint AI lain
    // (auth, rate-limit, secret handling sudah ada di sana).
    const r = await this.ai.explainKotoba(userId, { jp: item.jp });
    const data = r.data as {
      topic?: string;
      meaning?: string;
      type?: string;
      level?: string;
      reading?: string;
      kana?: string;
      yomi?: string;
      furigana?: string;
      hiragana?: string;
      romaji?: string;
      example?: string;
      normalExample?: string;
      beginnerExample?: string;
      exampleReading?: string;
      exampleKana?: string;
      exampleFurigana?: string;
      readingExample?: string;
      exampleMeaning?: string;
      note?: string;
    };

    // Normalisasi field dari AI — berbagai key alias di-collapse jadi
    // satu field kanonik.
    const reading =
      data.reading || data.kana || data.yomi || data.furigana || data.hiragana || "";
    const exampleJp =
      data.normalExample || data.beginnerExample || data.example || "";
    const exampleReading =
      data.exampleReading ||
      data.exampleKana ||
      data.exampleFurigana ||
      data.readingExample ||
      "";

    const patch: Record<string, string> = {};
    if (!item.type && data.type) patch.type = data.type;
    if (!item.reading && reading) patch.reading = reading;
    if (!item.romaji && data.romaji) patch.romaji = data.romaji;
    if (!item.beginnerExample && exampleJp) patch.beginnerExample = exampleJp;
    if (!item.normalExample && exampleJp) patch.normalExample = exampleJp;
    if (!item.exampleReading && exampleReading)
      patch.exampleReading = exampleReading;
    if (!item.exampleMeaning && data.exampleMeaning)
      patch.exampleMeaning = data.exampleMeaning;
    // meaning is required and already set; tidak ditimpa.

    if (Object.keys(patch).length === 0) {
      // AI tidak balikin field yang kita tahu — tandai gagal supaya
      // tombol AI Jelaskan di UI tetap muncul.
      return { item, generated: false as const };
    }

    const updated = await this.prisma.kotoba.update({
      where: { id },
      data: patch,
    });
    return { item: updated, generated: true as const };
  }
}
