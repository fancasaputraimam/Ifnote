"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { NotebookCard } from "@/components/ui/NotebookCard";

import { QuizTypeCards } from "./components/QuizTypeCards";
import { ProgressStrip } from "./components/ProgressStrip";
import { QuestionCard, type AnsweredFeedback, type QuestionViewModel, type AnswerMode } from "./components/QuestionCard";

import {
  useGenerateAiQuiz,
  useQuizProgress,
  useQuizQuestions,
  useSubmitAnswer,
} from "./useQuiz";
import type { QuizQuestion, QuizType } from "@/lib/types";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import { ROUTES } from "@/lib/constants";

const QUIZ_LENGTH = 10;

interface QuestionRuntime {
  view: QuestionViewModel;
  /** Backend record so we can persist mastery — null for AI quiz (no real id). */
  source: { type: "kotoba" | "bunpou"; id: string } | null;
}

export function QuizScreen() {
  const params = useSearchParams();
  const router = useRouter();

  const initialType = ((): QuizType => {
    const t = params.get("type");
    if (t === "kotoba" || t === "bunpou" || t === "mixed" || t === "ai") return t;
    return "mixed";
  })();

  const [type, setType] = useState<QuizType>(initialType);
  const [mode, setMode] = useState<AnswerMode>("choice");
  const [questions, setQuestions] = useState<QuestionRuntime[] | null>(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<AnsweredFeedback | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [aiSource, setAiSource] = useState<"ai" | "mock" | null>(null);

  // ---- backend hooks ------------------------------------------------
  const poolQ = useQuizQuestions(type, QUIZ_LENGTH, type !== "ai" && questions === null);
  const aiMut = useGenerateAiQuiz();
  const submitMut = useSubmitAnswer();
  const progressQ = useQuizProgress();

  // Strip ?type= from URL after first read so reload doesn't re-pin it
  useEffect(() => {
    if (params.get("type")) {
      router.replace("/app/quiz", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset session when type changes
  useEffect(() => {
    setQuestions(null);
    setIndex(0);
    setFeedback(null);
    setSessionCorrect(0);
    setSessionWrong(0);
    setAiSource(null);
  }, [type]);

  // Map pool questions → runtime once data arrives
  useEffect(() => {
    if (type === "ai") return;
    if (!poolQ.data || questions !== null) return;
    setQuestions(poolQ.data.map(toRuntimeFromPool));
  }, [poolQ.data, questions, type]);

  // Lifetime progress for the active type
  const progress = useMemo(() => {
    return progressQ.data?.find((p) => p.quizType === type) ?? null;
  }, [progressQ.data, type]);

  // ---- AI quiz starter ---------------------------------------------
  const startAiQuiz = async () => {
    try {
      const r = await aiMut.mutateAsync({ count: QUIZ_LENGTH });
      const list = r.data?.questions ?? [];
      if (list.length === 0) {
        toast("AI tidak mengembalikan soal. Coba mode lain.", "error");
        return;
      }
      setQuestions(list.map(toRuntimeFromAi));
      setIndex(0);
      setFeedback(null);
      setSessionCorrect(0);
      setSessionWrong(0);
      setAiSource(r.source);
      toast(
        r.source === "ai"
          ? "Soal dari AI siap"
          : "AI tidak terkonfigurasi — pakai soal mock",
        r.source === "ai" ? "success" : "info",
      );
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal generate quiz AI";
      toast(msg, "error");
    }
  };

  // ---- handlers ----------------------------------------------------
  const onAnswer = async (correct: boolean) => {
    if (!questions) return;
    const current = questions[index];
    setFeedback({
      correct,
      correctLabel:
        current.view.choices.find((c) => c.id === current.view.correctChoiceId)?.label ??
        current.view.meaning ??
        "",
      explanation: current.view.explanation,
    });
    if (correct) setSessionCorrect((n) => n + 1);
    else setSessionWrong((n) => n + 1);

    // Persist for non-AI quizzes (we have real itemId)
    if (current.source) {
      try {
        await submitMut.mutateAsync({
          type,
          itemType: current.source.type,
          itemId: current.source.id,
          correct,
        });
      } catch (e) {
        // Don't block UX if logging fails — just toast it.
        const msg = e instanceof ApiError ? e.message : "Gagal menyimpan jawaban";
        toast(msg, "error");
      }
    }
  };

  const onNext = () => {
    if (!questions) return;
    if (index + 1 >= questions.length) {
      // Quiz finished — show summary state by clearing questions
      setQuestions(null);
      setIndex(0);
      setFeedback(null);
      return;
    }
    setIndex((n) => n + 1);
    setFeedback(null);
  };

  // ---- render branches --------------------------------------------
  const isAiLoading = type === "ai" && aiMut.isPending;
  const isPoolLoading = type !== "ai" && poolQ.isLoading;
  const isLoading = isAiLoading || isPoolLoading;
  const poolError = poolQ.isError;
  const poolErrorMsg = poolQ.error instanceof Error ? poolQ.error.message : null;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
          🎯 Practice Mode
        </div>
        <h1 className="text-2xl font-semibold text-ink-800 dark:text-paper-50 sm:text-3xl">
          Quiz
        </h1>
        <p className="text-sm text-ink-400">
          Latihan cepat dari kotoba dan bunpou.
        </p>
      </header>

      <QuizTypeCards type={type} onChange={setType} disabled={isLoading} />

      <ProgressStrip
        type={type}
        sessionCorrect={sessionCorrect}
        sessionWrong={sessionWrong}
        lifetimeCorrect={progress?.correctCount}
        lifetimeWrong={progress?.wrongCount}
        lifetimeTotal={progress?.totalAnswered}
        lastScore={progress?.lastScore ?? null}
      />

      {/* AI quiz start screen */}
      {type === "ai" && questions === null && !aiMut.isPending ? (
        <NotebookCard stripe="accent" className="p-5">
          <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
            Quiz dari AI
          </h2>
          <p className="mt-1 text-sm text-ink-400">
            AI akan membuat {QUIZ_LENGTH} soal pilihan ganda level N5/N4. Kalau
            backend belum dikonfigurasi AI, kamu akan dapat soal mock dengan
            label yang jujur.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={startAiQuiz}>Generate Soal AI</Button>
            <div className="ml-auto self-center">
              <ModeSwitch value={mode} onChange={setMode} />
            </div>
          </div>
        </NotebookCard>
      ) : null}

      {/* Pool quiz auto-loads; show controls + content */}
      {isLoading ? (
        <LoadingState label={type === "ai" ? "AI sedang membuat soal…" : "Menyiapkan soal…"} />
      ) : poolError && type !== "ai" ? (
        <NotebookCard className="p-5">
          <div className="flex items-center gap-2">
            <Badge tone="warn">Tidak bisa generate quiz</Badge>
          </div>
          <p className="mt-2 text-sm text-ink-700 dark:text-paper-50">
            {poolErrorMsg ??
              "Tambah lebih banyak kotoba/bunpou di Catatan supaya AI punya bahan."}
          </p>
          <div className="mt-3">
            <LinkButton size="sm" href={ROUTES.app.catatan}>Buka Catatan</LinkButton>
          </div>
        </NotebookCard>
      ) : null}

      {questions && questions.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <Badge tone={aiSource === "mock" ? "warn" : "neutral"}>
              {aiSource === "ai"
                ? "AI"
                : aiSource === "mock"
                ? "Mock fallback"
                : "Soal dari catatanmu"}
            </Badge>
            <ModeSwitch value={mode} onChange={setMode} />
          </div>

          <QuestionCard
            question={questions[index].view}
            index={index}
            total={questions.length}
            mode={mode}
            feedback={feedback}
            submitting={submitMut.isPending}
            onAnswer={(correct) => onAnswer(correct)}
            onNext={onNext}
          />
        </>
      ) : null}

      {/* Pool returned 0 questions — empty pool */}
      {!isLoading && !poolError && type !== "ai" && questions === null ? (
        <EmptyState
          icon="🎯"
          title="Belum cukup data untuk quiz"
          description="Quiz mengambil soal dari Catatan kamu. Tambah minimal 4 kotoba/bunpou supaya AI bisa membuat pilihan ganda."
          action={
            <div className="flex gap-2">
              <LinkButton size="sm" href={ROUTES.app.catatan}>Buka Catatan</LinkButton>
              <LinkButton size="sm" variant="secondary" href={ROUTES.app.ai}>Tanya AI</LinkButton>
            </div>
          }
        />
      ) : null}

      {/* Summary card after all questions answered */}
      {!questions && (sessionCorrect + sessionWrong > 0) ? (
        <NotebookCard stripe="leaf" className="p-5">
          <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
            Sesi selesai
          </h2>
          <p className="mt-1 text-sm text-ink-700 dark:text-paper-50">
            {sessionCorrect} benar · {sessionWrong} salah ·
            akurasi {Math.round((sessionCorrect / (sessionCorrect + sessionWrong)) * 100)}%
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setType((t) => t)}>
              {/* Trigger the type-change effect by re-setting same value */}
              Mulai sesi baru
            </Button>
            <LinkButton size="sm" variant="secondary" href={ROUTES.app.hafalan}>
              Lanjut ke Hafalan
            </LinkButton>
          </div>
        </NotebookCard>
      ) : null}
    </div>
  );
}

// ---- helpers --------------------------------------------------------

function toRuntimeFromPool(q: QuizQuestion): QuestionRuntime {
  return {
    view: {
      id: q.id,
      prompt: q.prompt,
      meaning: q.meaning,
      choices: q.choices,
      correctChoiceId: q.correctChoiceId,
    },
    source: { type: q.itemType, id: q.itemId },
  };
}

function toRuntimeFromAi(
  q: { prompt: string; choices: { id: string; label: string }[]; correctChoiceId: string; explanation?: string },
  i: number,
): QuestionRuntime {
  return {
    view: {
      id: `ai-${i}`,
      prompt: q.prompt,
      meaning: q.choices.find((c) => c.id === q.correctChoiceId)?.label,
      choices: q.choices,
      correctChoiceId: q.correctChoiceId,
      explanation: q.explanation,
    },
    source: null, // no DB record to update
  };
}

// ---- mode switch (pill toggle) -------------------------------------

function ModeSwitch({
  value,
  onChange,
}: {
  value: AnswerMode;
  onChange: (m: AnswerMode) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-paper-200 bg-white p-0.5 text-xs dark:border-ink-700 dark:bg-ink-800">
      <button
        type="button"
        onClick={() => onChange("choice")}
        aria-pressed={value === "choice"}
        className={[
          "rounded-full px-3 py-1.5 font-medium transition-colors",
          value === "choice"
            ? "bg-accent-500 text-white"
            : "text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
        ].join(" ")}
      >
        Pilihan ganda
      </button>
      <button
        type="button"
        onClick={() => onChange("blank")}
        aria-pressed={value === "blank"}
        className={[
          "rounded-full px-3 py-1.5 font-medium transition-colors",
          value === "blank"
            ? "bg-accent-500 text-white"
            : "text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
        ].join(" ")}
      >
        Isian
      </button>
    </div>
  );
}
