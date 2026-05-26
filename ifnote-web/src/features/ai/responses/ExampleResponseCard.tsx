"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ClickableKanji } from "@/features/kanji/ClickableKanji";
import { toast } from "@/components/feedback/Toast";
import type { MakeExampleData } from "../types";

interface Props {
  data: MakeExampleData;
  source: "ai" | "mock";
}

export function ExampleResponseCard({ data, source }: Props) {
  const onCopy = async () => {
    const text = [
      `Topik: ${data.topic}`,
      ...(data.examples ?? []).map((e) => `${e.jp} — ${e.meaning}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast("Tersalin", "success");
    } catch { toast("Tidak bisa menyalin", "error"); }
  };

  return (
    <NotebookCard stripe="leaf" className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ink-800 dark:text-paper-50">
          Contoh untuk &ldquo;{data.topic}&rdquo;
        </h3>
        <Badge tone={source === "mock" ? "warn" : "leaf"}>{source === "mock" ? "Mock" : "AI"}</Badge>
      </div>

      {data.examples && data.examples.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {data.examples.map((e, i) => (
            <li key={i} className="rounded-xl bg-paper-50/60 px-3 py-2 dark:bg-ink-900/30">
              <p className="font-jp text-ink-700 dark:text-paper-50">
                <ClickableKanji text={e.jp} />
              </p>
              <p className="text-sm text-ink-400">{e.meaning}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-400">AI tidak mengembalikan contoh.</p>
      )}

      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="ghost" onClick={onCopy}>Copy</Button>
      </div>
    </NotebookCard>
  );
}
