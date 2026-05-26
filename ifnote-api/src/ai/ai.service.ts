import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiClientService } from "./ai-client.service";
import { MockAi } from "./mock-ai";
import {
  AnalyzeSentenceDto,
  BulkKotobaDto,
  CorrectSentenceDto,
  CreateHafalanAiDto,
  ExplainBunpouDto,
  ExplainKotobaDto,
  GenerateQuizAiDto,
  MakeExampleDto,
} from "./dto";

const SYS_BASE =
  "Anda adalah tutor bahasa Jepang untuk pelajar Indonesia level N5/N4. " +
  "Selalu balas dalam JSON object yang sesuai dengan schema yang diminta. " +
  "Gunakan bahasa Indonesia sederhana untuk penjelasan. " +
  "Untuk furigana gunakan format <ruby>kanji<rt>kana</rt></ruby> atau " +
  "format kanji(kana) jika ruby tidak diminta.";

interface BulkPreviewItem {
  jp: string;
  status: "new" | "exists" | "manual";
  meaning?: string;
  romaji?: string;
  type?: string;
  level?: string;
  beginnerExample?: string;
}

@Injectable()
export class AiService {
  constructor(
    private readonly client: AiClientService,
    private readonly prisma: PrismaService,
  ) {}

  // -------- explain ----------------------------------------------------

  async explainKotoba(userId: string, dto: ExplainKotobaDto) {
    const sys = SYS_BASE +
      ' Schema: {"topic":"string","meaning":"string","type":"string","level":"N5|N4|N3|N2|N1","romaji":"string","example":"string","exampleMeaning":"string","note":"string"}';
    const usr = `Jelaskan kotoba: "${dto.jp}". Berikan arti singkat, jenis kata, level JLPT, romaji, satu contoh kalimat alami, terjemahan contoh, dan satu catatan penting.`;
    const r = await this.client.chatJson(userId, "explain-kotoba", sys, usr);
    return r.ok ? { source: "ai", data: r.data } : { source: "mock", data: MockAi.explainKotoba(dto.jp) };
  }

  async explainBunpou(userId: string, dto: ExplainBunpouDto) {
    const sys = SYS_BASE +
      ' Schema: {"pattern":"string","meaning":"string","formula":"string","usage":"string","example":"string","exampleMeaning":"string","commonMistake":"string"}';
    const usr = `Jelaskan pola bunpou: "${dto.pattern}". Berikan arti, formula, kapan dipakai, contoh kalimat alami, terjemahan, dan kesalahan umum.`;
    const r = await this.client.chatJson(userId, "explain-bunpou", sys, usr);
    return r.ok ? { source: "ai", data: r.data } : { source: "mock", data: MockAi.explainBunpou(dto.pattern) };
  }

  // -------- correct ----------------------------------------------------

  async correctSentence(userId: string, dto: CorrectSentenceDto) {
    const sys = SYS_BASE +
      ' Schema: {"input":"string","corrected":"string","explanation":"string","issues":[{"text":"string","suggestion":"string"}]}';
    const usr = `Periksa kalimat berikut. Jika ada kesalahan, perbaiki dan jelaskan singkat dalam Bahasa Indonesia. Kalimat: "${dto.sentence}"`;
    const r = await this.client.chatJson(userId, "correct-sentence", sys, usr);
    return r.ok ? { source: "ai", data: r.data } : { source: "mock", data: MockAi.correctSentence(dto.sentence) };
  }

  // -------- examples ---------------------------------------------------

  async makeExample(userId: string, dto: MakeExampleDto) {
    const sys = SYS_BASE +
      ' Schema: {"topic":"string","examples":[{"jp":"string","meaning":"string"}]}. Buat 3 contoh.';
    const usr = `Buat 3 contoh kalimat sederhana dengan topik/keyword: "${dto.topic}". Sertakan terjemahan Bahasa Indonesia.`;
    const r = await this.client.chatJson(userId, "make-example", sys, usr);
    return r.ok ? { source: "ai", data: r.data } : { source: "mock", data: MockAi.makeExample(dto.topic) };
  }

  // -------- quiz -------------------------------------------------------

  async generateQuiz(userId: string, dto: GenerateQuizAiDto) {
    const count = Math.max(1, Math.min(10, dto.count ?? 5));
    const sys = SYS_BASE +
      ' Schema: {"topic":"string","questions":[{"prompt":"string","choices":[{"id":"c0|c1|c2|c3","label":"string"}],"correctChoiceId":"string","explanation":"string"}]}';
    const usr = `Buat ${count} soal pilihan ganda untuk topik "${dto.topic ?? "umum N5/N4"}". Setiap soal punya 4 pilihan, satu jawaban benar, dan satu kalimat penjelasan singkat.`;
    const r = await this.client.chatJson(userId, "generate-quiz", sys, usr);
    return r.ok ? { source: "ai", data: r.data } : { source: "mock", data: MockAi.generateQuiz(dto.topic, count) };
  }

  // -------- hafalan plan ----------------------------------------------

  async createHafalan(userId: string, dto: CreateHafalanAiDto) {
    const sys = SYS_BASE +
      ' Schema: {"title":"string","summary":"string","items":[{"itemType":"kotoba|bunpou","jpOrPattern":"string","meaning":"string"}]}';
    const usr = `Buat rencana hafalan singkat berdasarkan topik: "${dto.topic}". Sertakan beberapa kotoba/bunpou yang relevan. Hanya saran, jangan klaim bahwa itu sudah disimpan.`;
    const r = await this.client.chatJson(userId, "create-hafalan", sys, usr);
    return r.ok ? { source: "ai", data: r.data } : { source: "mock", data: MockAi.createHafalan(dto.topic) };
  }

  // -------- bulk kotoba (with duplicate check) ------------------------

  async bulkKotoba(userId: string, dto: BulkKotobaDto) {
    const words = dto.words
      .map((w) => w.trim())
      .filter((w) => w.length > 0)
      .slice(0, 50);

    if (words.length === 0) {
      return { source: "mock", data: { items: [] as BulkPreviewItem[] } };
    }

    // Check duplicates first
    const existing = await this.prisma.kotoba.findMany({
      where: { userId, jp: { in: words } },
      select: { jp: true },
    });
    const existingSet = new Set(existing.map((e) => e.jp));

    // Ask AI to enrich the new words
    const newWords = words.filter((w) => !existingSet.has(w));
    let enriched: BulkPreviewItem[] = [];

    if (newWords.length === 0) {
      enriched = [];
    } else {
      const sys = SYS_BASE +
        ' Schema: {"items":[{"jp":"string","romaji":"string","meaning":"string","type":"string","level":"N5|N4|N3|N2|N1","beginnerExample":"string"}]}';
      const usr = `Untuk daftar kata berikut, berikan arti singkat dalam Bahasa Indonesia, romaji, jenis kata, level JLPT, dan satu contoh kalimat sederhana. Daftar: ${JSON.stringify(newWords)}`;
      const r = await this.client.chatJson<{ items: BulkPreviewItem[] }>(
        userId,
        "bulk-kotoba",
        sys,
        usr,
      );
      if (r.ok && r.data && Array.isArray(r.data.items)) {
        enriched = r.data.items.map((it) => ({
          jp: it.jp,
          status: "new" as const,
          meaning: it.meaning ?? "",
          romaji: it.romaji ?? "",
          type: it.type ?? "",
          level: it.level ?? "",
          beginnerExample: it.beginnerExample ?? "",
        }));
      } else {
        enriched = MockAi.bulkKotoba(newWords).items.map((it) => ({
          jp: it.jp,
          status: "manual" as const,
          meaning: it.meaning,
          romaji: it.romaji,
          type: it.type,
          level: it.level,
          beginnerExample: it.beginnerExample,
        }));
      }
    }

    // Build the final preview list preserving input order
    const enrichedMap = new Map(enriched.map((e) => [e.jp, e]));
    const items: BulkPreviewItem[] = words.map((w) => {
      if (existingSet.has(w)) {
        return { jp: w, status: "exists" as const };
      }
      const e = enrichedMap.get(w);
      if (e) return e;
      return { jp: w, status: "manual" as const };
    });

    return { source: enriched.length > 0 && enriched[0].status === "new" ? "ai" : "mock", data: { items } };
  }

  // -------- sentence analysis -----------------------------------------

  async analyzeSentence(userId: string, dto: AnalyzeSentenceDto) {
    const sys = SYS_BASE +
      ' Schema: {"sentence":"string","meaning":"string","bunpouFound":[{"pattern":"string","meaning":"string"}],"kotobaFound":[{"jp":"string","meaning":"string"}],"particles":[{"symbol":"string","role":"string"}],"recommendations":["string"]}';
    const usr = `Analisis kalimat berikut. Identifikasi pola bunpou, kotoba penting, fungsi partikel, dan beri 1-3 saran belajar lanjutan. Kalimat: "${dto.sentence}"`;
    const r = await this.client.chatJson(userId, "analyze-sentence", sys, usr);
    return r.ok ? { source: "ai", data: r.data } : { source: "mock", data: MockAi.analyzeSentence(dto.sentence) };
  }
}
