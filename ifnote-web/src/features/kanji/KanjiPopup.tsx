"use client";

import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useKanjiInfo } from "@/features/home/useKanjiInfo";

interface Props {
  open: boolean;
  kanji: string | null;
  onClose: () => void;
}

interface KanjiWord {
  jp?: string;
  meaning?: string;
}

export function KanjiPopup({ open, kanji, onClose }: Props) {
  const q = useKanjiInfo(kanji, open);
  const data = q.data;

  return (
    <Modal open={open} onClose={onClose} title={kanji ? `Kanji: ${kanji}` : "Kanji"}>
      {q.isLoading ? (
        <LoadingState label="Mengambil info kanji…" />
      ) : q.isError || !data ? (
        <div className="text-sm text-ink-400">
          Tidak bisa memuat info kanji.
          <span className="block mt-1 text-xs">
            Pastikan kamu sudah login dan backend menyala.
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="font-jp text-6xl leading-none text-accent-600 dark:text-accent-300">
              {data.kanji}
            </div>
            <div className="flex-1 space-y-1">
              {data.meaning ? (
                <p className="text-sm text-ink-700 dark:text-paper-50">{data.meaning}</p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {data.onyomi ? (
                  <Badge tone="accent">音 {data.onyomi}</Badge>
                ) : null}
                {data.kunyomi ? (
                  <Badge tone="lilac">訓 {data.kunyomi}</Badge>
                ) : null}
                <Badge tone={data.source === "fallback" ? "warn" : "neutral"}>
                  {data.source === "ai"
                    ? "AI"
                    : data.source === "cache"
                    ? "cache"
                    : "fallback"}
                </Badge>
              </div>
            </div>
          </div>

          {data.explanation ? (
            <p className="text-sm text-ink-700 dark:text-paper-50">{data.explanation}</p>
          ) : null}

          {Array.isArray(data.wordsJson) && (data.wordsJson as KanjiWord[]).length > 0 ? (
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
                Kata gabungan
              </h3>
              <ul className="space-y-1 text-sm">
                {(data.wordsJson as KanjiWord[]).map((w, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="font-jp text-ink-700 dark:text-paper-50">{w.jp ?? "—"}</span>
                    <span className="text-ink-400">{w.meaning ?? ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.exampleJp ? (
            <div className="rounded-xl bg-paper-50/60 px-3 py-2 text-sm dark:bg-ink-900/30">
              <p className="font-jp text-ink-700 dark:text-paper-50">{data.exampleJp}</p>
              {data.exampleId ? (
                <p className="mt-1 text-xs text-ink-400">{data.exampleId}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
