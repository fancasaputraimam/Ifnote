"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { PanelCard } from "@/components/ui/PanelCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

import { QuizTypeCards } from "./components/QuizTypeCards";
import { ProgressStrip } from "./components/ProgressStrip";
import { SakubunPanel } from "./components/SakubunPanel";
import {
  QuestionCard,
  type AnsweredFeedback,
  type QuestionViewModel,
  type AnswerMode,
} from "./components/QuestionCard";

import { useQuizProgress, useQuizQuestions, useSubmitAnswer } from "./useQuiz";
import type { QuizQuestion, QuizType } from "@/lib/types";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { ROUTES } from "@/lib/constants";

const QUIZ_LENGTH = 10;

/** Tipe yang masih punya alur "jawab soal" (non-sakubun). */
type QuizPlayType = "kotoba" | "bunpou";

/**
 * Coerce nilai legacy `mixed` / `ai` (URL lama atau state lama) menjadi
 * tipe yang valid di UI baru. Backend masih menerima `mixed` jadi data
 * lama tidak rusak.
 */
function coerceType(t: string | null): QuizType {
  if (t === "kotoba" || t === "bunpou" || t === "sakubun") return t;
  return "kotoba";
}

interface QuestionRuntime {
  view: QuestionViewModel;
  source: { type: "kotoba" | "bunpou"; id: string } | null;
}

export function QuizScreen() {
  const params = useSearchParams();
  const router = useRouter();

  const [type, setType] = useState<QuizType>(() => coerceType(params.get("type")));
  const [mode, setMode] = useState<AnswerMode>("choice");
  const [questions, setQuestions] = useState<QuestionRuntime[] | null>(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<AnsweredFeedback | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);

  const isPlayType = type === "kotoba" || type === "bunpou";
  const playType = (isPlayType ? type : "kotoba") as QuizPlayType;

  // ---- backend hooks ------------------------------------------------
  const poolQ = useQuizQuestions(playType, QUIZ_LENGTH, isPlayType && questions === null);
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
  }, [type]);

  // Map pool questions → runtime once data arrives
  useEffect(() => {
    if (!isPlayType) return;
    if (!poolQ.data || questions !== null) return;
    setQuestions(poolQ.data.map(toRuntimeFromPool));
  }, [poolQ.data, questions, isPlayType]);

  // Lifetime progress for the active type
  const progress = useMemo(() => {
    return progressQ.data?.find((p) => p.quizType === type) ?? null;
  }, [progressQ.data, type]);

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

    if (current.source) {
      try {
        await submitMut.mutateAsync({
          type: playType,
          itemType: current.source.type,
          itemId: current.source.id,
          correct,
        });
      } catch (e) {
        const m = mapApiErrorToUserMessage(e, {
          title: "Gagal menyimpan jawaban",
          message: "Progress mungkin belum terupdate. Coba lagi.",
        });
        notify[m.variant](m.title, m.message);
      }
    }
  };

  const onNext = () => {
    if (!questions) return;
    if (index + 1 >= questions.length) {
      setQuestions(null);
      setIndex(0);
      setFeedback(null);
      return;
    }
    setIndex((n) => n + 1);
    setFeedback(null);
  };

  // ---- render branches --------------------------------------------
  const isPoolLoading = isPlayType && poolQ.isLoading;
  const poolError = isPlayType && poolQ.isError;
  const poolErrorMsg = poolQ.error instanceof Error ? poolQ.error.message : null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="🎯 Practice Mode"
        title="Quiz"
        subtitle="Latihan cepat dari kotoba dan bunpou."
      />

      <QuizTypeCards type={type} onChange={setType} disabled={isPoolLoading} />

      {/* Sakubun mode: tampilkan generator panel */}
      {type === "sakubun" ? <SakubunPanel /> : null}

      {/* Untuk kotoba/bunpou — progress strip + pool quiz */}
      {isPlayType ? (
        <ProgressStrip
          type={type}
          sessionCorrect={sessionCorrect}
          sessionWrong={sessionWrong}
          lifetimeCorrect={progress?.correctCount}
          lifetimeWrong={progress?.wrongCount}
          lifetimeTotal={progress?.totalAnswered}
          lastScore={progress?.lastScore ?? null}
        />
      ) : null}

      {isPoolLoading ? (
        <LoadingState label="Menyiapkan soal…" />
      ) : poolError ? (
        <PanelCard padding="default">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper-100 text-ink-500 ring-1 ring-inset ring-paper-300/70 dark:bg-ink-700 dark:text-paper-50 dark:ring-ink-600">
              <Info className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink-800 dark:text-paper-50">
                Belum bisa membuat quiz
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-400">
                {poolErrorMsg ??
                  "Tambah lebih banyak kotoba/bunpou di Catatan supaya AI punya bahan."}
              </p>
              <div className="mt-3">
                <LinkButton size="sm" href={ROUTES.app.catatan}>
                  Buka Catatan
                </LinkButton>
              </div>
            </div>
          </div>
        </PanelCard>
      ) : null}

      {isPlayType && questions && questions.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <Badge tone="neutral">Soal dari catatanmu</Badge>
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
      {isPlayType && !isPoolLoading && !poolError && questions === null ? (
        <EmptyState
          icon="🎯"
          title="Belum cukup data untuk quiz"
          description="Quiz mengambil soal dari Catatan kamu. Tambah minimal 4 kotoba/bunpou supaya AI bisa membuat pilihan ganda."
          action={
            <div className="flex flex-wrap gap-2">
              <LinkButton size="sm" href={ROUTES.app.catatan}>
                Buka Catatan
              </LinkButton>
              <LinkButton
                size="sm"
                variant="secondary"
                href={`${ROUTES.app.catatan}?openAdd=ai-kotoba`}
              >
                ✨ Tambah dengan AI
              </LinkButton>
            </div>
          }
        />
      ) : null}

      {/* Summary card after all questions answered */}
      {isPlayType && !questions && sessionCorrect + sessionWrong > 0 ? (
        <PanelCard tone="leaf" stripe eyebrow="🍃 Sesi selesai" title="Sesi selesai">
          <p className="text-sm text-ink-700 dark:text-paper-50">
            {sessionCorrect} benar · {sessionWrong} salah · akurasi{" "}
            {Math.round((sessionCorrect / (sessionCorrect + sessionWrong)) * 100)}%
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setType((t) => t)}>Mulai sesi baru</Button>
            <LinkButton size="sm" variant="secondary" href={ROUTES.app.hafalan}>
              Lanjut ke Hafalan
            </LinkButton>
          </div>
        </PanelCard>
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
      reading: q.reading,
      meaning: q.meaning,
      choices: q.choices,
      correctChoiceId: q.correctChoiceId,
    },
    source: { type: q.itemType, id: q.itemId },
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
  const opts: { key: AnswerMode; label: string }[] = [
    { key: "choice", label: "Pilihan ganda" },
    { key: "blank", label: "Isian" },
  ];
  return (
    <div className="inline-flex rounded-full bg-white p-1 text-xs ring-1 ring-inset ring-paper-300 dark:bg-ink-800 dark:ring-ink-700">
      {opts.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            aria-pressed={active}
            className={cn(
              "relative rounded-full px-3 py-1.5 font-medium transition-colors",
              active
                ? "text-white"
                : "text-ink-600 hover:text-ink-800 dark:text-paper-50/80 dark:hover:text-paper-50",
            )}
          >
            {active ? (
              <motion.span
                layoutId="quiz-mode-pill"
                className="absolute inset-0 rounded-full bg-accent-gradient shadow-glow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            ) : null}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
