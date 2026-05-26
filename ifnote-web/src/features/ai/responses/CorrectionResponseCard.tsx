"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ClickableKanji } from "@/features/kanji/ClickableKanji";
import { toast } from "@/components/feedback/Toast";
import type { CorrectSentenceData } from "../types";

interface Props {
  data: CorrectSentenceData;
  source: "ai" | "mock";
}

export function CorrectionResponseCard({ data, source }: Props) {
  const onCopy = async () => {
    const text = [
      `Asli: ${data.input}`,
      `Koreksi: ${data.corrected}`,
      data.explanation ? `Penjelasan: ${data.explanation}` : "",
    ].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast("Tersalin", "success");
    } catch { toast("Tidak bisa menyalin", "error"); }
  };

  return (
    <NotebookCard stripe="accent" className="p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-ink-800 dark:text-paper-50">Koreksi kalimat</h3>
        <Badge tone={source === "mock" ? "warn" : "leaf"}>{source === "mock" ? "Mock" : "AI"}</Badge>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-ink-400">Kalimat asli</div>
          <p className="font-jp text-ink-700 dark:text-paper-50"><ClickableKanji text={data.input} /></p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-leaf-600 dark:text-leaf-500">Versi koreksi</div>
          <p className="font-jp text-ink-700 dark:text-paper-50"><ClickableKanji text={data.corrected} /></p>
        </div>
        {data.explanation ? (
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-400">Penjelasan</div>
            <p className="text-ink-700 dark:text-paper-50">{data.explanation}</p>
          </div>
        ) : null}
        {data.issues && data.issues.length > 0 ? (
          <ul className="mt-1 space-y-1 rounded-xl bg-paper-50/60 px-3 py-2 text-xs dark:bg-ink-900/30">
            {data.issues.map((it, i) => (
              <li key={i}>
                <span className="font-jp">{it.text}</span>
                <span className="mx-1.5 text-ink-400">→</span>
                <span className="font-jp">{it.suggestion}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="ghost" onClick={onCopy}>Copy</Button>
      </div>
    </NotebookCard>
  );
}
