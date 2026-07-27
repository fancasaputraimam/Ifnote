import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CatatanQueryDto } from "./dto";

interface CatatanItem {
  id: string;
  noteType: "kotoba" | "bunpou";
  jpOrPattern: string;
  meaning: string;
  level: string | null;
  mastery: string;
  tags: string[];
  example: string | null;
  detail: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CatatanService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, q: CatatanQueryDto) {
    const page = q.page && q.page > 0 ? q.page : 1;
    const limit = q.limit && q.limit > 0 ? q.limit : 20;
    const skip = (page - 1) * limit;
    const search = q.search?.trim();

    const masteryFilter = (() => {
      if (!q.status) return undefined;
      if (q.status === "review") return { mastery: { in: ["mid", "weak"] } };
      if (q.status === "new") return undefined; // "new" handled at app level (no specific mastery)
      return { mastery: q.status };
    })();

    const baseWhere = (table: "kotoba" | "bunpou"): Prisma.KotobaWhereInput => {
      const w: Prisma.KotobaWhereInput = { userId };
      if (q.level) w.level = q.level;
      if (masteryFilter) Object.assign(w, masteryFilter);

      if (search) {
        const ci: Prisma.QueryMode = "insensitive";
        if (table === "kotoba") {
          w.OR = [
            { jp: { contains: search, mode: ci } },
            { romaji: { contains: search, mode: ci } },
            { meaning: { contains: search, mode: ci } },
            { tags: { has: search } },
          ];
        } else {
          // For bunpou we need a separate where; filtered in caller. Placeholder.
        }
      }
      return w;
    };

    const bunpouWhere = ((): Prisma.BunpouWhereInput => {
      const w: Prisma.BunpouWhereInput = { userId };
      if (q.level) w.level = q.level;
      if (masteryFilter) Object.assign(w, masteryFilter);
      if (search) {
        const ci: Prisma.QueryMode = "insensitive";
        w.OR = [
          { pattern: { contains: search, mode: ci } },
          { meaning: { contains: search, mode: ci } },
          { formula: { contains: search, mode: ci } },
          { tags: { has: search } },
        ];
      }
      return w;
    })();

    const wantKotoba = !q.type || q.type === "all" || q.type === "kotoba";
    const wantBunpou = !q.type || q.type === "all" || q.type === "bunpou";

    const [kotoba, bunpou] = await Promise.all([
      wantKotoba
        ? this.prisma.kotoba.findMany({
            where: baseWhere("kotoba"),
            orderBy: { updatedAt: "desc" },
          })
        : Promise.resolve([]),
      wantBunpou
        ? this.prisma.bunpou.findMany({
            where: bunpouWhere,
            orderBy: { updatedAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    const all: CatatanItem[] = [
      ...kotoba.map((k): CatatanItem => ({
        id: k.id,
        noteType: "kotoba",
        jpOrPattern: k.jp,
        meaning: k.meaning,
        level: k.level,
        mastery: k.mastery,
        tags: k.tags,
        example: k.normalExample ?? k.beginnerExample ?? null,
        detail: {
          reading: k.reading,
          readingRuby: k.readingRuby,
          romaji: k.romaji,
          type: k.type,
          beginnerExample: k.beginnerExample,
          beginnerExampleReading: k.beginnerExampleReading,
          beginnerExampleMeaning: k.beginnerExampleMeaning,
          normalExample: k.normalExample,
          normalExampleReading: k.normalExampleReading,
          normalExampleMeaning: k.normalExampleMeaning,
          furiganaExample: k.furiganaExample,
          exampleReading: k.exampleReading,
          exampleMeaning: k.exampleMeaning,
        },
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
      })),
      ...bunpou.map((b): CatatanItem => ({
        id: b.id,
        noteType: "bunpou",
        jpOrPattern: b.pattern,
        meaning: b.meaning,
        level: b.level,
        mastery: b.mastery,
        tags: b.tags,
        example: b.normalExample ?? b.beginnerExample ?? null,
        detail: {
          reading: b.reading,
          readingRuby: b.readingRuby,
          formula: b.formula,
          usage: b.usage,
          beginnerExample: b.beginnerExample,
          beginnerExampleReading: b.beginnerExampleReading,
          beginnerExampleMeaning: b.beginnerExampleMeaning,
          normalExample: b.normalExample,
          normalExampleReading: b.normalExampleReading,
          normalExampleMeaning: b.normalExampleMeaning,
          furiganaExample: b.furiganaExample,
          exampleReading: b.exampleReading,
          exampleMeaning: b.exampleMeaning,
          note: b.note,
          commonMistake: b.commonMistake,
        },
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    ];

    all.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const total = all.length;
    const items = all.slice(skip, skip + limit);

    return {
      items,
      pagination: { page, limit, total },
    };
  }
}
