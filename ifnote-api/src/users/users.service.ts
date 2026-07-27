import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId, dailyTarget: 10 },
      update: {},
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: dto.displayName ?? null,
        avatarUrl: dto.avatarUrl ?? null,
        jlptGoal: dto.jlptGoal ?? null,
        dailyTarget: dto.dailyTarget ?? 10,
      },
      update: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.jlptGoal !== undefined ? { jlptGoal: dto.jlptGoal } : {}),
        ...(dto.dailyTarget !== undefined ? { dailyTarget: dto.dailyTarget } : {}),
      },
    });
  }
}
