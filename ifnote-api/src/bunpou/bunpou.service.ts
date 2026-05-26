import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { appendHafalanOrder, retryOnUniqueViolation } from "../common/utils/hafalan-order.util";
import { CreateBunpouDto, UpdateBunpouDto } from "./dto";

@Injectable()
export class BunpouService {
  constructor(private readonly prisma: PrismaService) {}

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
          meaning: dto.meaning,
          formula: dto.formula ?? null,
          usage: dto.usage ?? null,
          level: dto.level ?? null,
          tags: dto.tags ?? [],
          beginnerExample: dto.beginnerExample ?? null,
          normalExample: dto.normalExample ?? null,
          furiganaExample: dto.furiganaExample ?? null,
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
        ...(dto.meaning !== undefined ? { meaning: dto.meaning } : {}),
        ...(dto.formula !== undefined ? { formula: dto.formula } : {}),
        ...(dto.usage !== undefined ? { usage: dto.usage } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
        ...(dto.beginnerExample !== undefined ? { beginnerExample: dto.beginnerExample } : {}),
        ...(dto.normalExample !== undefined ? { normalExample: dto.normalExample } : {}),
        ...(dto.furiganaExample !== undefined ? { furiganaExample: dto.furiganaExample } : {}),
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
}
