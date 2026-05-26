import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ImportBackupDto } from "./dto";

interface ExportPayload {
  version: 1;
  exportedAt: string;
  data: {
    kotoba: unknown[];
    bunpou: unknown[];
    hafalanOrder: unknown[];
    quizProgress: unknown[];
    settings: unknown;
    kanjiCache: unknown[];
  };
}

@Injectable()
export class BackupService {
  constructor(private readonly prisma: PrismaService) {}

  async exportData(userId: string): Promise<ExportPayload> {
    const [kotoba, bunpou, hafalanOrder, quizProgress, settings, kanjiCache] = await Promise.all([
      this.prisma.kotoba.findMany({ where: { userId } }),
      this.prisma.bunpou.findMany({ where: { userId } }),
      this.prisma.hafalanOrder.findMany({ where: { userId }, orderBy: { orderIndex: "asc" } }),
      this.prisma.quizProgress.findMany({ where: { userId } }),
      this.prisma.userSettings.findUnique({ where: { userId } }),
      this.prisma.kanjiCache.findMany({ where: { userId } }),
    ]);

    // Strip server-side AI secrets even from settings (none stored in our schema today,
    // but defensive: never include passwordHash / API keys).
    const sanitisedSettings = settings
      ? {
          theme: settings.theme,
          jpMode: settings.jpMode,
          onboardingSeen: settings.onboardingSeen,
          aiProvider: settings.aiProvider,
          aiBaseUrl: settings.aiBaseUrl,
          aiModelId: settings.aiModelId,
          aiRequestFormat: settings.aiRequestFormat,
          useRealAi: settings.useRealAi,
        }
      : null;

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        kotoba,
        bunpou,
        hafalanOrder,
        quizProgress,
        settings: sanitisedSettings,
        kanjiCache,
      },
    };
  }

  async importData(userId: string, dto: ImportBackupDto) {
    const payload = dto.data as Partial<ExportPayload["data"]> & { version?: number };
    if (!payload || typeof payload !== "object") {
      throw new BadRequestException("Payload tidak valid");
    }
    const replace = !!dto.replace;

    if (replace) {
      await this.prisma.$transaction([
        this.prisma.hafalanOrder.deleteMany({ where: { userId } }),
        this.prisma.quizProgress.deleteMany({ where: { userId } }),
        this.prisma.kanjiCache.deleteMany({ where: { userId } }),
        this.prisma.kotoba.deleteMany({ where: { userId } }),
        this.prisma.bunpou.deleteMany({ where: { userId } }),
      ]);
    }

    const counts = { kotoba: 0, bunpou: 0, hafalanOrder: 0, quizProgress: 0, kanjiCache: 0 };

    if (Array.isArray(payload.kotoba)) {
      for (const k of payload.kotoba) {
        if (!k || typeof k !== "object") continue;
        const row = k as Record<string, unknown>;
        if (typeof row.jp !== "string" || typeof row.meaning !== "string") continue;
        try {
          await this.prisma.kotoba.create({
            data: {
              userId,
              jp: String(row.jp),
              meaning: String(row.meaning),
              romaji: typeof row.romaji === "string" ? row.romaji : null,
              type: typeof row.type === "string" ? row.type : null,
              level: typeof row.level === "string" ? row.level : null,
              tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
              beginnerExample: typeof row.beginnerExample === "string" ? row.beginnerExample : null,
              normalExample: typeof row.normalExample === "string" ? row.normalExample : null,
              furiganaExample: typeof row.furiganaExample === "string" ? row.furiganaExample : null,
              exampleMeaning: typeof row.exampleMeaning === "string" ? row.exampleMeaning : null,
              mastery: typeof row.mastery === "string" ? row.mastery : "mid",
            },
          });
          counts.kotoba++;
        } catch {
          // skip invalid row
        }
      }
    }

    if (Array.isArray(payload.bunpou)) {
      for (const b of payload.bunpou) {
        if (!b || typeof b !== "object") continue;
        const row = b as Record<string, unknown>;
        if (typeof row.pattern !== "string" || typeof row.meaning !== "string") continue;
        try {
          await this.prisma.bunpou.create({
            data: {
              userId,
              pattern: String(row.pattern),
              meaning: String(row.meaning),
              formula: typeof row.formula === "string" ? row.formula : null,
              usage: typeof row.usage === "string" ? row.usage : null,
              level: typeof row.level === "string" ? row.level : null,
              tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
              beginnerExample: typeof row.beginnerExample === "string" ? row.beginnerExample : null,
              normalExample: typeof row.normalExample === "string" ? row.normalExample : null,
              furiganaExample: typeof row.furiganaExample === "string" ? row.furiganaExample : null,
              exampleMeaning: typeof row.exampleMeaning === "string" ? row.exampleMeaning : null,
              note: typeof row.note === "string" ? row.note : null,
              commonMistake: typeof row.commonMistake === "string" ? row.commonMistake : null,
              mastery: typeof row.mastery === "string" ? row.mastery : "mid",
            },
          });
          counts.bunpou++;
        } catch {
          // skip invalid row
        }
      }
    }

    // After importing notes, rebuild HafalanOrder from scratch (append-only).
    // Note: the imported hafalanOrder *itself* may reference IDs we no longer
    // have; safest is to skip the imported order rows and rebuild based on
    // the current user's notes. Append by createdAt asc.
    const allKotoba = await this.prisma.kotoba.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    const allBunpou = await this.prisma.bunpou.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    const lastIdx = await this.prisma.hafalanOrder.aggregate({
      where: { userId },
      _max: { orderIndex: true },
    });
    let next = (lastIdx._max.orderIndex ?? 0) + 1;

    for (const k of allKotoba) {
      const dup = await this.prisma.hafalanOrder.findUnique({
        where: { uniq_user_item: { userId, itemType: "kotoba", itemId: k.id } },
        select: { id: true },
      });
      if (dup) continue;
      await this.prisma.hafalanOrder.create({
        data: { userId, itemType: "kotoba", itemId: k.id, orderIndex: next },
      });
      next++;
      counts.hafalanOrder++;
    }
    for (const b of allBunpou) {
      const dup = await this.prisma.hafalanOrder.findUnique({
        where: { uniq_user_item: { userId, itemType: "bunpou", itemId: b.id } },
        select: { id: true },
      });
      if (dup) continue;
      await this.prisma.hafalanOrder.create({
        data: { userId, itemType: "bunpou", itemId: b.id, orderIndex: next },
      });
      next++;
      counts.hafalanOrder++;
    }

    if (Array.isArray(payload.quizProgress)) {
      for (const q of payload.quizProgress) {
        if (!q || typeof q !== "object") continue;
        const row = q as Record<string, unknown>;
        if (typeof row.quizType !== "string") continue;
        await this.prisma.quizProgress.upsert({
          where: { uniq_user_quiztype: { userId, quizType: row.quizType } },
          create: {
            userId,
            quizType: row.quizType,
            correctCount: Number(row.correctCount) || 0,
            wrongCount: Number(row.wrongCount) || 0,
            totalAnswered: Number(row.totalAnswered) || 0,
            lastScore: row.lastScore != null ? Number(row.lastScore) : null,
          },
          update: {
            correctCount: Number(row.correctCount) || 0,
            wrongCount: Number(row.wrongCount) || 0,
            totalAnswered: Number(row.totalAnswered) || 0,
            lastScore: row.lastScore != null ? Number(row.lastScore) : null,
          },
        });
        counts.quizProgress++;
      }
    }

    if (Array.isArray(payload.kanjiCache)) {
      for (const c of payload.kanjiCache) {
        if (!c || typeof c !== "object") continue;
        const row = c as Record<string, unknown>;
        if (typeof row.kanji !== "string") continue;
        await this.prisma.kanjiCache.upsert({
          where: { uniq_user_kanji: { userId, kanji: row.kanji } },
          create: {
            userId,
            kanji: row.kanji,
            meaning: typeof row.meaning === "string" ? row.meaning : null,
            onyomi: typeof row.onyomi === "string" ? row.onyomi : null,
            kunyomi: typeof row.kunyomi === "string" ? row.kunyomi : null,
            explanation: typeof row.explanation === "string" ? row.explanation : null,
            wordsJson: row.wordsJson ?? [],
            exampleJp: typeof row.exampleJp === "string" ? row.exampleJp : null,
            exampleId: typeof row.exampleId === "string" ? row.exampleId : null,
          },
          update: {
            meaning: typeof row.meaning === "string" ? row.meaning : null,
            onyomi: typeof row.onyomi === "string" ? row.onyomi : null,
            kunyomi: typeof row.kunyomi === "string" ? row.kunyomi : null,
            explanation: typeof row.explanation === "string" ? row.explanation : null,
            wordsJson: row.wordsJson ?? [],
            exampleJp: typeof row.exampleJp === "string" ? row.exampleJp : null,
            exampleId: typeof row.exampleId === "string" ? row.exampleId : null,
          },
        });
        counts.kanjiCache++;
      }
    }

    return { ok: true, replaced: replace, counts };
  }

  /**
   * Wipe all user data (kotoba, bunpou, hafalan order, quiz progress, kanji cache).
   * Settings + Profile + User remain. The user is responsible for re-seeding
   * default content via the seed script if desired.
   */
  async reset(userId: string) {
    await this.prisma.$transaction([
      this.prisma.hafalanOrder.deleteMany({ where: { userId } }),
      this.prisma.quizProgress.deleteMany({ where: { userId } }),
      this.prisma.kanjiCache.deleteMany({ where: { userId } }),
      this.prisma.kotoba.deleteMany({ where: { userId } }),
      this.prisma.bunpou.deleteMany({ where: { userId } }),
    ]);
    return { ok: true };
  }
}
