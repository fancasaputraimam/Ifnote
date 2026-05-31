import { Injectable, Logger } from "@nestjs/common";
import { loadEnv } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";
import { decryptSecret } from "../common/crypto";
import { isOwnerUser } from "../common/auth/owner";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Batas waktu satu panggilan ke provider AI. Lewat ini → abort + error rapi. */
const AI_FETCH_TIMEOUT_MS = 30_000;

export interface AiChatJsonResult<T = unknown> {
  ok: boolean;
  source: "ai" | "mock";
  data?: T;
  message?: string;
}

/**
 * Effective AI configuration for one request. Either resolved from the
 * user's encrypted settings or, if the user hasn't configured anything,
 * from the server-side `.env` (Heroku Config Vars in production).
 */
interface ResolvedAiConfig {
  apiKey: string;
  baseUrl: string;
  modelId: string;
  requestFormat: "openai" | "azure" | "custom";
  source: "user" | "env";
  useRealAi: boolean;
}

/**
 * Thin wrapper around an OpenAI-compatible chat-completions endpoint.
 *
 * - All AI calls go through here.
 * - Per-user encrypted keys take precedence over the server-side env key.
 * - If neither is set, or the call fails, callers MUST be ready to fall
 *   back to a mock implementation. This service never throws.
 * - Responses are forced to JSON via response_format=json_object when the
 *   provider format is "openai" or "azure".
 */
@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly env = loadEnv();

  constructor(private readonly prisma: PrismaService) {}

  /** True if the *server* is globally configured (env-level fallback). */
  isConfigured(): boolean {
    return !!this.env.ai.apiKey;
  }

  /**
   * Resolve the effective config for a given user.
   *
   * Hierarchy:
   *   1. Owner dengan key personal + useRealAi=true → pakai key owner
   *   2. Server env (AI_API_KEY)                    → pakai env key
   *   3. Owner-key sebagai server-wide fallback     → pakai key owner
   *      (cuma kalau env kosong; supaya non-owner bisa tetap pakai AI)
   *   4. Selain itu                                  → null (mock fallback)
   *
   * Catatan tentang `useRealAi`:
   *  - Owner kontrol toggle ini di Settings; OFF berarti owner ingin
   *    semua request mereka pakai mock dulu.
   *  - Non-owner tidak bisa edit toggle ini, jadi kita lewatkan dan
   *    langsung fallback ke env atau owner-as-server-key.
   */
  async resolveConfig(userId: string): Promise<ResolvedAiConfig | null> {
    let userKey: string | null = null;
    let userBase: string | null = null;
    let userModel: string | null = null;
    let userFormat: ResolvedAiConfig["requestFormat"] | null = null;
    let useRealAi = false;
    let isOwner = false;

    try {
      const u = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          email: true,
          settings: {
            select: {
              aiApiKeyEnc: true,
              aiBaseUrl: true,
              aiModelId: true,
              aiRequestFormat: true,
              useRealAi: true,
            },
          },
        },
      });
      if (u) {
        isOwner = isOwnerUser({ role: u.role, email: u.email });
        const s = u.settings;
        if (s) {
          useRealAi = s.useRealAi;
          userBase = s.aiBaseUrl;
          userModel = s.aiModelId;
          userFormat = (s.aiRequestFormat as ResolvedAiConfig["requestFormat"]) ?? null;
          if (s.aiApiKeyEnc) {
            try {
              userKey = decryptSecret(s.aiApiKeyEnc, this.env.jwt.secret);
            } catch (e) {
              // Bad ciphertext or rotated secret. Don't propagate the
              // plaintext error; just degrade to fallback.
              this.logger.warn(
                `Failed to decrypt user AI key for ${userId}: ${(e as Error).message}`,
              );
            }
          }
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to load user settings for AI: ${(e as Error).message}`);
    }

    // Path 1: owner pakai key personal mereka, asal toggle real-AI ON.
    if (isOwner && useRealAi && userKey) {
      return {
        apiKey: userKey,
        baseUrl: userBase ?? this.env.ai.baseUrl,
        modelId: userModel ?? this.env.ai.modelId,
        requestFormat: userFormat ?? this.env.ai.requestFormat,
        source: "user",
        useRealAi: true,
      };
    }

    // Path "owner mute": owner sengaja OFF "Use Real AI" — hormati.
    // Tidak ber-cascade ke env / owner-as-server.
    if (isOwner && !useRealAi) {
      return null;
    }

    // Path 2: server env fallback (Heroku Config Vars di production).
    if (this.env.ai.apiKey) {
      return {
        apiKey: this.env.ai.apiKey,
        baseUrl: this.env.ai.baseUrl,
        modelId: this.env.ai.modelId,
        requestFormat: this.env.ai.requestFormat,
        source: "env",
        useRealAi: true,
      };
    }

    // Path 3: kalau env kosong, pakai key milik owner sebagai server-wide
    // key (cuma untuk non-owner). Sesuai spec PART 5: user biasa boleh
    // pakai fitur AI "kalau admin sudah mengaktifkannya".
    if (!isOwner) {
      const ownerCfg = await this.loadOwnerServerConfig();
      if (ownerCfg) return ownerCfg;
    }

    return null;
  }

  /**
   * Ambil config AI dari akun owner untuk dipakai sebagai server-wide
   * fallback ketika env AI_API_KEY tidak diset. Hanya aktif kalau owner
   * punya `aiApiKeyEnc` dan `useRealAi=true`.
   *
   * Kalau ada lebih dari satu owner (mis. seed + email rule), pilih yang
   * paling lama (akun pertama wins).
   */
  private async loadOwnerServerConfig(): Promise<ResolvedAiConfig | null> {
    try {
      const owner = await this.prisma.user.findFirst({
        where: { role: "owner" },
        orderBy: { createdAt: "asc" },
        select: {
          settings: {
            select: {
              aiApiKeyEnc: true,
              aiBaseUrl: true,
              aiModelId: true,
              aiRequestFormat: true,
              useRealAi: true,
            },
          },
        },
      });
      const s = owner?.settings;
      if (!s?.aiApiKeyEnc || !s.useRealAi) return null;

      let plain: string;
      try {
        plain = decryptSecret(s.aiApiKeyEnc, this.env.jwt.secret);
      } catch (e) {
        this.logger.warn(
          `Failed to decrypt owner AI key for server fallback: ${(e as Error).message}`,
        );
        return null;
      }
      return {
        apiKey: plain,
        baseUrl: s.aiBaseUrl ?? this.env.ai.baseUrl,
        modelId: s.aiModelId ?? this.env.ai.modelId,
        requestFormat:
          (s.aiRequestFormat as ResolvedAiConfig["requestFormat"]) ??
          this.env.ai.requestFormat,
        source: "env",
        useRealAi: true,
      };
    } catch (e) {
      this.logger.warn(
        `Failed to load owner config for server fallback: ${(e as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Make a JSON-formatted chat completion request. Returns parsed JSON
   * or `{ ok: false, message }` if we couldn't reach a usable result.
   * Caller is responsible for converting `ok=false` into an HTTP error.
   */
  async chatJson<T = unknown>(
    userId: string,
    mode: string,
    system: string,
    user: string,
  ): Promise<AiChatJsonResult<T>> {
    const cfg = await this.resolveConfig(userId);
    if (!cfg) {
      await this.log(userId, mode, user, "fallback", "AI not configured / Use Real AI off");
      return { ok: false, source: "mock", message: "AI belum diatur. Aktifkan dan isi API key di Settings." };
    }

    const url = this.buildUrl(cfg);
    const body = this.buildBody(cfg, system, user);
    const headers = this.buildHeaders(cfg);

    // Hard timeout: tanpa ini, provider yang hang membuat request
    // menggantung tanpa batas — koneksi Node tertahan dan toast loading
    // di frontend berputar selamanya. AbortController membatalkan fetch
    // dan jatuh ke catch di bawah (jadi error rapi, bukan hang).
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        this.logger.warn(
          `AI HTTP ${res.status} (${mode}, source=${cfg.source}): ${text.slice(0, 200)}`,
        );
        await this.log(userId, mode, user, "error", `HTTP ${res.status}`);
        // Map status code to user-facing message in Indonesian.
        let message = `AI provider HTTP ${res.status}`;
        if (res.status === 429) {
          message = "AI provider menolak: rate limit / quota habis. Coba lagi nanti atau ganti model.";
        } else if (res.status === 401 || res.status === 403) {
          message = "AI provider menolak API key. Periksa key di Settings.";
        } else if (res.status === 404) {
          message = "AI provider tidak menemukan model. Periksa Base URL & Model ID.";
        } else if (res.status >= 500) {
          message = "AI provider sedang bermasalah. Coba lagi nanti.";
        }
        return { ok: false, source: "mock", message };
      }
      const text = await res.text();
      let json: { choices?: { message?: { content?: string } }[] };
      try {
        json = this.parseChatResponse(text) as {
          choices?: { message?: { content?: string } }[];
        };
      } catch (e) {
        this.logger.warn(
          `AI parse failed (${mode}): ${(e as Error).message}; preview: ${text.slice(0, 200)}`,
        );
        await this.log(userId, mode, user, "error", "Invalid response shape");
        return { ok: false, source: "mock", message: "AI mengembalikan format tidak valid" };
      }
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        await this.log(userId, mode, user, "error", "Empty AI response");
        return { ok: false, source: "mock", message: "AI tidak mengembalikan jawaban" };
      }
      let parsed: T;
      try {
        parsed = JSON.parse(content) as T;
      } catch {
        // Provider sometimes wraps JSON in markdown code fences:
        //   ```json\n{...}\n```
        const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced && fenced[1]) {
          try {
            parsed = JSON.parse(fenced[1].trim()) as T;
            await this.log(userId, mode, user, "ok", undefined, content);
            return { ok: true, source: "ai", data: parsed };
          } catch {
            // fall through to error
          }
        }
        // As a last resort, try to find a top-level JSON object inside the content.
        const braceMatch = content.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          try {
            parsed = JSON.parse(braceMatch[0]) as T;
            await this.log(userId, mode, user, "ok", undefined, content);
            return { ok: true, source: "ai", data: parsed };
          } catch {
            // give up
          }
        }
        this.logger.warn(
          `AI content not JSON (${mode}); preview: ${content.slice(0, 300)}`,
        );
        await this.log(userId, mode, user, "error", "Invalid JSON from AI");
        return { ok: false, source: "mock", message: "AI mengembalikan format tidak valid" };
      }
      await this.log(userId, mode, user, "ok", undefined, content);
      return { ok: true, source: "ai", data: parsed };
    } catch (err) {
      const aborted = (err as Error).name === "AbortError";
      const detail = aborted
        ? `timeout setelah ${AI_FETCH_TIMEOUT_MS / 1000}s`
        : (err as Error).message;
      this.logger.error(`AI call failed (${mode}): ${detail}`);
      await this.log(userId, mode, user, "error", detail);
      return {
        ok: false,
        source: "mock",
        message: aborted
          ? "AI terlalu lama merespon. Coba lagi atau ganti model."
          : "AI tidak dapat dihubungi",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(cfg: ResolvedAiConfig): string {
    if (cfg.requestFormat === "azure") {
      // Azure expects deployment ID in the path:
      //   {baseUrl}/openai/deployments/{deployment}/chat/completions?api-version=...
      const base = cfg.baseUrl.replace(/\/+$/, "");
      return `${base}/openai/deployments/${cfg.modelId}/chat/completions?api-version=2024-02-15-preview`;
    }
    return `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  }

  private buildHeaders(cfg: ResolvedAiConfig): Record<string, string> {
    if (cfg.requestFormat === "azure") {
      return {
        "Content-Type": "application/json",
        "api-key": cfg.apiKey,
      };
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    };
  }

  private buildBody(cfg: ResolvedAiConfig, system: string, user: string) {
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
    const body: Record<string, unknown> = {
      model: cfg.modelId,
      messages,
      temperature: 0.4,
      // Cegah provider balikin SSE stream. Beberapa provider (terutama proxy
      // OpenAI-compatible) default ke streaming, sehingga response jadi
      // "data: {...}\n\n" yang tidak bisa di-parse JSON.parse.
      stream: false,
    };
    if (cfg.requestFormat !== "custom") {
      body.response_format = { type: "json_object" };
    }
    return body;
  }

  /**
   * Parse response text. Provider yang "benar" balikin JSON object utuh,
   * tapi sebagian (terutama proxy OpenAI-compatible) tetap streaming
   * walaupun kita kirim `stream:false`. Saat itu terjadi, output-nya
   * berupa SSE chunks ("data: {...}\n\n" + "data: [DONE]\n\n"). Kita
   * coba dua jalur: parse JSON langsung, atau gabungkan delta dari SSE.
   */
  private parseChatResponse(text: string): unknown {
    // Path 1: pure JSON
    try {
      return JSON.parse(text);
    } catch {
      // not JSON — fall through to SSE handling
    }

    // Path 2: SSE stream
    if (!text.includes("data:")) {
      throw new Error("Response bukan JSON dan bukan SSE stream");
    }

    const lines = text.split(/\r?\n/).filter((l) => l.startsWith("data:"));
    let combinedContent = "";
    let lastFullChoice: { message?: { content?: string } } | null = null;

    for (const line of lines) {
      const payload = line.slice("data:".length).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const obj = JSON.parse(payload) as {
          choices?: Array<{
            delta?: { content?: string };
            message?: { content?: string };
          }>;
        };
        const ch = obj.choices?.[0];
        if (!ch) continue;
        // Streaming chunks have `delta.content`, non-streaming have `message.content`
        if (ch.delta?.content) combinedContent += ch.delta.content;
        if (ch.message?.content) lastFullChoice = ch as { message: { content: string } };
      } catch {
        // Skip malformed chunk; SSE keep-alives sometimes inject blank lines.
      }
    }

    if (lastFullChoice) {
      return { choices: [lastFullChoice] };
    }
    if (combinedContent) {
      return { choices: [{ message: { content: combinedContent } }] };
    }
    throw new Error("SSE stream tidak menghasilkan content");
  }

  private async log(
    userId: string,
    mode: string,
    input: string,
    status: "ok" | "error" | "fallback",
    errorMessage?: string,
    output?: string,
  ): Promise<void> {
    try {
      await this.prisma.aiLog.create({
        data: {
          userId,
          mode,
          inputPreview: input.slice(0, 280),
          outputPreview: output ? output.slice(0, 280) : null,
          status,
          errorMessage: errorMessage ? errorMessage.slice(0, 500) : null,
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to write AiLog: ${(e as Error).message}`);
    }
  }
}
