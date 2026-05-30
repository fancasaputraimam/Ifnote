import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  appendHafalanOrder,
  retryOnUniqueViolation,
} from "../common/utils/hafalan-order.util";
import {
  AddHafalanDto,
  HafalanMode,
  ShufflePreviewDto,
  UpdateMasteryDto,
} from "./dto";

export const SLIDE_SIZE = 20;

interface ResolvedItem {
  orderRefId: string;
  orderIndex: number;
  itemType: "kotoba" | "bunpou";
  itemId: string;
  jpOrPattern: string;
  /** Reading hiragana untuk kanji utama (untuk furigana). */
  reading: string | null;
  meaning: string;
  level: string | null;
  mastery: string;
  example: string | null;
  /** Reading hiragana untuk contoh kalimat. */
  exampleReading: string | null;
  /** Arti (terjemahan) contoh kalimat. */
  exampleMeaning: string | null;
}

@Injectable()
export class HafalanService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve hafalan order rows for a user filtered by mode, then join with
   * the actual Kotoba/Bunpou rows. Missing items are skipped (gap-tolerant
   * per PRD §8 rule 9). Sorted by orderIndex ascending.
   */
  private async resolveAll(userId: string, mode: HafalanMode = "mixed"): Promise<ResolvedItem[]> {
    const itemTypes: ("kotoba" | "bunpou")[] =
      mode === "kotoba" ? ["kotoba"] :
      mode === "bunpou" ? ["bunpou"] :
      ["kotoba", "bunpou"];

    const orderRows = await this.prisma.hafalanOrder.findMany({
      where: { userId, itemType: { in: itemTypes } },
      orderBy: { orderIndex: "asc" },
    });

    if (orderRows.length === 0) return [];

    const kotobaIds = orderRows.filter((r) => r.itemType === "kotoba").map((r) => r.itemId);
    const bunpouIds = orderRows.filter((r) => r.itemType === "bunpou").map((r) => r.itemId);

    const [kotoba, bunpou] = await Promise.all([
      kotobaIds.length
        ? this.prisma.kotoba.findMany({ where: { id: { in: kotobaIds }, userId } })
        : Promise.resolve([]),
      bunpouIds.length
        ? this.prisma.bunpou.findMany({ where: { id: { in: bunpouIds }, userId } })
        : Promise.resolve([]),
    ]);

    const kMap = new Map(kotoba.map((k) => [k.id, k]));
    const bMap = new Map(bunpou.map((b) => [b.id, b]));

    const resolved: ResolvedItem[] = [];
    for (const row of orderRows) {
      if (row.itemType === "kotoba") {
        const k = kMap.get(row.itemId);
        if (!k) continue; // skip gaps
        if (mode === "weak" && k.mastery !== "weak") continue;
        resolved.push({
          orderRefId: row.id,
          orderIndex: row.orderIndex,
          itemType: "kotoba",
          itemId: k.id,
          jpOrPattern: k.jp,
          reading: k.reading,
          meaning: k.meaning,
          level: k.level,
          mastery: k.mastery,
          example: k.normalExample ?? k.beginnerExample,
          // Reading harus cocok dengan example yang ditampilkan: kalau
          // normalExample dipakai -> normalExampleReading (fallback shared
          // exampleReading); kalau beginnerExample yang dipakai ->
          // beginnerExampleReading. JANGAN pakai reading kalimat lain.
          exampleReading: k.normalExample
            ? k.normalExampleReading ?? k.exampleReading
            : k.beginnerExampleReading,
          exampleMeaning: k.normalExample
            ? k.normalExampleMeaning ?? k.exampleMeaning
            : k.beginnerExampleMeaning ?? k.exampleMeaning,
        });
      } else {
        const b = bMap.get(row.itemId);
        if (!b) continue;
        if (mode === "weak" && b.mastery !== "weak") continue;
        resolved.push({
          orderRefId: row.id,
          orderIndex: row.orderIndex,
          itemType: "bunpou",
          itemId: b.id,
          jpOrPattern: b.pattern,
          reading: b.reading,
          meaning: b.meaning,
          level: b.level,
          mastery: b.mastery,
          example: b.normalExample ?? b.beginnerExample,
          exampleReading: b.normalExample
            ? b.normalExampleReading ?? b.exampleReading
            : b.beginnerExampleReading,
          exampleMeaning: b.normalExample
            ? b.normalExampleMeaning ?? b.exampleMeaning
            : b.beginnerExampleMeaning ?? b.exampleMeaning,
        });
      }
    }

    return resolved;
  }

  /**
   * Get one slide. Slide N = items[(N-1)*20 .. N*20).
   * Last slide may be shorter than 20 — never auto-fill from previous.
   */
  async getSlide(userId: string, mode: HafalanMode = "mixed", slide = 1) {
    const all = await this.resolveAll(userId, mode);
    const totalSlides = Math.max(1, Math.ceil(all.length / SLIDE_SIZE));
    if (slide < 1) slide = 1;
    if (slide > totalSlides) slide = totalSlides;
    const start = (slide - 1) * SLIDE_SIZE;
    const end = start + SLIDE_SIZE;
    const items = all.slice(start, end);
    return {
      mode,
      slide,
      slideSize: SLIDE_SIZE,
      totalSlides,
      totalItems: all.length,
      items,
    };
  }

  async getSlides(userId: string, mode: HafalanMode = "mixed") {
    const all = await this.resolveAll(userId, mode);
    const totalSlides = Math.max(1, Math.ceil(all.length / SLIDE_SIZE));
    const slides: Array<{ slide: number; from: number; to: number; count: number }> = [];
    for (let i = 0; i < totalSlides; i++) {
      const from = i * SLIDE_SIZE + 1;
      const to = Math.min((i + 1) * SLIDE_SIZE, all.length || 1);
      slides.push({
        slide: i + 1,
        from,
        to,
        count: Math.min(SLIDE_SIZE, Math.max(0, all.length - i * SLIDE_SIZE)),
      });
    }
    return {
      mode,
      slideSize: SLIDE_SIZE,
      totalSlides,
      totalItems: all.length,
      slides,
    };
  }

  /**
   * Manual add — append to MAX(orderIndex) + 1.
   * Idempotent on (userId, itemType, itemId).
   */
  async add(userId: string, dto: AddHafalanDto) {
    // Verify ownership of item before adding
    if (dto.itemType === "kotoba") {
      const k = await this.prisma.kotoba.findFirst({
        where: { id: dto.itemId, userId },
        select: { id: true },
      });
      if (!k) throw new NotFoundException("Kotoba tidak ditemukan");
    } else {
      const b = await this.prisma.bunpou.findFirst({
        where: { id: dto.itemId, userId },
        select: { id: true },
      });
      if (!b) throw new NotFoundException("Bunpou tidak ditemukan");
    }

    return retryOnUniqueViolation(async () => {
      await appendHafalanOrder(this.prisma, userId, dto.itemType, dto.itemId);
      return { ok: true };
    });
  }

  async updateMastery(userId: string, dto: UpdateMasteryDto) {
    if (dto.itemType === "kotoba") {
      const k = await this.prisma.kotoba.findFirst({
        where: { id: dto.itemId, userId },
        select: { id: true },
      });
      if (!k) throw new NotFoundException("Kotoba tidak ditemukan");
      return this.prisma.kotoba.update({
        where: { id: dto.itemId },
        data: { mastery: dto.mastery },
      });
    } else {
      const b = await this.prisma.bunpou.findFirst({
        where: { id: dto.itemId, userId },
        select: { id: true },
      });
      if (!b) throw new NotFoundException("Bunpou tidak ditemukan");
      return this.prisma.bunpou.update({
        where: { id: dto.itemId },
        data: { mastery: dto.mastery },
      });
    }
  }

  /**
   * Returns a shuffled VIEW of the current slide for the user.
   * Does NOT touch the database. Order is regenerated each call.
   */
  async shufflePreview(userId: string, dto: ShufflePreviewDto) {
    const mode = dto.mode ?? "mixed";
    const slide = dto.slide ?? 1;
    const slideData = await this.getSlide(userId, mode, slide);
    const items = [...slideData.items];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return { ...slideData, items, shuffled: true };
  }

  /**
   * Rebuild order from scratch. Heavy, user-initiated only (for repairing
   * a broken/imported order). Preserves all items but renumbers from 1.
   */
  async rebuildOrder(userId: string) {
    const orderRows = await this.prisma.hafalanOrder.findMany({
      where: { userId },
      orderBy: [{ createdAt: "asc" }, { orderIndex: "asc" }],
    });
    if (orderRows.length === 0) return { ok: true, count: 0 };

    // Two-pass renumber to avoid colliding with existing UNIQUE constraint:
    //   1) shift all rows to negative orderIndex
    //   2) write final ascending integers
    await this.prisma.$transaction([
      ...orderRows.map((r, i) =>
        this.prisma.hafalanOrder.update({
          where: { id: r.id },
          data: { orderIndex: -(i + 1) - orderRows.length },
        }),
      ),
    ]);
    await this.prisma.$transaction([
      ...orderRows.map((r, i) =>
        this.prisma.hafalanOrder.update({
          where: { id: r.id },
          data: { orderIndex: i + 1 },
        }),
      ),
    ]);
    return { ok: true, count: orderRows.length };
  }

  // Helper exposed to the bulk import code path (in AI module).
  async assertModeValid(mode: string | undefined): Promise<HafalanMode> {
    if (!mode) return "mixed";
    if (!["kotoba", "bunpou", "mixed", "weak"].includes(mode)) {
      throw new BadRequestException("Mode tidak valid");
    }
    return mode as HafalanMode;
  }
}
