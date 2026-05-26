import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSettingsDto } from "./dto";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async update(userId: string, dto: UpdateSettingsDto) {
    // Server AI_API_KEY is never exposed via this endpoint, and per-user
    // keys are NOT accepted here (security: avoid plaintext storage).
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: dto.theme ?? "system",
        jpMode: dto.jpMode ?? "beginner",
        onboardingSeen: dto.onboardingSeen ?? false,
        aiProvider: dto.aiProvider ?? null,
        aiBaseUrl: dto.aiBaseUrl ?? null,
        aiModelId: dto.aiModelId ?? null,
        aiRequestFormat: dto.aiRequestFormat ?? "openai",
        useRealAi: dto.useRealAi ?? false,
      },
      update: {
        ...(dto.theme !== undefined ? { theme: dto.theme } : {}),
        ...(dto.jpMode !== undefined ? { jpMode: dto.jpMode } : {}),
        ...(dto.onboardingSeen !== undefined ? { onboardingSeen: dto.onboardingSeen } : {}),
        ...(dto.aiProvider !== undefined ? { aiProvider: dto.aiProvider } : {}),
        ...(dto.aiBaseUrl !== undefined ? { aiBaseUrl: dto.aiBaseUrl } : {}),
        ...(dto.aiModelId !== undefined ? { aiModelId: dto.aiModelId } : {}),
        ...(dto.aiRequestFormat !== undefined ? { aiRequestFormat: dto.aiRequestFormat } : {}),
        ...(dto.useRealAi !== undefined ? { useRealAi: dto.useRealAi } : {}),
      },
    });
  }
}
