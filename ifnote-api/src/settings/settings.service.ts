import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSettingsDto } from "./dto";
import { encryptSecret, maskSecret } from "../common/crypto";
import { loadEnv } from "../config/env";
import { isOwnerUser, pickAiConfigKeys } from "../common/auth/owner";

/**
 * Public response shape. Bentuk-nya bercabang berdasarkan permission:
 *
 *  - Owner       : dapat semua field AI + canManageAi=true + maskedApiKey hint.
 *  - Non-owner   : hanya theme/jpMode/onboarding + canManageAi=false +
 *                  aiAvailable boolean (apakah server-side AI siap dipakai).
 *
 * `aiApiKeyEnc` (raw ciphertext) **tidak pernah** keluar dari service ini.
 * `aiApiKeyHint` cuma masked tail (mis. "sk-\u2022\u20221234").
 */
export interface OwnerSettingsResponse {
  id: string;
  userId: string;
  theme: string;
  jpMode: string;
  onboardingSeen: boolean;
  aiProvider: string | null;
  aiBaseUrl: string | null;
  aiModelId: string | null;
  aiRequestFormat: string;
  useRealAi: boolean;
  hasAiApiKey: boolean;
  aiApiKeyHint: string | null;
  canManageAi: true;
  /** True kalau backend secara umum bisa melayani AI (env atau owner key). */
  aiAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NormalSettingsResponse {
  id: string;
  userId: string;
  theme: string;
  jpMode: string;
  onboardingSeen: boolean;
  canManageAi: false;
  /** True kalau backend secara umum bisa melayani AI (env atau owner key). */
  aiAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicSettings = OwnerSettingsResponse | NormalSettingsResponse;

@Injectable()
export class SettingsService {
  private readonly env = loadEnv();

  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<PublicSettings> {
    const [user, row] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true },
      }),
      this.prisma.userSettings.upsert({
        where: { userId },
        create: { userId },
        update: {},
      }),
    ]);

    const owner = isOwnerUser(user);
    const aiAvailable = await this.isAiAvailable();
    return owner ? toOwnerPublic(row, aiAvailable) : toNormalPublic(row, aiAvailable);
  }

  async update(userId: string, dto: UpdateSettingsDto): Promise<PublicSettings> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });
    const owner = isOwnerUser(user);

    // PART 2 — non-owner tidak boleh menyentuh field AI sama sekali.
    // Reject keras pakai 403 supaya frontend yang nakal langsung gagal,
    // bukan diam-diam di-strip (silent strip = bug magnet).
    const aiKeysInBody = pickAiConfigKeys(dto as unknown as Record<string, unknown>);
    if (!owner && aiKeysInBody.length > 0) {
      throw new ForbiddenException("Only owner can manage AI configuration");
    }

    // Build the encrypted-key fields once; semantics:
    //   undefined  -> keep existing
    //   null       -> clear
    //   non-empty  -> encrypt + store + hint
    const aiKeyFields: {
      aiApiKeyEnc?: string | null;
      aiApiKeyHint?: string | null;
    } = {};
    if (owner) {
      if (dto.aiApiKey === null) {
        aiKeyFields.aiApiKeyEnc = null;
        aiKeyFields.aiApiKeyHint = null;
      } else if (typeof dto.aiApiKey === "string" && dto.aiApiKey.trim().length > 0) {
        const plain = dto.aiApiKey.trim();
        aiKeyFields.aiApiKeyEnc = encryptSecret(plain, this.env.jwt.secret);
        aiKeyFields.aiApiKeyHint = maskSecret(plain).slice(0, 8);
      }
    }

    // Field AI hanya ikut di update kalau user adalah owner.
    const aiUpdate = owner
      ? {
          ...(dto.aiProvider !== undefined ? { aiProvider: dto.aiProvider } : {}),
          ...(dto.aiBaseUrl !== undefined ? { aiBaseUrl: dto.aiBaseUrl } : {}),
          ...(dto.aiModelId !== undefined ? { aiModelId: dto.aiModelId } : {}),
          ...(dto.aiRequestFormat !== undefined
            ? { aiRequestFormat: dto.aiRequestFormat }
            : {}),
          ...(dto.useRealAi !== undefined ? { useRealAi: dto.useRealAi } : {}),
          ...aiKeyFields,
        }
      : {};

    const aiCreate = owner
      ? {
          aiProvider: dto.aiProvider ?? null,
          aiBaseUrl: dto.aiBaseUrl ?? null,
          aiModelId: dto.aiModelId ?? null,
          aiRequestFormat: dto.aiRequestFormat ?? "openai",
          useRealAi: dto.useRealAi ?? false,
          ...aiKeyFields,
        }
      : {};

    const row = await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: dto.theme ?? "system",
        jpMode: normalizeJpMode(dto.jpMode),
        onboardingSeen: dto.onboardingSeen ?? false,
        ...aiCreate,
      },
      update: {
        ...(dto.theme !== undefined ? { theme: dto.theme } : {}),
        ...(dto.jpMode !== undefined
          ? { jpMode: normalizeJpMode(dto.jpMode) }
          : {}),
        ...(dto.onboardingSeen !== undefined ? { onboardingSeen: dto.onboardingSeen } : {}),
        ...aiUpdate,
      },
    });

    const aiAvailable = await this.isAiAvailable();
    return owner ? toOwnerPublic(row, aiAvailable) : toNormalPublic(row, aiAvailable);
  }

  /**
   * AI dianggap "tersedia" kalau salah satu dari:
   *   1. Server punya AI_API_KEY di env (Heroku Config Vars).
   *   2. Owner sudah menyimpan key personal lewat settings.
   *
   * Ini bukan ground truth (bisa saja key invalid), tapi cukup buat
   * UI memutuskan apakah tombol AI pantas ditampilkan ke user biasa.
   */
  private async isAiAvailable(): Promise<boolean> {
    if (this.env.ai.apiKey && this.env.ai.apiKey.length > 0) return true;
    const owner = await this.prisma.user.findFirst({
      where: { role: "owner" },
      select: {
        settings: { select: { aiApiKeyEnc: true, useRealAi: true } },
      },
    });
    return !!owner?.settings?.aiApiKeyEnc && !!owner.settings.useRealAi;
  }
}

interface SettingsRow {
  id: string;
  userId: string;
  theme: string;
  jpMode: string;
  onboardingSeen: boolean;
  aiProvider: string | null;
  aiBaseUrl: string | null;
  aiModelId: string | null;
  aiRequestFormat: string;
  useRealAi: boolean;
  aiApiKeyEnc: string | null;
  aiApiKeyHint: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toOwnerPublic(row: SettingsRow, aiAvailable: boolean): OwnerSettingsResponse {
  return {
    id: row.id,
    userId: row.userId,
    theme: row.theme,
    jpMode: normalizeJpMode(row.jpMode),
    onboardingSeen: row.onboardingSeen,
    aiProvider: row.aiProvider,
    aiBaseUrl: row.aiBaseUrl,
    aiModelId: row.aiModelId,
    aiRequestFormat: row.aiRequestFormat,
    useRealAi: row.useRealAi,
    hasAiApiKey: !!row.aiApiKeyEnc,
    aiApiKeyHint: row.aiApiKeyHint,
    canManageAi: true,
    aiAvailable,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toNormalPublic(row: SettingsRow, aiAvailable: boolean): NormalSettingsResponse {
  return {
    id: row.id,
    userId: row.userId,
    theme: row.theme,
    jpMode: normalizeJpMode(row.jpMode),
    onboardingSeen: row.onboardingSeen,
    canManageAi: false,
    aiAvailable,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Translate semua nilai `jpMode` (canonical + legacy) ke nilai canonical
 * baru: "beginner" | "normal" | "pro".
 *
 * Canonical baru (apa adanya):
 *   "beginner" → "beginner"   (Pemula = kana only)
 *   "normal"   → "normal"     (Normal = kanji + furigana)
 *   "pro"      → "pro"        (Pro = kanji bersih)
 *
 * Legacy internal lama (skema kana/furigana/kanji):
 *   "kana"     → "beginner"
 *   "furigana" → "normal"
 *   "kanji"    → "pro"
 *
 * Legacy lain yang mungkin nyangkut di backup/cache:
 *   "advanced" / "clean" → "pro"
 *
 *   undefined / tak dikenal → "beginner" (default Pemula)
 */
function normalizeJpMode(value: unknown): "beginner" | "normal" | "pro" {
  if (value === "beginner" || value === "normal" || value === "pro") {
    return value;
  }
  if (value === "kana") return "beginner";
  if (value === "furigana") return "normal";
  if (value === "kanji") return "pro";
  if (value === "advanced" || value === "clean") return "pro";
  return "beginner";
}
