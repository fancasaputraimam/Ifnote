"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { PanelCard } from "@/components/ui/PanelCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { JapaneseText } from "@/components/japanese/JapaneseText";
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

const COUNTS = [5, 10, 20] as const;

/** Tipe yang masih punya alur "jawab soal" (non-sakubun). */
type QuizPlayType = "kotoba" | "bunpou";
/** Arah soal: Jepang→arti (default) atau arti→Jepang (recall aktif). */
type Direction = "jp2id" | "id2jp";

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

/** Item yang salah dijawab — untuk daftar review di ringkasan sesi. */
interface MissedItem {
  /** Teks Jepang (untuk deep-link ?q= ke Catatan). */
  searchKey: string;
  prompt: string;
  correctLabel: string;
}

export function QuizScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();

  const [type, setType] = useState<QuizType>(() => coerceType(params.get("type")));
  const [mode, setMode] = useState<AnswerMode>("choice");
  const [direction, setDirection] = useState<Direction>("jp2id");
  const [count, setCount] = useState<number>(10);
  const [questions, setQuestions] = useState<QuestionRuntime[] | null>(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<AnsweredFeedback | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [missed, setMissed] = useState<MissedItem[]>([]);
  /** Sesi baru saja selesai — tahan auto-start agar ringkasan terlihat. */
  const [sessionDone, setSessionDone] = useState(false);

  const isPlayType = type === "kotoba" || type === "bunpou";
  const playType = (isPlayType ? type : "kotoba") as QuizPlayType;

  // ---- backend hooks ------------------------------------------------
  const poolQ = useQuizQuestions(playType, count, isPlayType && questions === null && !sessionDone);
  const submitMut = useSubmitAnswer();
  const progressQ = useQuizProgress();

  // Strip ?type= from URL after first read so reload doesn't re-pin it
  useEffect(() => {
    if (params.get("type")) {
      router.replace("/app/quiz", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Reset sesi + buang cache pool supaya sesi berikutnya dapat soal BARU.
   * (Dulu pool di-cache staleTime:Infinity tanpa invalidasi → "Mulai sesi
   * baru" mengulang 10 soal yang sama persis.)
   */
  const resetSession = () => {
    qc.removeQueries({ queryKey: ["quiz", "questions"] });
    setQuestions(null);
    setIndex(0);
    setFeedback(null);
    setSessionCorrect(0);
    setSessionWrong(0);
    setMissed([]);
    setSessionDone(false);
  };

  // Ganti tipe / arah / jumlah soal → sesi di-reset.
  useEffect(() => {
    resetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, direction, count]);

  // Map pool questions → runtime once data arrives. Ditahan saat
  // sessionDone supaya kartu ringkasan tidak langsung tertimpa sesi baru.
  useEffect(() => {
    if (!isPlayType || sessionDone) return;
    if (!poolQ.data || questions !== null) return;
    setQuestions(buildRuntime(poolQ.data, direction));
  }, [poolQ.data, questions, isPlayType, sessionDone, direction]);

  // Lifetime progress for the active type
  const progress = useMemo(() => {
    return progressQ.data?.find((p) => p.quizType === type) ?? null;
  }, [progressQ.data, type]);

  // ---- handlers ----------------------------------------------------
  const onAnswer = async (correct: boolean) => {
    if (!questions) return;
    const current = questions[index];
    const correctLabel =
      current.view.choices.find((c) => c.id === current.view.correctChoiceId)?.label ??
      current.view.meaning ??
      "";
    setFeedback({
      correct,
      correctLabel,
      explanation: current.view.explanation,
    });
    if (correct) setSessionCorrect((n) => n + 1);
    else {
      setSessionWrong((n) => n + 1);
      setMissed((m) => [
        ...m,
        {
          searchKey: direction === "jp2id" ? current.view.prompt : correctLabel,
          prompt: current.view.prompt,
          correctLabel,
        },
      ]);
    }

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
      setSessionDone(true);
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
        eyebrow={
          <span className="inline-flex items-center gap-2 normal-case">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            <span className="font-jp tracking-[0.28em]">クイズ・しけん</span>
          </span>
        }
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

      {/* Pengaturan sesi: jumlah soal + arah + mode jawab */}
      {isPlayType && !isPoolLoading && !poolError ? (
        <div className="flex flex-wrap items-center gap-2">
          <PillGroup
            ariaLabel="Jumlah soal"
            options={COUNTS.map((c) => ({ key: String(c), label: `${c} soal` }))}
            value={String(count)}
            onChange={(k) => setCount(Number(k))}
          />
          <PillGroup
            ariaLabel="Arah soal"
            options={[
              { key: "jp2id", label: "日 → ID" },
              { key: "id2jp", label: "ID → 日" },
            ]}
            value={direction}
            onChange={(k) => setDirection(k as Direction)}
          />
          <div className="ml-auto">
            <PillGroup
              ariaLabel="Mode menjawab"
              options={[
                { key: "choice", label: "Pilihan ganda" },
                { key: "blank", label: "Isian" },
              ]}
              value={mode}
              onChange={(k) => setMode(k as AnswerMode)}
            />
          </div>
        </div>
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
        <QuestionCard
          question={questions[index].view}
          index={index}
          total={questions.length}
          mode={mode}
          blankInstruction={
            direction === "jp2id"
              ? "Tulis arti dalam Bahasa Indonesia"
              : "Tulis kata Jepangnya (kanji atau kana)"
          }
          feedback={feedback}
          submitting={submitMut.isPending}
          onAnswer={(correct) => onAnswer(correct)}
          onNext={onNext}
        />
      ) : null}

      {/* Pool returned 0 questions — empty pool */}
      {isPlayType && !isPoolLoading && !poolError && questions === null && !sessionDone ? (
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
      {isPlayType && sessionDone && sessionCorrect + sessionWrong > 0 ? (
        <SessionSummary
          correct={sessionCorrect}
          wrong={sessionWrong}
          missed={missed}
          onRestart={resetSession}
        />
      ) : null}
    </div>
  );
}

// ---- session summary (ensō) ----------------------------------------

function SessionSummary({
  correct,
  wrong,
  missed,
  onRestart,
}: {
  correct: number;
  wrong: number;
  missed: MissedItem[];
  onRestart: () => void;
}) {
  const total = correct + wrong;
  const acc = Math.round((correct / total) * 100);
  const kana = acc >= 80 ? "すばらしい！" : acc >= 60 ? "いいかんじ" : "もういちど！";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative overflow-hidden rounded-notebook bg-white p-8 shadow-notebook ring-1 ring-paper-200/90 dark:bg-ink-800 dark:ring-ink-700 sm:p-10"
    >
      <svg
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 -translate-y-1/2",
          acc >= 60 ? "text-leaf-500/10" : "text-accent-500/10",
        )}
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle
          cx="100"
          cy="100"
          r="84"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="492 36"
          transform="rotate(-96 100 100)"
        />
      </svg>

      <div className="relative text-center">
        <p className="font-jp text-xs tracking-[0.3em] text-accent-500">{kana}</p>
        <div className="mt-2 font-serif text-5xl font-semibold tabular-nums text-ink-800 dark:text-paper-50">
          {acc}
          <span className="text-xl font-normal text-ink-400">%</span>
        </div>
        <p className="mt-2 flex items-center justify-center gap-3 text-sm text-ink-400">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-leaf-500" />
            {correct} benar
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            {wrong} salah
          </span>
        </p>
      </div>

      {/* Daftar item yang salah — klik untuk review di Catatan. */}
      {missed.length > 0 ? (
        <div className="relative mx-auto mt-6 max-w-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Perlu diulang ({missed.length}) — otomatis ditandai lemah
          </p>
          <ul className="space-y-1.5">
            {missed.map((m, i) => (
              <li key={`${m.searchKey}-${i}`}>
                <Link
                  href={`${ROUTES.app.catatan}?q=${encodeURIComponent(m.searchKey)}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-rose-50/60 px-3 py-2 text-left ring-1 ring-inset ring-rose-200/60 transition-colors hover:bg-rose-50 dark:bg-rose-500/10 dark:ring-rose-400/20 dark:hover:bg-rose-500/15"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-jp text-sm text-ink-800 dark:text-paper-50">
                      <JapaneseText text={m.prompt} inert />
                    </span>
                    <span className="block truncate text-xs text-ink-400">
                      {m.correctLabel}
                    </span>
                  </span>
                  <span aria-hidden className="shrink-0 text-xs text-rose-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="relative mt-6 flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={onRestart}>
          Mulai sesi baru
        </Button>
        {missed.length > 0 ? (
          <LinkButton size="sm" variant="secondary" href={ROUTES.app.hafalan}>
            弱 Latih yang lemah di Hafalan
          </LinkButton>
        ) : (
          <LinkButton size="sm" variant="secondary" href={ROUTES.app.hafalan}>
            Lanjut ke Hafalan
          </LinkButton>
        )}
      </div>
    </motion.div>
  );
}

// ---- helpers --------------------------------------------------------

function buildRuntime(pool: QuizQuestion[], direction: Direction): QuestionRuntime[] {
  if (direction === "jp2id") return pool.map(toRuntimeFromPool);
  // Arah terbalik (arti → Jepang): distraktor diambil dari prompt JP soal
  // lain di pool yang sama.
  return pool.map((q, i) => {
    const others = shuffle(pool.filter((_, j) => j !== i));
    const distractors = others.slice(0, Math.min(3, others.length)).map((o) => o.prompt);
    const choices = shuffle([q.prompt, ...distractors]).map((label, k) => ({
      id: `r${k}-${label}`,
      label,
    }));
    const correctChoiceId = choices.find((c) => c.label === q.prompt)?.id ?? choices[0].id;
    return {
      view: {
        id: `rev-${q.id}`,
        prompt: q.meaning ?? q.prompt,
        reading: null,
        // meaning = jawaban JP (untuk mode isian + label feedback).
        meaning: q.prompt,
        // Terima juga reading kana sebagai jawaban isian yang benar.
        altAnswers: q.reading ? [q.reading] : undefined,
        choices,
        correctChoiceId,
      },
      source: { type: q.itemType, id: q.itemId },
    };
  });
}

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- pill group (toggle kecil seragam) ------------------------------

function PillGroup({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-full bg-white p-1 text-xs ring-1 ring-inset ring-paper-300 dark:bg-ink-800 dark:ring-ink-700"
    >
      {options.map((o) => {
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
                layoutId={`quiz-pill-${ariaLabel}`}
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
