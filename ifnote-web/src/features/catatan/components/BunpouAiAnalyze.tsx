"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TextInput } from "@/components/ui/TextInput";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { AiLoading } from "@/components/ui/ai-loading";
import { useAnalyzeSentence, useExplainBunpou } from "@/features/ai/useAi";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/toast";
import {
  normalizeAiBunpouResult,
  type NormalizedBunpou,
} from "@/lib/ai-normalize";
import { cn, looksLikeJaSentence, normalizeJaKey } from "@/lib/utils";
import type { JlptLevel } from "@/lib/types";
import type { AnalyzeSentenceData } from "@/features/ai/types";
import type { BunpouWritePayload } from "@/features/catatan/useCatatan";

const MAX_PATTERNS = 10;

interface Props {
  /**
   * Simpan satu bunpou. Kembalikan false kalau gagal (child tidak lanjut
   * ke pola berikutnya). `keepOpen` = jangan tutup dialog — masih ada
   * antrian pola / daftar dari kalimat.
   */
  onApply: (
    payload: BunpouWritePayload,
    opts?: { keepOpen?: boolean },
  ) => boolean | Promise<boolean> | void;
  onCancel: () => void;
  /** Existing bunpou patterns, untuk duplicate detection. */
  existingPatterns: string[];
  /** Bunpou tersimpan (pattern + id) untuk tombol "Buka entri yang ada". */
  existingItems?: { pattern: string; id: string }[];
  /** Buka entri tersimpan dalam mode edit (dipakai saat pola duplikat). */
  onOpenSaved?: (id: string) => void;
}

export function BunpouAiAnalyze({
  onApply,
  onCancel,
  existingPatterns,
  existingItems = [],
  onOpenSaved,
}: Props) {
  const explain = useExplainBunpou();
  const sentenceAi = useAnalyzeSentence();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<NormalizedBunpou | null>(null);
  /** Antrian pola tersisa (mode multi-baris). */
  const [queue, setQueue] = useState<string[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  /** Hasil analisa kalimat (mode "Dari kalimat"). */
  const [sentenceInfo, setSentenceInfo] = useState<AnalyzeSentenceData | null>(null);
  const [savedPatterns, setSavedPatterns] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const patterns = parsePatterns(input);
  // Deteksi otomatis (tanpa toggle): ada baris yang terlihat seperti
  // kalimat Jepang → analisa kalimat (cari pola di dalamnya).
  const isSentenceInput = patterns.some(looksLikeJaSentence);
  const inQueue = queueTotal > 1;
  const fromSentence = sentenceInfo !== null;
  const currentIndex = queueTotal - queue.length; // 1-based saat draft aktif

  const analyzePattern = async (value: string) => {
    setError(null);
    try {
      const r = await explain.mutateAsync({ pattern: value });
      const normalized = normalizeAiBunpouResult(
        r.data as unknown as Record<string, unknown>,
      );
      if (!normalized.pattern) normalized.pattern = value;
      setDraft(normalized);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memanggil AI";
      setError(msg);
      notify.apiError(e);
      setDraft(null);
    }
  };

  const onAnalyzePatterns = async () => {
    if (patterns.length === 0) return;
    setQueueTotal(patterns.length);
    setQueue(patterns.slice(1));
    await analyzePattern(patterns[0]);
  };

  const onAnalyzeSentenceMode = async () => {
    const sentence = input.trim();
    if (!sentence) return;
    setError(null);
    try {
      const r = await sentenceAi.mutateAsync({ sentence });
      const found = r.data?.bunpouFound ?? [];
      if (found.length === 0) {
        setError("AI tidak menemukan pola bunpou di kalimat itu. Coba kalimat lain.");
        return;
      }
      setSentenceInfo(r.data);
      setSavedPatterns([]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memanggil AI";
      setError(msg);
      notify.apiError(e);
    }
  };

  const onAnalyze = () =>
    isSentenceInput ? onAnalyzeSentenceMode() : onAnalyzePatterns();

  /** Maju: pola berikutnya di antrian, atau kembali ke daftar kalimat. */
  const advance = async () => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setDraft(null);
      await analyzePattern(next);
    } else {
      setDraft(null);
      if (!fromSentence) setQueueTotal(0);
    }
  };

  const onSave = async () => {
    if (!draft) return;
    const keepOpen = queue.length > 0 || fromSentence;
    setSaving(true);
    try {
      const ok = await onApply(toPayload(draft), { keepOpen });
      if (ok === false) return; // gagal simpan → tetap di draft ini
      if (fromSentence) {
        setSavedPatterns((p) => [...p, normalizeJaKey(draft.pattern)]);
      }
      if (keepOpen) await advance();
    } finally {
      setSaving(false);
    }
  };

  const dupStatus = draft
    ? duplicateStatus(draft.pattern, existingPatterns)
    : "new";

  // ---------------------------------------------------------------- loading
  if (sentenceAi.isPending) {
    return (
      <AiLoading
        title="AI sedang membaca kalimatmu…"
        description="Mencari pola bunpou di dalam kalimat."
      />
    );
  }

  if (explain.isPending) {
    return (
      <AiLoading
        title="AI sedang menganalisa bunpou…"
        description={
          inQueue ? `Pola ${currentIndex} dari ${queueTotal}.` : "Tunggu sebentar ya."
        }
      />
    );
  }

  // ------------------------------------------------- daftar pola dari kalimat
  if (fromSentence && !draft) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-notebook border border-paper-200 bg-paper-50/60 p-3.5 pl-5 dark:border-ink-700 dark:bg-ink-900/30">
          <span aria-hidden className="absolute inset-y-3 left-2.5 w-px bg-accent-500/25" />
          <div className="font-jp text-base text-ink-800 dark:text-paper-50">
            <JapaneseText text={sentenceInfo.sentence} sentenceMode inert />
          </div>
          {sentenceInfo.meaning ? (
            <p className="mt-1 text-sm text-ink-400">{sentenceInfo.meaning}</p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Pola yang ditemukan — analisa lalu simpan satu per satu
          </p>
          <ul className="space-y-2">
            {sentenceInfo.bunpouFound.map((b) => {
              const saved = savedPatterns.includes(normalizeJaKey(b.pattern));
              const exists =
                duplicateStatus(b.pattern, existingPatterns) === "exists";
              return (
                <li
                  key={b.pattern}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-l-[3px] border-paper-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-800",
                    saved
                      ? "border-l-leaf-500 dark:border-l-leaf-600"
                      : exists
                        ? "border-l-amber-400 dark:border-l-amber-500"
                        : "border-l-lilac-400 dark:border-l-lilac-500",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-jp text-base font-medium text-ink-800 dark:text-paper-50">
                      {b.pattern}
                    </div>
                    <div className="truncate text-xs text-ink-400">{b.meaning}</div>
                  </div>
                  {saved ? (
                    <Badge tone="leaf">✓ Tersimpan</Badge>
                  ) : exists ? (
                    <Badge tone="warn">Sudah ada</Badge>
                  ) : null}
                  <Button
                    size="sm"
                    variant={saved ? "secondary" : "primary"}
                    disabled={saved}
                    onClick={() => analyzePattern(b.pattern)}
                  >
                    {saved ? "Selesai" : "Analisa"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setSentenceInfo(null); setSavedPatterns([]); }}
          >
            ← Ganti kalimat
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Selesai
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- input
  if (!draft) {
    const canAnalyze = input.trim().length > 0;
    return (
      <div className="space-y-4">
        {/* strip panduan */}
        <div className="relative overflow-hidden rounded-xl border border-paper-200 bg-paper-50/70 py-2.5 pl-4 pr-3 dark:border-ink-700 dark:bg-ink-900/30">
          <span aria-hidden className="absolute inset-y-2 left-2 w-px bg-accent-500/25" />
          <p className="text-xs leading-relaxed text-ink-400">
            Tulis <span className="font-medium text-ink-700 dark:text-paper-100">pola atau artinya</span>{" "}
            (beberapa pola? satu per baris, maks {MAX_PATTERNS}) — atau langsung{" "}
            <span className="font-medium text-ink-700 dark:text-paper-100">kalimat Jepang utuh</span>:
            AI otomatis mencari pola bunpou di dalam kalimatnya.
          </p>
        </div>

        <div>
          <Textarea
            label="Bunpou, arti, atau kalimat"
            rows={4}
            value={input}
            autoFocus
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canAnalyze) {
                e.preventDefault();
                void onAnalyze();
              }
            }}
            placeholder={"〜ながら\nsambil melakukan\n音楽を聞きながら勉強します。"}
            className="font-jp"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink-400/80">
              Tekan <kbd className="rounded bg-paper-100 px-1 dark:bg-ink-700">Ctrl</kbd>+
              <kbd className="rounded bg-paper-100 px-1 dark:bg-ink-700">Enter</kbd> untuk analisa
            </span>
            {isSentenceInput ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-600 ring-1 ring-inset ring-accent-200 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                Kalimat terdeteksi — AI akan mencari pola di dalamnya
              </span>
            ) : patterns.length > 1 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-100 px-2.5 py-0.5 text-xs font-medium text-ink-400 ring-1 ring-inset ring-paper-200 dark:bg-ink-800 dark:ring-ink-700">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                {patterns.length} pola — dianalisa berurutan
              </span>
            ) : null}
          </div>
        </div>
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-700/10 dark:text-rose-200">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={!canAnalyze}
            onClick={onAnalyze}
            className="gap-1.5"
          >
            <span aria-hidden>✨</span> Analisa pakai AI
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- draft
  const keepOpenNext = queue.length > 0 || fromSentence;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={dupStatus === "exists" ? "warn" : "leaf"}>
          {dupStatus === "exists" ? "Sudah ada" : "Baru"}
        </Badge>
        {inQueue ? (
          <Badge tone="neutral">
            Pola {currentIndex} dari {queueTotal}
          </Badge>
        ) : null}
        {input.trim() && !inQueue && !fromSentence && input.trim() !== draft.pattern ? (
          <span className="text-xs text-ink-400">
            Input: <span className="text-ink-500 dark:text-ink-50/70">{input.trim()}</span>
          </span>
        ) : null}
        <span className="ml-auto text-xs text-ink-400">
          AI menganalisa untuk kamu — periksa dan edit sebelum simpan.
        </span>
      </div>

      <div className="relative overflow-hidden rounded-notebook border border-paper-200 bg-paper-50/60 p-3.5 pl-5 dark:border-ink-700 dark:bg-ink-900/30">
        <span aria-hidden className="absolute inset-y-3 left-2.5 w-px bg-accent-500/25" />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-2 -top-4 select-none font-jp text-6xl leading-none text-ink-800/[0.04] dark:text-paper-50/[0.04]"
        >
          文
        </span>
        <div className="relative flex items-center gap-2">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          <span className="font-jp text-[10px] tracking-[0.28em] text-accent-600 dark:text-accent-400">
            プレビュー
          </span>
        </div>
        <div className="relative mt-1.5 font-jp text-xl font-medium text-ink-800 dark:text-paper-50">
          <JapaneseText
            text={draft.pattern}
            reading={draft.reading || undefined}
            kanaText={draft.reading || undefined}
            inert
          />
        </div>
        <div className="relative text-sm text-ink-700 dark:text-paper-50">{draft.meaning}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextInput
          label="Pola (pattern)"
          value={draft.pattern}
          onChange={(e) => setDraft({ ...draft, pattern: e.currentTarget.value })}
        />
        <TextInput
          label="Pembacaan pola (kana)"
          value={draft.reading}
          onChange={(e) => setDraft({ ...draft, reading: e.currentTarget.value })}
          placeholder="opsional"
        />
      </div>
      <TextInput
        label="Arti"
        value={draft.meaning}
        onChange={(e) => setDraft({ ...draft, meaning: e.currentTarget.value })}
      />
      <Textarea
        label="Formula"
        rows={3}
        value={draft.formula}
        onChange={(e) => setDraft({ ...draft, formula: e.currentTarget.value })}
        className="font-mono"
      />
      <Textarea
        label="Kapan dipakai"
        rows={3}
        value={draft.usage}
        onChange={(e) => setDraft({ ...draft, usage: e.currentTarget.value })}
      />
      <Select
        label="Level JLPT"
        value={draft.level}
        onChange={(e) =>
          setDraft({ ...draft, level: e.currentTarget.value as JlptLevel | "" })
        }
      >
        <option value="">— Tidak ditentukan —</option>
        <option value="N5">N5</option>
        <option value="N4">N4</option>
        <option value="N3">N3</option>
        <option value="N2">N2</option>
        <option value="N1">N1</option>
      </Select>
      <TextInput
        label="Contoh kalimat (Jepang)"
        value={draft.normalExample}
        onChange={(e) =>
          setDraft({
            ...draft,
            normalExample: e.currentTarget.value,
            beginnerExample: e.currentTarget.value,
          })
        }
      />
      <TextInput
        label="Pembacaan contoh (hiragana)"
        value={draft.exampleReading}
        onChange={(e) =>
          setDraft({ ...draft, exampleReading: e.currentTarget.value })
        }
        placeholder="ぜんぶ ひらがな"
      />
      <TextInput
        label="Arti contoh"
        value={draft.exampleMeaning}
        onChange={(e) =>
          setDraft({ ...draft, exampleMeaning: e.currentTarget.value })
        }
      />
      <Textarea
        label="Kesalahan umum"
        rows={3}
        value={draft.commonMistake}
        onChange={(e) =>
          setDraft({ ...draft, commonMistake: e.currentTarget.value })
        }
      />

      {dupStatus === "exists" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-700/10 dark:text-amber-200">
          <span className="min-w-0 flex-1">
            Pola ini sudah ada di Catatan. Buka entri yang ada untuk diedit,
            atau ubah patternnya supaya tidak duplikat.
          </span>
          {onOpenSaved && existingIdOf(draft.pattern, existingItems) ? (
            <button
              type="button"
              onClick={() =>
                onOpenSaved(existingIdOf(draft.pattern, existingItems) as string)
              }
              className="shrink-0 font-semibold underline-offset-4 hover:underline"
            >
              Buka entri yang ada →
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        {inQueue && queue.length > 0 ? (
          <Button type="button" variant="ghost" onClick={() => void advance()}>
            Lewati pola ini
          </Button>
        ) : fromSentence ? (
          <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
            ← Kembali ke daftar
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={() => { setDraft(null); setQueueTotal(0); setQueue([]); }}>
            Coba Lagi
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="button" loading={saving} onClick={() => void onSave()}>
          {keepOpenNext ? "Simpan & lanjut" : "Simpan ke Catatan"}
        </Button>
      </div>
    </div>
  );
}

function parsePatterns(text: string): string[] {
  return text
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_PATTERNS);
}

function toPayload(d: NormalizedBunpou): BunpouWritePayload {
  return {
    pattern: d.pattern.trim(),
    reading: d.reading.trim() || undefined,
    meaning: d.meaning.trim() || d.pattern,
    formula: d.formula.trim() || undefined,
    usage: d.usage.trim() || undefined,
    level: d.level || undefined,
    beginnerExample: d.beginnerExample.trim() || undefined,
    normalExample: d.normalExample.trim() || undefined,
    furiganaExample: d.furiganaExample.trim() || undefined,
    exampleReading: d.exampleReading.trim() || undefined,
    exampleMeaning: d.exampleMeaning.trim() || undefined,
    note: d.note.trim() || undefined,
    commonMistake: d.commonMistake.trim() || undefined,
    mastery: "mid",
  };
}

function duplicateStatus(
  pattern: string,
  existing: string[],
): "new" | "exists" {
  const target = normalizeJaKey(pattern);
  return existing.some((e) => normalizeJaKey(e) === target) ? "exists" : "new";
}

/** Cari id entri tersimpan yang pattern-nya sama (normalized). */
function existingIdOf(
  pattern: string,
  items: { pattern: string; id: string }[],
): string | null {
  const target = normalizeJaKey(pattern);
  return items.find((x) => normalizeJaKey(x.pattern) === target)?.id ?? null;
}
