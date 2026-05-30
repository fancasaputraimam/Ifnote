"use client";

import { useState } from "react";
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
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
                    "disabled:cursor-not-allowed",
                    !feedback &&
                      "border-paper-200 bg-white hover:bg-paper-50 dark:border-ink-700 dark:bg-ink-800 dark:hover:bg-ink-700",
                    showCorrectColor &&
                      "border-leaf-500 bg-leaf-500/10 text-leaf-600 dark:text-leaf-500",
                    showWrongColor &&
                      "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-700/15 dark:text-rose-200",
                    !!feedback && !showCorrectColor && !showWrongColor &&
                      "border-paper-200 bg-paper-50/50 text-ink-400 dark:border-ink-700 dark:bg-ink-900/20",
                  )}
                  aria-pressed={picked}
                >
                  <span>{c.label}</span>
                  {showCorrectColor ? <span aria-hidden>✓</span> : null}
                  {showWrongColor ? <span aria-hidden>✗</span> : null}
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
            "mt-4 rounded-xl border px-3 py-2.5 text-sm",
            feedback.correct
              ? "border-leaf-500 bg-leaf-500/10 text-leaf-600 dark:text-leaf-500"
              : "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-700/15 dark:text-rose-200",
          )}
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold">
            {feedback.correct ? "✓ Benar!" : "✗ Belum tepat"}
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
