import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiClientService } from "./ai-client.service";
import {
  AnalyzeSentenceDto,
  BulkKotobaDto,
  CorrectSentenceDto,
  CreateHafalanAiDto,
  ExplainBunpouDto,
  ExplainKotobaDto,
  GenerateQuizAiDto,
  GenerateSakubunDto,
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
  sourceInput?: string;
  inputLanguage?: "japanese" | "indonesian" | "mixed" | "unknown";
  meaning?: string;
  reading?: string;
  romaji?: string;
  type?: string;
  level?: string;
  beginnerExample?: string;
  exampleReading?: string;
}

/**
 * Lempar 503 dengan message yang frontend bisa map jadi
 * "AI belum diatur — buka Settings".
 */
function aiNotReady(): never {
  throw new ServiceUnavailableException({
    error: "AI_NOT_CONFIGURED",
    message: "AI belum diatur. Aktifkan dan isi API key di Settings.",
  });
}

function aiCallFailed(reason?: string): never {
  throw new ServiceUnavailableException({
    error: "AI_CALL_FAILED",
    message: reason || "AI gagal merespon. Coba lagi atau cek konfigurasi.",
  });
}

@Injectable()
export class AiService {
  constructor(
    private readonly client: AiClientService,
    private readonly prisma: PrismaService,
  ) {}

  // -------- explain ----------------------------------------------------

  async explainKotoba(userId: string, dto: ExplainKotobaDto) {
    const sys =
      SYS_BASE +
      " Input user dapat berupa Bahasa Indonesia, Bahasa Jepang, atau campuran. " +
      "Tugas kamu: identifikasikan kosakata Jepang yang dimaksud, lalu jelaskan dalam Bahasa Indonesia. " +
      "Jika input Indonesia, terjemahkan menjadi kotoba Jepang yang paling natural. " +
      "Jika input Jepang, kembalikan kata aslinya. " +
      "Jika input adalah deskripsi/keyword (mis. 'kata Jepang untuk berat'), pilih kotoba paling cocok. " +
      "Selalu kembalikan jp dalam huruf Jepang, meaning dalam Bahasa Indonesia, reading dalam hiragana, dan exampleReading dalam hiragana penuh. " +
      'Schema: {"sourceInput":"string","inputLanguage":"japanese|indonesian|mixed|unknown","jp":"string","reading":"string","romaji":"string","meaning":"string","type":"string","level":"N5|N4|N3|N2|N1","normalExample":"string","exampleReading":"string","exampleMeaning":"string","note":"string"}';
    const usr =
      `Input user: "${dto.jp}". ` +
      "Identifikasi kotoba Jepang yang paling sesuai dan kembalikan struktur lengkap. " +
      "sourceInput = input asli, inputLanguage = bahasa input. " +
      "JANGAN gunakan tag <ruby>; cukup teks polos. JANGAN balikan markdown.";
    const r = await this.client.chatJson(userId, "explain-kotoba", sys, usr);
    if (!r.ok) aiCallFailed(r.message);
    return { source: "ai" as const, data: r.data };
  }

  async explainBunpou(userId: string, dto: ExplainBunpouDto) {
    const sys =
      SYS_BASE +
      " Input user boleh Bahasa Indonesia, Jepang (pola/sentence), atau campuran. " +
      "Identifikasi pola bunpou Jepang yang dimaksud lalu jelaskan dalam Bahasa Indonesia. " +
      'Schema: {"pattern":"string","meaning":"string","formula":"string","usage":"string","example":"string","exampleMeaning":"string","commonMistake":"string"}';
    const usr =
      `Input user: "${dto.pattern}". ` +
      "Kalau input Indonesia, cari pola bunpou paling cocok. Kalau input pola Jepang, jelaskan pola itu. Kalau input kalimat Jepang, deteksi pola utamanya. " +
      "Berikan arti, formula, kapan dipakai, contoh kalimat alami, terjemahan, dan kesalahan umum.";
    const r = await this.client.chatJson(userId, "explain-bunpou", sys, usr);
    if (!r.ok) aiCallFailed(r.message);
    return { source: "ai" as const, data: r.data };
  }

  /**
   * Versi rich/structured untuk endpoint cache `/api/bunpou/:id/ai-explain`.
   * Output JSON terstruktur supaya formula, contoh perubahan, dan kesalahan
   * umum bisa di-render rapi tanpa parser regex di frontend.
   *
   * Schema dipilih cocok dengan task spec PART 10.
   */
  async explainBunpouRich(userId: string, dto: ExplainBunpouDto) {
    const sys =
      SYS_BASE +
      " Input user boleh Bahasa Indonesia, pola Jepang, atau kalimat Jepang. " +
      "Tugas: identifikasikan pola bunpou yang dimaksud, lalu jelaskan dalam Bahasa Indonesia dengan struktur jelas. " +
      "Jika input adalah kalimat (bukan pola), tetap kembalikan pattern utamanya, dan set detectedFromSentence:true. " +
      "Selalu kembalikan pattern dalam Jepang dan meaning dalam Indonesia. " +
      "Pisahkan formulaPatterns sebagai array baris pendek. transformExamples sebagai array {from,to}. usage sebagai array kalimat pendek. examples sebagai array {jp, reading, meaning}. commonMistakes sebagai array. JANGAN tag <ruby>. JANGAN markdown. " +
      'Schema: {"sourceInput":"string","inputLanguage":"japanese|indonesian|mixed|unknown","detectedFromSentence":false,"pattern":"string","reading":"string","meaning":"string","formulaPatterns":["string"],"transformExamples":[{"from":"string","to":"string"}],"usage":["string"],"examples":[{"jp":"string","reading":"string","meaning":"string"}],"commonMistakes":["string"],"note":"string"}';
    const usr =
      `Input user: "${dto.pattern}". ` +
      "sourceInput = teks asli yang user ketik. inputLanguage = bahasa input. " +
      "Beri minimal satu contoh kalimat lengkap dengan reading hiragana penuh dan terjemahan Indonesia.";
    const r = await this.client.chatJson(userId, "explain-bunpou-rich", sys, usr);
    if (!r.ok) aiCallFailed(r.message);
    return { source: "ai" as const, data: r.data };
  }

  // -------- correct ----------------------------------------------------

  async correctSentence(userId: string, dto: CorrectSentenceDto) {
    const sys = SYS_BASE +
      ' Schema: {"input":"string","corrected":"string","explanation":"string","issues":[{"text":"string","suggestion":"string"}]}';
    const usr = `Periksa kalimat berikut. Jika ada kesalahan, perbaiki dan jelaskan singkat dalam Bahasa Indonesia. Kalimat: "${dto.sentence}"`;
    const r = await this.client.chatJson(userId, "correct-sentence", sys, usr);
    if (!r.ok) aiCallFailed(r.message);
    return { source: "ai" as const, data: r.data };
  }

  // -------- examples ---------------------------------------------------

  async makeExample(userId: string, dto: MakeExampleDto) {
    const sys = SYS_BASE +
      ' Schema: {"topic":"string","examples":[{"jp":"string","meaning":"string"}]}. Buat 3 contoh.';
    const usr = `Buat 3 contoh kalimat sederhana dengan topik/keyword: "${dto.topic}". Sertakan terjemahan Bahasa Indonesia.`;
    const r = await this.client.chatJson(userId, "make-example", sys, usr);
    if (!r.ok) aiCallFailed(r.message);
    return { source: "ai" as const, data: r.data };
  }

  // -------- quiz -------------------------------------------------------

  async generateQuiz(userId: string, dto: GenerateQuizAiDto) {
    const count = Math.max(1, Math.min(10, dto.count ?? 5));
    const sys = SYS_BASE +
      ' Schema: {"topic":"string","questions":[{"prompt":"string","choices":[{"id":"c0|c1|c2|c3","label":"string"}],"correctChoiceId":"string","explanation":"string"}]}';
    const usr = `Buat ${count} soal pilihan ganda untuk topik "${dto.topic ?? "umum N5/N4"}". Setiap soal punya 4 pilihan, satu jawaban benar, dan satu kalimat penjelasan singkat.`;
    const r = await this.client.chatJson(userId, "generate-quiz", sys, usr);
    if (!r.ok) aiCallFailed(r.message);
    return { source: "ai" as const, data: r.data };
  }

  // -------- hafalan plan ----------------------------------------------

  async createHafalan(userId: string, dto: CreateHafalanAiDto) {
    const sys = SYS_BASE +
      ' Schema: {"title":"string","summary":"string","items":[{"itemType":"kotoba|bunpou","jpOrPattern":"string","meaning":"string"}]}';
    const usr = `Buat rencana hafalan singkat berdasarkan topik: "${dto.topic}". Sertakan beberapa kotoba/bunpou yang relevan. Hanya saran, jangan klaim bahwa itu sudah disimpan.`;
    const r = await this.client.chatJson(userId, "create-hafalan", sys, usr);
    if (!r.ok) aiCallFailed(r.message);
    return { source: "ai" as const, data: r.data };
  }

  // -------- bulk kotoba (with duplicate check) ------------------------

  async bulkKotoba(userId: string, dto: BulkKotobaDto) {
    const words = dto.words
      .map((w) => w.trim())
      .filter((w) => w.length > 0)
      .slice(0, 50);

    if (words.length === 0) {
      return { source: "ai" as const, data: { items: [] as BulkPreviewItem[] } };
    }

    // Tidak bisa lagi dedup pre-AI berdasarkan input mentah karena user
    // boleh ketik Indonesia ("berat"). Dedup dilakukan setelah AI
    // mengonversi ke jp Jepang.
    const sys =
      SYS_BASE +
      " Daftar berikut bisa berisi Bahasa Indonesia, Bahasa Jepang, atau campuran. Untuk SETIAP entri tentukan kotoba Jepang yang dimaksud lalu kembalikan strukturnya. Selalu kembalikan jp dalam Jepang dan meaning dalam Bahasa Indonesia. Pertahankan urutan input. " +
      'Schema: {"items":[{"sourceInput":"string","inputLanguage":"japanese|indonesian|mixed|unknown","jp":"string","reading":"string","romaji":"string","meaning":"string","type":"string","level":"N5|N4|N3|N2|N1","beginnerExample":"string","exampleReading":"string"}]}';
    const usr = `Daftar input user (urutan harus dipertahankan): ${JSON.stringify(
      words,
    )}`;
    const r = await this.client.chatJson<{ items: BulkPreviewItem[] }>(
      userId,
      "bulk-kotoba",
      sys,
      usr,
    );
    if (!r.ok || !r.data || !Array.isArray(r.data.items)) {
      aiCallFailed(r.message);
    }

    // Match AI items kembali ke urutan input user. AI biasanya menjaga
    // urutan, tapi kita defensive: cocokkan via sourceInput exact match.
    const aiItems = r.data!.items.map((it, idx) => ({
      ...it,
      _sourceMatch: (it.sourceInput ?? words[idx] ?? "").trim(),
    }));

    // Dedup terhadap DB user berdasarkan jp Jepang yang dihasilkan AI.
    const candidateJp = aiItems
      .map((it) => it.jp)
      .filter((j): j is string => typeof j === "string" && j.length > 0);
    const existing = await this.prisma.kotoba.findMany({
      where: { userId, jp: { in: candidateJp } },
      select: { jp: true },
    });
    const existingSet = new Set(existing.map((e) => e.jp));

    // Dedup di dalam batch sendiri (kalau user double-input).
    const seenInBatch = new Set<string>();

    const items: BulkPreviewItem[] = words.map((srcRaw, idx) => {
      const src = srcRaw.trim();
      const ai =
        aiItems[idx] && aiItems[idx]._sourceMatch === src
          ? aiItems[idx]
          : aiItems.find((x) => x._sourceMatch === src) ?? aiItems[idx];
      if (!ai || !ai.jp) {
        return { jp: src, status: "manual" as const, sourceInput: src };
      }
      const jp = ai.jp;
      const isExistingDb = existingSet.has(jp);
      const isDupBatch = seenInBatch.has(jp);
      seenInBatch.add(jp);
      const status: BulkPreviewItem["status"] =
        isExistingDb || isDupBatch ? "exists" : "new";
      return {
        jp,
        status,
        sourceInput: src,
        inputLanguage: ai.inputLanguage,
        meaning: ai.meaning ?? "",
        reading: ai.reading ?? "",
        romaji: ai.romaji ?? "",
        type: ai.type ?? "",
        level: ai.level ?? "",
        beginnerExample: ai.beginnerExample ?? "",
        exampleReading: ai.exampleReading ?? "",
      };
    });

    return { source: "ai" as const, data: { items } };
  }

  // -------- sentence analysis -----------------------------------------

  async analyzeSentence(userId: string, dto: AnalyzeSentenceDto) {
    const sys = SYS_BASE +
      ' Schema: {"sentence":"string","meaning":"string","bunpouFound":[{"pattern":"string","meaning":"string"}],"kotobaFound":[{"jp":"string","meaning":"string"}],"particles":[{"symbol":"string","role":"string"}],"recommendations":["string"]}';
    const usr = `Analisis kalimat berikut. Identifikasi pola bunpou, kotoba penting, fungsi partikel, dan beri 1-3 saran belajar lanjutan. Kalimat: "${dto.sentence}"`;
    const r = await this.client.chatJson(userId, "analyze-sentence", sys, usr);
    if (!r.ok) aiCallFailed(r.message);
    return { source: "ai" as const, data: r.data };
  }

  // -------- sakubun ----------------------------------------------------

  /**
   * Generate sakubun (esai pendek) yang menggabungkan beberapa pola
   * bunpou pilihan user. Backend wajib verifikasi semua bunpouIds milik
   * user (anti-IDOR). Maksimum 10 bunpou per request, sudah dijaga di
   * level DTO juga.
   */
  async generateSakubun(userId: string, dto: GenerateSakubunDto) {
    const ids = Array.from(new Set(dto.bunpouIds.map((s) => s.trim()).filter(Boolean)));
    if (ids.length === 0) {
      throw new ServiceUnavailableException("Pilih minimal satu bunpou");
    }
    if (ids.length > 10) {
      throw new ServiceUnavailableException(
        "Maksimal 10 bunpou untuk sekali generate sakubun.",
      );
    }

    const rows = await this.prisma.bunpou.findMany({
      where: { userId, id: { in: ids } },
      select: {
        id: true,
        pattern: true,
        meaning: true,
        formula: true,
        beginnerExample: true,
        normalExample: true,
      },
    });
    if (rows.length === 0) {
      throw new ServiceUnavailableException(
        "Bunpou pilihan tidak ditemukan di catatanmu.",
      );
    }

    const items = rows.map((r) => ({
      id: r.id,
      pattern: r.pattern,
      meaning: r.meaning ?? "",
      formula: r.formula ?? "",
      example: r.normalExample ?? r.beginnerExample ?? "",
    }));

    const level = dto.level ?? "beginner";
    const sys =
      SYS_BASE +
      " Buat satu sakubun (esai pendek) bahasa Jepang yang natural untuk pelajar level " +
      level +
      ". WAJIB pakai SEMUA pola bunpou yang diberikan minimal sekali. " +
      "Sakubun panjang 3 sampai 8 kalimat, koheren dan bertema realistik. " +
      "Selalu kembalikan JSON dengan schema persis. JANGAN markdown. JANGAN tag <ruby>. " +
      'Schema: {"title":"string","sakubun":"string","reading":"string","meaning":"string",' +
      '"usedBunpou":[{"id":"string","pattern":"string","sentence":"string","meaning":"string"}],' +
      '"notes":["string"]}';
    const usr =
      `Pola bunpou yang harus dipakai (semua wajib muncul minimal sekali): ${JSON.stringify(items)}. ` +
      (dto.topic ? `Tema sakubun: "${dto.topic}". ` : "") +
      "Field reading harus berupa kana penuh dari sakubun (hiragana). " +
      "Field meaning harus terjemahan Bahasa Indonesia yang natural. " +
      "Setiap entri usedBunpou.sentence harus kalimat dari sakubun yang menggunakan pola tersebut. " +
      "Sertakan id pola yang sama dengan input agar UI bisa menautkan kembali.";

    const r = await this.client.chatJson(userId, "generate-sakubun", sys, usr);
    if (!r.ok) aiCallFailed(r.message);
    return {
      source: "ai" as const,
      data: r.data,
      // Echo pola yang dipakai supaya frontend bisa render fallback kalau
      // AI lupa mengisi usedBunpou.
      requested: items,
    };
  }
}
