import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { appendHafalanOrder, retryOnUniqueViolation } from "../common/utils/hafalan-order.util";
import { AiService } from "../ai/ai.service";
import { CreateBunpouDto, UpdateBunpouDto } from "./dto";

function bunpouHasExplanation(b: {
  formula: string | null;
  usage: string | null;
  note: string | null;
  commonMistake: string | null;
  beginnerExample: string | null;
  normalExample: string | null;
  furiganaExample: string | null;
}): boolean {
  return Boolean(
    (b.formula && b.formula.length > 0) ||
      (b.usage && b.usage.length > 0) ||
      (b.note && b.note.length > 0) ||
      (b.commonMistake && b.commonMistake.length > 0) ||
      (b.beginnerExample && b.beginnerExample.length > 0) ||
      (b.normalExample && b.normalExample.length > 0) ||
      (b.furiganaExample && b.furiganaExample.length > 0),
  );
}

@Injectable()
export class BunpouService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  list(userId: string) {
    return this.prisma.bunpou.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(userId: string, id: string) {
    const item = await this.prisma.bunpou.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException("Bunpou tidak ditemukan");
    return item;
  }

  async create(userId: string, dto: CreateBunpouDto) {
    return retryOnUniqueViolation(async () => {
      const created = await this.prisma.bunpou.create({
        data: {
          userId,
          pattern: dto.pattern,
          reading: dto.reading ?? null,
          meaning: dto.meaning,
          formula: dto.formula ?? null,
          usage: dto.usage ?? null,
          level: dto.level ?? null,
          tags: dto.tags ?? [],
          beginnerExample: dto.beginnerExample ?? null,
          normalExample: dto.normalExample ?? null,
          furiganaExample: dto.furiganaExample ?? null,
          exampleReading: dto.exampleReading ?? null,
          exampleMeaning: dto.exampleMeaning ?? null,
          note: dto.note ?? null,
          commonMistake: dto.commonMistake ?? null,
          mastery: dto.mastery ?? "mid",
        },
      });
      await appendHafalanOrder(this.prisma, userId, "bunpou", created.id);
      return created;
    });
  }

  async update(userId: string, id: string, dto: UpdateBunpouDto) {
    await this.getById(userId, id);
    return this.prisma.bunpou.update({
      where: { id },
      data: {
        ...(dto.pattern !== undefined ? { pattern: dto.pattern } : {}),
        ...(dto.reading !== undefined ? { reading: dto.reading } : {}),
        ...(dto.meaning !== undefined ? { meaning: dto.meaning } : {}),
        ...(dto.formula !== undefined ? { formula: dto.formula } : {}),
        ...(dto.usage !== undefined ? { usage: dto.usage } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
        ...(dto.beginnerExample !== undefined ? { beginnerExample: dto.beginnerExample } : {}),
        ...(dto.normalExample !== undefined ? { normalExample: dto.normalExample } : {}),
        ...(dto.furiganaExample !== undefined ? { furiganaExample: dto.furiganaExample } : {}),
        ...(dto.exampleReading !== undefined ? { exampleReading: dto.exampleReading } : {}),
        ...(dto.exampleMeaning !== undefined ? { exampleMeaning: dto.exampleMeaning } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.commonMistake !== undefined ? { commonMistake: dto.commonMistake } : {}),
        ...(dto.mastery !== undefined ? { mastery: dto.mastery } : {}),
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.$transaction([
      this.prisma.hafalanOrder.deleteMany({
        where: { userId, itemType: "bunpou", itemId: id },
      }),
      this.prisma.bunpou.delete({ where: { id } }),
    ]);
    return { ok: true };
  }

  /**
   * AI explanation cache logic (task spec PART 3 + PART 6 + PART 10).
   *
   * Memanggil AI hanya kalau item belum punya penjelasan. Jika AI sukses,
   * formula / usage / contoh / kesalahan umum disimpan ke DB lalu di-return.
   * Note: kita memilih TIDAK overwrite field yang sudah diisi user secara
   * manual.
   */
  async aiExplain(userId: string, id: string) {
    const item = await this.getById(userId, id);
    if (bunpouHasExplanation(item)) {
      return { item, generated: false as const };
    }

    const r = await this.ai.explainBunpouRich(userId, { pattern: item.pattern });
    const data = r.data as {
      meaning?: string;
      reading?: string;
      formulaPatterns?: string[];
      transformExamples?: Array<{ from?: string; to?: string }>;
      usage?: string[] | string;
      examples?: Array<{ jp?: string; reading?: string; meaning?: string }>;
      commonMistakes?: string[] | string;
      note?: string;
    };

    // Compose ke field DB yang ada. Frontend punya formatter yang bisa
    // re-parse formula menjadi line list, jadi kita serialize jadi multi-line
    // text.
    const patch: Record<string, string> = {};

    if (!item.formula) {
      const formulaLines = (data.formulaPatterns ?? []).filter(Boolean);
      const transformLines = (data.transformExamples ?? [])
        .filter((x) => x.from && x.to)
        .map((x) => `${x.from} → ${x.to}`);
      const composed = [
        ...formulaLines,
        transformLines.length ? "" : null,
        ...(transformLines.length ? ["Contoh perubahan:", ...transformLines] : []),
      ]
        .filter((x): x is string => x !== null)
        .join("\n");
      if (composed) patch.formula = composed;
    }

    if (!item.usage) {
      const usageText = Array.isArray(data.usage)
        ? data.usage.filter(Boolean).join("\n\n")
        : (data.usage ?? "");
      if (usageText) patch.usage = usageText;
    }

    if (!item.commonMistake) {
      const mistakes = Array.isArray(data.commonMistakes)
        ? data.commonMistakes
            .filter(Boolean)
            .map((m, i) => `${i + 1}. ${m}`)
            .join("\n")
        : (data.commonMistakes ?? "");
      if (mistakes) patch.commonMistake = mistakes;
    }

    if (!item.note && data.note) patch.note = data.note;
    if (!item.reading && data.reading) patch.reading = data.reading;

    const ex = (data.examples ?? [])[0];
    if (ex) {
      if (!item.beginnerExample && ex.jp) patch.beginnerExample = ex.jp;
      if (!item.normalExample && ex.jp) patch.normalExample = ex.jp;
      if (!item.exampleReading && ex.reading) patch.exampleReading = ex.reading;
      if (!item.furiganaExample && ex.reading) patch.furiganaExample = ex.reading;
      if (!item.exampleMeaning && ex.meaning) patch.exampleMeaning = ex.meaning;
    }

    if (Object.keys(patch).length === 0) {
      return { item, generated: false as const };
    }

    const updated = await this.prisma.bunpou.update({
      where: { id },
      data: patch,
    });
    return { item: updated, generated: true as const };
  }
}
