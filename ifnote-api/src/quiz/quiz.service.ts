import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AnswerDto, GenerateQuizDto, QuizQueryDto, QuizType } from "./dto";

interface QuizQuestion {
  id: string;            // synthetic question id (itemId)
  itemType: "kotoba" | "bunpou";
  itemId: string;
  prompt: string;
  meaning?: string;
  choices: { id: string; label: string }[];
  correctChoiceId: string;
}

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build a quiz from the user's own Kotoba/Bunpou. Multiple-choice with
   * 4 options. Random distractors pulled from the same user's pool.
   */
  async generate(userId: string, q: QuizQueryDto | GenerateQuizDto): Promise<QuizQuestion[]> {
    const type: QuizType = (q.type as QuizType) ?? "mixed";
    const count = Math.min(20, Math.max(1, q.count ?? 10));

    const wantKotoba = type === "kotoba" || type === "mixed" || type === "ai";
    const wantBunpou = type === "bunpou" || type === "mixed" || type === "ai";

    const [kotoba, bunpou] = await Promise.all([
      wantKotoba
        ? this.prisma.kotoba.findMany({ where: { userId } })
        : Promise.resolve([]),
      wantBunpou
        ? this.prisma.bunpou.findMany({ where: { userId } })
        : Promise.resolve([]),
    ]);

    if (kotoba.length + bunpou.length === 0) {
      throw new BadRequestException(
        "Belum ada Kotoba/Bunpou untuk dijadikan quiz. Tambahkan catatan dulu.",
      );
    }

    const meaningsKotoba = kotoba.map((k) => k.meaning).filter(Boolean);
    const meaningsBunpou = bunpou.map((b) => b.meaning).filter(Boolean);

    const pickDistractors = (excluded: string, pool: string[]): string[] => {
      const filtered = pool.filter((p) => p && p !== excluded);
      const shuffled = filtered.slice().sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    };

    const questions: QuizQuestion[] = [];
    const sourcePool: Array<
      | { kind: "kotoba"; row: typeof kotoba[number] }
      | { kind: "bunpou"; row: typeof bunpou[number] }
    > = [
      ...kotoba.map((row) => ({ kind: "kotoba" as const, row })),
      ...bunpou.map((row) => ({ kind: "bunpou" as const, row })),
    ];
    sourcePool.sort(() => Math.random() - 0.5);

    for (const src of sourcePool) {
      if (questions.length >= count) break;
      if (src.kind === "kotoba") {
        const row = src.row;
        const distractors = pickDistractors(row.meaning, [
          ...meaningsKotoba,
          ...meaningsBunpou,
        ]);
        if (distractors.length < 3) continue; // not enough pool
        const choices = [row.meaning, ...distractors]
          .sort(() => Math.random() - 0.5)
          .map((label, idx) => ({ id: `c${idx}`, label }));
        const correct = choices.find((c) => c.label === row.meaning)!;
        questions.push({
          id: row.id,
          itemType: "kotoba",
          itemId: row.id,
          prompt: row.jp,
          meaning: row.meaning,
          choices,
          correctChoiceId: correct.id,
        });
      } else {
        const row = src.row;
        const distractors = pickDistractors(row.meaning, [
          ...meaningsKotoba,
          ...meaningsBunpou,
        ]);
        if (distractors.length < 3) continue;
        const choices = [row.meaning, ...distractors]
          .sort(() => Math.random() - 0.5)
          .map((label, idx) => ({ id: `c${idx}`, label }));
        const correct = choices.find((c) => c.label === row.meaning)!;
        questions.push({
          id: row.id,
          itemType: "bunpou",
          itemId: row.id,
          prompt: row.pattern,
          meaning: row.meaning,
          choices,
          correctChoiceId: correct.id,
        });
      }
    }

    return questions;
  }

  async answer(userId: string, dto: AnswerDto) {
    const existing = await this.prisma.quizProgress.findUnique({
      where: {
        uniq_user_quiztype: { userId, quizType: dto.type },
      },
    });
    const correct = (existing?.correctCount ?? 0) + (dto.correct ? 1 : 0);
    const wrong = (existing?.wrongCount ?? 0) + (dto.correct ? 0 : 1);
    const total = (existing?.totalAnswered ?? 0) + 1;
    const lastScore = total > 0 ? Math.round((correct / total) * 100) : 0;

    const updated = await this.prisma.quizProgress.upsert({
      where: { uniq_user_quiztype: { userId, quizType: dto.type } },
      create: {
        userId,
        quizType: dto.type,
        correctCount: dto.correct ? 1 : 0,
        wrongCount: dto.correct ? 0 : 1,
        totalAnswered: 1,
        lastScore: dto.correct ? 100 : 0,
      },
      update: {
        correctCount: correct,
        wrongCount: wrong,
        totalAnswered: total,
        lastScore,
      },
    });

    // Lower mastery on incorrect answers; raise to "good" on correct streaks
    if (dto.itemType === "kotoba") {
      const k = await this.prisma.kotoba.findFirst({
        where: { id: dto.itemId, userId },
      });
      if (k) {
        const newMastery = dto.correct ? (k.mastery === "weak" ? "mid" : "good") : "weak";
        await this.prisma.kotoba.update({
          where: { id: dto.itemId },
          data: { mastery: newMastery },
        });
      }
    } else {
      const b = await this.prisma.bunpou.findFirst({
        where: { id: dto.itemId, userId },
      });
      if (b) {
        const newMastery = dto.correct ? (b.mastery === "weak" ? "mid" : "good") : "weak";
        await this.prisma.bunpou.update({
          where: { id: dto.itemId },
          data: { mastery: newMastery },
        });
      }
    }

    return updated;
  }

  progress(userId: string) {
    return this.prisma.quizProgress.findMany({ where: { userId } });
  }
}
