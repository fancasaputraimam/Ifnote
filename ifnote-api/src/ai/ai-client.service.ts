import { Injectable, Logger } from "@nestjs/common";
import { loadEnv } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiChatJsonResult<T = unknown> {
  ok: boolean;
  source: "ai" | "mock";
  data?: T;
  message?: string;
}

/**
 * Thin wrapper around an OpenAI-compatible chat-completions endpoint.
 *
 * - All AI calls go through here.
 * - If AI_API_KEY is missing or the call fails, callers MUST be ready to
 *   fall back to a mock implementation. This service never throws.
 * - Responses are forced to JSON via response_format=json_object when the
 *   provider format is "openai" or "azure".
 */
@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly env = loadEnv();

  constructor(private readonly prisma: PrismaService) {}

  isConfigured(): boolean {
    return !!this.env.ai.apiKey;
  }

  /**
   * Make a JSON-formatted chat completion request. Returns parsed JSON
   * or { ok: false, message } if we couldn't reach a usable result.
   */
  async chatJson<T = unknown>(
    userId: string,
    mode: string,
    system: string,
    user: string,
  ): Promise<AiChatJsonResult<T>> {
    if (!this.isConfigured()) {
      await this.log(userId, mode, user, "fallback", "AI_API_KEY not set");
      return { ok: false, source: "mock", message: "AI not configured" };
    }

    const url = this.buildUrl();
    const body = this.buildBody(system, user);
    const headers = this.buildHeaders();

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        this.logger.warn(`AI HTTP ${res.status} (${mode}): ${text.slice(0, 200)}`);
        await this.log(userId, mode, user, "error", `HTTP ${res.status}`);
        return { ok: false, source: "mock", message: `AI HTTP ${res.status}` };
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        await this.log(userId, mode, user, "error", "Empty AI response");
        return { ok: false, source: "mock", message: "Empty AI response" };
      }
      let parsed: T;
      try {
        parsed = JSON.parse(content) as T;
      } catch {
        await this.log(userId, mode, user, "error", "Invalid JSON from AI");
        return { ok: false, source: "mock", message: "Invalid JSON from AI" };
      }
      await this.log(userId, mode, user, "ok", undefined, content);
      return { ok: true, source: "ai", data: parsed };
    } catch (err) {
      this.logger.error(`AI call failed (${mode}): ${(err as Error).message}`);
      await this.log(userId, mode, user, "error", (err as Error).message);
      return { ok: false, source: "mock", message: "AI call failed" };
    }
  }

  private buildUrl(): string {
    if (this.env.ai.requestFormat === "azure") {
      // Azure expects deployment ID in the path:
      //   {baseUrl}/openai/deployments/{deployment}/chat/completions?api-version=...
      const base = this.env.ai.baseUrl.replace(/\/+$/, "");
      const deployment = this.env.ai.modelId;
      return `${base}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;
    }
    return `${this.env.ai.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  }

  private buildHeaders(): Record<string, string> {
    if (this.env.ai.requestFormat === "azure") {
      return {
        "Content-Type": "application/json",
        "api-key": this.env.ai.apiKey ?? "",
      };
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.env.ai.apiKey ?? ""}`,
    };
  }

  private buildBody(system: string, user: string) {
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
    const body: Record<string, unknown> = {
      model: this.env.ai.modelId,
      messages,
      temperature: 0.4,
    };
    if (this.env.ai.requestFormat !== "custom") {
      body.response_format = { type: "json_object" };
    }
    return body;
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
