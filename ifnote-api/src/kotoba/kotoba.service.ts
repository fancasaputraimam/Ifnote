import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { appendHafalanOrder, retryOnUniqueViolation } from "../common/utils/hafalan-order.util";
import { CreateKotobaDto, UpdateKotobaDto } from "./dto";

@Injectable()
export class KotobaService {
  constructor(private readonly prisma: PrismaService) {}

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
          romaji: dto.romaji ?? null,
          meaning: dto.meaning,
          type: dto.type ?? null,
          level: dto.level ?? null,
          tags: dto.tags ?? [],
          beginnerExample: dto.beginnerExample ?? null,
          normalExample: dto.normalExample ?? null,
          furiganaExample: dto.furiganaExample ?? null,
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
        ...(dto.romaji !== undefined ? { romaji: dto.romaji } : {}),
        ...(dto.meaning !== undefined ? { meaning: dto.meaning } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
        ...(dto.beginnerExample !== undefined ? { beginnerExample: dto.beginnerExample } : {}),
        ...(dto.normalExample !== undefined ? { normalExample: dto.normalExample } : {}),
        ...(dto.furiganaExample !== undefined ? { furiganaExample: dto.furiganaExample } : {}),
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
}
