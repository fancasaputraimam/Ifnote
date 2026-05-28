import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { appendHafalanOrder, retryOnUniqueViolation } from "../common/utils/hafalan-order.util";
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
          normalExample: dto.normalExample ?? null,
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
        ...(dto.normalExample !== undefined ? { normalExample: dto.normalExample } : {}),
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
