"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
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
  /** Disable the form while a network call is in flight. */
  submitting?: boolean;
  onAnswer: (correct: boolean, picked: string) => void;
  onNext: () => void;
}

export function QuestionCard({
  question,
  index,
  total,
  feedback,
  mode,
  submitting,
  onAnswer,
  onNext,
}: Props) {
  const [pickedChoiceId, setPickedChoiceId] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  // ---- choice mode ------------------------------------------------
  const submitChoice = (choiceId: string) => {
    if (feedback) return; // already answered
    setPickedChoiceId(choiceId);
    const correct = choiceId === question.correctChoiceId;
    const correctLabel =
      question.choices.find((c) => c.id === question.correctChoiceId)?.label ??
      question.meaning ??
      "";
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
    const expected = normalize(expectedAnswer);
    const correct = guess.length > 0 && guess === expected;
    onAnswer(correct, typed.trim());
  };

  // After user submits, lock & show feedback. Render proceeds either way.
  return (
    <NotebookCard className="p-5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-ink-400">
          Pertanyaan {index + 1} / {total}
        </span>
        <span className="text-xs text-ink-400">
          {mode === "choice" ? "Pilih jawaban yang benar" : "Tulis arti dalam Bahasa Indonesia"}
        </span>
      </div>

      <h2 className="mt-2 text-2xl text-ink-800 dark:text-paper-50">
        <JapaneseText
          text={question.prompt}
          reading={question.reading || undefined}
          kanaText={question.reading || undefined}
          enableKanjiClick={!feedback}
        />
      </h2>
      {question.meaning && mode === "choice" ? null : null}

      {/* Multiple choice */}
      {mode === "choice" ? (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {question.choices.map((c) => {
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
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left text-sm ring-1 ring-inset transition-colors",
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
                  <span>{c.label}</span>
                  {showCorrectColor ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                  {showWrongColor ? <X className="h-4 w-4 shrink-0" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <form onSubmit={submitBlank} className="mt-4 space-y-2">
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

      {feedback ? (
        <div
          className={cn(
            "mt-4 rounded-xl px-3.5 py-3 text-sm ring-1 ring-inset",
            feedback.correct
              ? "bg-leaf-50 text-leaf-700 ring-leaf-300 dark:bg-leaf-500/10 dark:text-leaf-300 dark:ring-leaf-400/40"
              : "bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/40",
          )}
          role="status"
          aria-live="polite"
        >
          <p className="flex items-center gap-1.5 font-semibold">
            {feedback.correct ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <X className="h-4 w-4" aria-hidden />
            )}
            {feedback.correct ? "Benar!" : "Belum tepat"}
          </p>
          {!feedback.correct ? (
            <p className="mt-0.5">
              Jawaban yang benar: <span className="font-medium">{feedback.correctLabel}</span>
            </p>
          ) : null}
          {feedback.explanation ? (
            <p className="mt-1 text-sm/relaxed">{feedback.explanation}</p>
          ) : null}
        </div>
      ) : null}

      {feedback ? (
        <div className="mt-4 flex justify-end">
          <Button onClick={onNext}>{index + 1 === total ? "Selesai" : "Lanjut →"}</Button>
        </div>
      ) : null}
    </NotebookCard>
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
