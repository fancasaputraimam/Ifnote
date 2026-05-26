/**
 * Mock AI fallback. Returns deterministic, well-structured payloads that
 * match the same JSON shape as the real AI provider. Never network.
 *
 * Used whenever:
 *   - AI_API_KEY is not configured
 *   - the real AI provider returns an error
 *   - the AI response can't be parsed as JSON
 */

const MOCK_TAG = "[mock]";

export const MockAi = {
  explainKotoba(jp: string) {
    return {
      topic: jp,
      meaning: `${MOCK_TAG} arti kata "${jp}" akan dijelaskan oleh AI nanti`,
      type: "kata kerja",
      level: "N5",
      romaji: "",
      example: `${jp}を つかいます。`,
      exampleMeaning: "Saya memakai kata ini.",
      note: "Mock fallback. Konfigurasikan AI di backend untuk respon nyata.",
    };
  },

  explainBunpou(pattern: string) {
    return {
      pattern,
      meaning: `${MOCK_TAG} arti pola "${pattern}"`,
      formula: `${pattern} (formula)`,
      usage: "Penjelasan penggunaan pola ini.",
      example: `${pattern} を つかった ぶん。`,
      exampleMeaning: "Contoh kalimat yang memakai pola ini.",
      commonMistake: "Kesalahan umum saat memakai pola ini.",
    };
  },

  correctSentence(input: string) {
    return {
      input,
      corrected: input,
      explanation: `${MOCK_TAG} koreksi nyata akan tersedia setelah AI dikonfigurasi.`,
      issues: [],
    };
  },

  makeExample(input: string) {
    return {
      topic: input,
      examples: [
        { jp: `${input}を つかいます。`, meaning: "Saya memakai ini." },
        { jp: `${input}が すき です。`, meaning: "Saya suka ini." },
        { jp: `${input}は おもしろい です。`, meaning: "Ini menarik." },
      ],
    };
  },

  generateQuiz(topic: string | undefined, count: number) {
    const n = Math.max(1, Math.min(10, count));
    return {
      topic: topic ?? "umum",
      questions: Array.from({ length: n }, (_, i) => ({
        prompt: `${MOCK_TAG} pertanyaan #${i + 1}`,
        choices: [
          { id: "c0", label: "pilihan A" },
          { id: "c1", label: "pilihan B" },
          { id: "c2", label: "pilihan C" },
          { id: "c3", label: "pilihan D" },
        ],
        correctChoiceId: "c0",
        explanation: "Penjelasan akan tersedia saat AI dikonfigurasi.",
      })),
    };
  },

  createHafalan(input: string) {
    return {
      title: `${MOCK_TAG} rencana hafalan`,
      summary: `Rencana berdasarkan: ${input}`,
      items: [],
    };
  },

  bulkKotoba(words: string[]) {
    return {
      items: words.map((w) => ({
        jp: w,
        status: "manual" as const,
        meaning: `${MOCK_TAG} arti "${w}" perlu dilengkapi manual.`,
        romaji: "",
        type: "",
        level: "N5",
        beginnerExample: "",
      })),
    };
  },

  analyzeSentence(sentence: string) {
    return {
      sentence,
      meaning: `${MOCK_TAG} arti kalimat akan dianalisis oleh AI`,
      bunpouFound: [] as Array<{ pattern: string; meaning: string }>,
      kotobaFound: [] as Array<{ jp: string; meaning: string }>,
      particles: [] as Array<{ symbol: string; role: string }>,
      recommendations: [
        "Konfigurasikan AI di backend untuk analisis nyata.",
      ],
    };
  },
};
