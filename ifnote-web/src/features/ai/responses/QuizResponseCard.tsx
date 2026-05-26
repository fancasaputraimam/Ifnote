"use client";

import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ROUTES } from "@/lib/constants";
import type { GenerateQuizData } from "../types";

interface Props {
  data: GenerateQuizData;
  source: "ai" | "mock";
}

export function QuizResponseCard({ data, source }: Props) {
  const questions = data.questions ?? [];
  return (
    <NotebookCard stripe="lilac" className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ink-800 dark:text-paper-50">
          Quiz: {data.topic || "umum"}
        </h3>
        <Badge tone={source === "mock" ? "warn" : "leaf"}>{source === "mock" ? "Mock" : "AI"}</Badge>
      </div>
      <p className="mt-1 text-xs text-ink-400">
        {questions.length} soal pilihan ganda. Buka tab Quiz untuk berlatih dengan progress tersimpan.
      </p>

      {questions.length > 0 ? (
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm">
          {questions.slice(0, 5).map((q, i) => (
            <li key={i}>
              <p className="font-jp text-ink-700 dark:text-paper-50">{q.prompt}</p>
              <ul className="mt-1 space-y-0.5 text-ink-400">
                {q.choices.map((c) => (
                  <li key={c.id} className={c.id === q.correctChoiceId ? "text-leaf-600 dark:text-leaf-500" : ""}>
                    {c.label}
                    {c.id === q.correctChoiceId ? " ✓" : ""}
                  </li>
                ))}
              </ul>
              {q.explanation ? (
                <p className="mt-0.5 text-xs italic text-ink-400">{q.explanation}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-ink-400">AI tidak mengembalikan soal.</p>
      )}

      <div className="mt-4">
        <LinkButton size="sm" href={ROUTES.app.quiz}>Mulai sesi quiz</LinkButton>
      </div>
    </NotebookCard>
  );
}
