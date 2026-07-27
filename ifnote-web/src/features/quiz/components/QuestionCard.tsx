"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { cn } from "@/lib/utils";

export interface AnsweredFeedback {
  correct: boolean;
  correctLabel: string;
  explanation?: string;
}

export interface QuestionViewModel {
  /** Synthetic id for keying. Pool quiz uses kotoba/bunpou id; AI uses array index. */
  id: string;
  /** What to render as the prompt. JP for kotoba, pattern for bunpou, free text for AI. */
  prompt: string;
  /** Reading hiragana penuh untuk prompt — dipakai mode Pemula (kana). */
  reading?: string | null;
  /** Indonesian meaning (used for blank-answer mode + tooltip). */
  meaning?: string;
  /** Jawaban isian alternatif yang juga diterima (mis. reading kana). */
  altAnswers?: string[];
  choices: { id: string; label: string }[];
  correctChoiceId: string;
  explanation?: string;
}

export type AnswerMode = "choice" | "blank";

interface Props {
  question: QuestionViewModel;
  index: number;
  total: number;
  /** Pre-answered feedback (after user submits). null = not yet answered. */
  feedback: AnsweredFeedback | null;
  mode: AnswerMode;
  /** Instruksi mode isian (berbeda untuk arah 日→ID vs ID→日). */
  blankInstruction?: string;
  /** Disable the form while a network call is in flight. */
  submitting?: boolean;
  onAnswer: (correct: boolean, picked: string) => void;
  onNext: () => void;
}

/** Prefiks pilihan ala Jepang — ア・イ・ウ・エ… */
const CHOICE_KANA = ["ア", "イ", "ウ", "エ", "オ", "カ"];

export function QuestionCard({
  question,
  index,
  total,
  feedback,
  mode,
  blankInstruction = "Tulis arti dalam Bahasa Indonesia",
  submitting,
  onAnswer,
  onNext,
}: Props) {
  const [pickedChoiceId, setPickedChoiceId] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  // Reset pilihan/isian tiap ganti soal — tanpa ini, isian soal sebelumnya
  // terbawa ke soal berikutnya.
  useEffect(() => {
    setPickedChoiceId(null);
    setTyped("");
  }, [question.id]);

  // ---- choice mode ------------------------------------------------
  const submitChoice = (choiceId: string) => {
    if (feedback) return; // already answered
    setPickedChoiceId(choiceId);
    const correct = choiceId === question.correctChoiceId;
    onAnswer(correct, choiceId);
  };

  // ---- blank mode -------------------------------------------------
  const expectedAnswer =
    question.meaning?.trim() ||
    question.choices.find((c) => c.id === question.correctChoiceId)?.label ||
    "";

  const submitBlank = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback) return;
    const guess = normalize(typed);
    // Arti sering multi-makna ("air, minum" / "makan / menyantap") —
    // terima SALAH SATU variannya, plus jawaban alternatif (mis. reading).
    const accepted = new Set<string>();
    for (const src of [expectedAnswer, ...(question.altAnswers ?? [])]) {
      for (const v of acceptedVariants(src)) accepted.add(v);
    }
    const correct = guess.length > 0 && accepted.has(guess);
    onAnswer(correct, typed.trim());
  };

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative overflow-hidden rounded-notebook bg-white p-5 shadow-notebook ring-1 ring-paper-200/90 dark:bg-ink-800 dark:ring-ink-700 sm:p-6"
    >
      <span aria-hidden className="absolute inset-y-4 left-3 w-px bg-accent-500/20" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-5 select-none font-jp text-7xl leading-none text-ink-800/[0.03] dark:text-paper-50/[0.03]"
      >
        問
      </span>

      <div className="relative pl-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            <span className="font-jp text-[11px] tracking-[0.28em] text-accent-600 dark:text-accent-400">
              もんだい
            </span>
            <span className="text-xs font-semibold tabular-nums text-ink-700 dark:text-paper-100">
              {index + 1}
              <span className="font-normal text-ink-400"> / {total}</span>
            </span>
          </span>
          <span className="text-xs text-ink-400">
            {mode === "choice" ? "Pilih jawaban yang benar" : blankInstruction}
          </span>
        </div>

        {/* progres soal */}
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper-100 dark:bg-ink-900/60">
          <motion.div
            className="h-full rounded-full bg-accent-gradient"
            initial={false}
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          />
        </div>

        <h2 className="mt-4 font-jp text-2xl leading-relaxed text-ink-800 dark:text-paper-50 sm:text-3xl">
          <JapaneseText
            text={question.prompt}
            reading={question.reading || undefined}
            kanaText={question.reading || undefined}
            enableKanjiClick={!feedback}
          />
        </h2>

        {/* Multiple choice */}
        {mode === "choice" ? (
          <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {question.choices.map((c, ci) => {
              const picked = pickedChoiceId === c.id;
              const isCorrect = c.id === question.correctChoiceId;
              const showCorrectColor = !!feedback && isCorrect;
              const showWrongColor = !!feedback && picked && !isCorrect;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => submitChoice(c.id)}
                    disabled={!!feedback || submitting}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ring-1 ring-inset transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
                      "disabled:cursor-not-allowed",
                      !feedback &&
                        "bg-white ring-paper-300 hover:bg-paper-50 hover:ring-paper-400 dark:bg-ink-800 dark:ring-ink-700 dark:hover:bg-ink-700",
                      showCorrectColor &&
                        "bg-leaf-50 text-leaf-700 ring-leaf-400 dark:bg-leaf-500/10 dark:text-leaf-300 dark:ring-leaf-400/50",
                      showWrongColor &&
                        "bg-rose-50 text-rose-700 ring-rose-400 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/50",
                      !!feedback && !showCorrectColor && !showWrongColor &&
                        "bg-paper-50/50 text-ink-400 ring-paper-200 dark:bg-ink-900/20 dark:ring-ink-700",
                    )}
                    aria-pressed={picked}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-[8px] font-serif text-xs ring-1 ring-inset transition-transform duration-200",
                        showCorrectColor
                          ? "bg-leaf-500 text-white ring-transparent"
                          : showWrongColor
                            ? "bg-rose-500 text-white ring-transparent"
                            : "-rotate-3 bg-paper-100 text-ink-400 ring-paper-200 group-hover:rotate-0 dark:bg-ink-900/50 dark:ring-ink-700",
                      )}
                    >
                      {showCorrectColor ? "○" : showWrongColor ? "✕" : CHOICE_KANA[ci] ?? "・"}
                    </span>
                    <span className="min-w-0 flex-1">{c.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <form onSubmit={submitBlank} className="mt-5 space-y-2">
            <TextInput
              placeholder="Tulis arti…"
              value={typed}
              onChange={(e) => setTyped(e.currentTarget.value)}
              disabled={!!feedback || submitting}
              autoFocus
            />
            {!feedback ? (
              <Button type="submit" loading={submitting} disabled={typed.trim().length === 0}>
                Submit jawaban
              </Button>
            ) : null}
          </form>
        )}

        {/* Feedback — maru/batsu ala Jepang */}
        {feedback ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn(
              "mt-5 flex items-start gap-3 rounded-xl px-3.5 py-3 text-sm ring-1 ring-inset",
              feedback.correct
                ? "bg-leaf-50 text-leaf-700 ring-leaf-300 dark:bg-leaf-500/10 dark:text-leaf-300 dark:ring-leaf-400/40"
                : "bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/40",
            )}
            role="status"
            aria-live="polite"
          >
            <motion.span
              aria-hidden
              initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
              className="font-serif text-3xl leading-none"
            >
              {feedback.correct ? "○" : "✕"}
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {feedback.correct ? "Benar! " : "Belum tepat "}
                <span className="font-jp text-xs font-normal opacity-70">
                  {feedback.correct ? "せいかい" : "ざんねん"}
                </span>
              </p>
              {!feedback.correct ? (
                <p className="mt-0.5">
                  Jawaban yang benar:{" "}
                  <span className="font-medium">{feedback.correctLabel}</span>
                </p>
              ) : null}
              {feedback.explanation ? (
                <p className="mt-1 text-sm/relaxed">{feedback.explanation}</p>
              ) : null}
            </div>
          </motion.div>
        ) : null}

        {feedback ? (
          <div className="mt-4 flex justify-end">
            <Button onClick={onNext}>{index + 1 === total ? "Selesai" : "Lanjut →"}</Button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

// Loose normalization for blank-answer comparison: lowercase, strip
// punctuation, collapse whitespace. Lenient enough for mid-N5 learners.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,;:!?'"()\[\]\-—_/]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Varian jawaban yang diterima dari satu string arti:
 *  - string utuh,
 *  - versi tanpa isi kurung ("air (minum)" → "air"),
 *  - tiap potongan yang dipisah koma / titik-koma / garis miring / 、.
 */
function acceptedVariants(s: string): string[] {
  if (!s) return [];
  const noParen = s.replace(/[（(].*?[）)]/g, " ");
  const parts = noParen.split(/[,;/、／]+/);
  return [s, noParen, ...parts].map(normalize).filter(Boolean);
}
