import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AiClientService } from "../ai/ai-client.service";
import { CacheKanjiDto } from "./dto";

interface KanjiPayload {
  kanji: string;
  meaning?: string | null;
  onyomi?: string | null;
  kunyomi?: string | null;
  explanation?: string | null;
  wordsJson?: unknown;
  exampleJp?: string | null;
  exampleId?: string | null;
}

@Injectable()
export class KanjiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiClient: AiClientService,
  ) {}

  /**
   * Resolve a kanji entry. Cache-first.
   * Falls back to AI lookup. Throws 503 if AI is not configured.
   */
  async get(userId: string, kanji: string): Promise<KanjiPayload & { source: "cache" | "ai" }> {
    const trimmed = kanji.trim();
    if (!trimmed) {
      throw new ServiceUnavailableException({
        error: "INVALID_INPUT",
        message: "Karakter kanji kosong.",
      });
    }

    const cached = await this.prisma.kanjiCache.findUnique({
      where: { uniq_user_kanji: { userId, kanji: trimmed } },
    });
    if (cached) return { ...cached, source: "cache" };

    // Need to call AI. Bail out cleanly if not configured.
    const sys =
      "Anda asisten kanji. Balas dalam JSON dengan field: " +
      '{"kanji":"string","meaning":"string","onyomi":"string","kunyomi":"string","explanation":"string","words":[{"jp":"string","meaning":"string"}],"exampleJp":"string","exampleId":"string"}';
    const usr = `Berikan info kanji "${trimmed}" untuk pelajar Indonesia. Sertakan arti utama, onyomi & kunyomi, satu kalimat penjelasan, 3 kata gabungan, dan satu contoh kalimat dengan terjemahan Bahasa Indonesia.`;
    const r = await this.aiClient.chatJson<{
      kanji: string;
      meaning: string;
      onyomi: string;
      kunyomi: string;
      explanation: string;
      words: { jp: string; meaning: string }[];
      exampleJp: string;
      exampleId: string;
    }>(userId, "kanji-lookup", sys, usr);

    if (!r.ok || !r.data) {
      throw new ServiceUnavailableException({
        error: "AI_NOT_CONFIGURED",
        message: r.message || "AI belum diatur. Aktifkan dan isi API key di Settings.",
      });
    }

    // Upsert (bukan create) supaya aman dari race: kalau user meng-klik
    // kanji yang sama dua kali cepat, dua request bisa sama-sama miss cache
    // lalu memanggil AI. Tanpa upsert, create kedua melanggar
    // uniq_user_kanji (P2002) dan melempar 500. Upsert → request kedua
    // sekadar me-refresh row.
    const saved = await this.prisma.kanjiCache.upsert({
      where: { uniq_user_kanji: { userId, kanji: trimmed } },
      create: {
        userId,
        kanji: trimmed,
        meaning: r.data.meaning ?? null,
        onyomi: r.data.onyomi ?? null,
        kunyomi: r.data.kunyomi ?? null,
        explanation: r.data.explanation ?? null,
        wordsJson: r.data.words ?? [],
        exampleJp: r.data.exampleJp ?? null,
        exampleId: r.data.exampleId ?? null,
      },
      update: {
        meaning: r.data.meaning ?? null,
        onyomi: r.data.onyomi ?? null,
        kunyomi: r.data.kunyomi ?? null,
        explanation: r.data.explanation ?? null,
        wordsJson: r.data.words ?? [],
        exampleJp: r.data.exampleJp ?? null,
        exampleId: r.data.exampleId ?? null,
      },
    });
    return { ...saved, source: "ai" };
  }

  async cache(userId: string, dto: CacheKanjiDto) {
    const wordsJson: Prisma.InputJsonValue =
      Array.isArray(dto.words) ? (dto.words as Prisma.InputJsonValue) : ([] as Prisma.InputJsonValue);
    return this.prisma.kanjiCache.upsert({
      where: { uniq_user_kanji: { userId, kanji: dto.kanji } },
      create: {
        userId,
        kanji: dto.kanji,
        meaning: dto.meaning ?? null,
        onyomi: dto.onyomi ?? null,
        kunyomi: dto.kunyomi ?? null,
        explanation: dto.explanation ?? null,
        wordsJson,
        exampleJp: dto.exampleJp ?? null,
        exampleId: dto.exampleId ?? null,
      },
      update: {
        meaning: dto.meaning ?? null,
        onyomi: dto.onyomi ?? null,
        kunyomi: dto.kunyomi ?? null,
        explanation: dto.explanation ?? null,
        wordsJson,
        exampleJp: dto.exampleJp ?? null,
        exampleId: dto.exampleId ?? null,
      },
    });
  }
}
