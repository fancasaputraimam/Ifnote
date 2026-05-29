"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TextInput } from "@/components/ui/TextInput";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { AiLoading } from "@/components/ui/ai-loading";
import { useExplainBunpou } from "@/features/ai/useAi";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/toast";
import {
  normalizeAiBunpouResult,
  type NormalizedBunpou,
} from "@/lib/ai-normalize";
import type { JlptLevel } from "@/lib/types";
import type { BunpouWritePayload } from "@/features/catatan/useCatatan";

interface Props {
  onApply: (payload: BunpouWritePayload) => void;
  onCancel: () => void;
  /** Existing bunpou patterns, untuk duplicate detection. */
  existingPatterns: string[];
  /**
   * Optional callback when user wants to open an existing saved entry.
   * Currently passed through from CatatanScreen but the duplicate-resolve UI
   * ("Buka entri yang ada") is wired in a follow-up — accepted here so the
   * prop chain type-checks cleanly.
   */
  onOpenSaved?: (id: string) => void;
}

export function BunpouAiAnalyze({
  onApply,
  onCancel,
  existingPatterns,
  onOpenSaved: _onOpenSaved,
}: Props) {
  const explain = useExplainBunpou();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<NormalizedBunpou | null>(null);

  const onAnalyze = async () => {
    const value = input.trim();
    if (!value) return;
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
    }
  };

  const dupStatus = draft
    ? duplicateStatus(draft.pattern, existingPatterns)
    : "new";

  if (explain.isPending) {
    return (
      <AiLoading
        title="AI sedang menganalisa bunpou…"
        description="Tunggu sebentar ya."
      />
    );
  }

  if (!draft) {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
            Masukkan bunpou, arti, atau contoh kalimat
          </label>
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Bisa Bahasa Jepang atau Indonesia. Contoh:\n〜ながら\nsambil melakukan dua aktivitas\n音楽を聞きながら、勉強します。`}
            className="block w-full resize-none rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
          />
          <p className="mt-1 text-xs text-ink-400">
            AI akan menebak Bahasa input. Pola, arti, formula, contoh, dan
            kesalahan umum dikembalikan terstruktur. Bisa diedit sebelum disimpan.
          </p>
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
          <Button type="button" disabled={!input.trim()} onClick={onAnalyze}>
            Analisa Bunpou dengan AI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={dupStatus === "exists" ? "warn" : "leaf"}>
          {dupStatus === "exists" ? "Sudah ada" : "Baru"}
        </Badge>
        {input.trim() && input.trim() !== draft.pattern ? (
          <span className="text-xs text-ink-400">
            Input: <span className="text-ink-500 dark:text-ink-50/70">{input.trim()}</span>
          </span>
        ) : null}
        <span className="ml-auto text-xs text-ink-400">
          AI menganalisa untuk kamu — periksa dan edit sebelum simpan.
        </span>
      </div>

      <div className="rounded-xl border border-paper-200 bg-paper-50/60 p-3 dark:border-ink-700 dark:bg-ink-900/30">
        <div className="text-[11px] uppercase tracking-wide text-ink-400">Pratinjau</div>
        <div className="mt-1 text-base font-semibold text-ink-800 dark:text-paper-50">
          <JapaneseText
            text={draft.pattern}
            reading={draft.reading || undefined}
            inert
          />
        </div>
        <div className="text-sm text-ink-700 dark:text-paper-50">{draft.meaning}</div>
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
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
          Formula
        </label>
        <textarea
          rows={3}
          value={draft.formula}
          onChange={(e) => setDraft({ ...draft, formula: e.currentTarget.value })}
          className="block w-full resize-y rounded-xl border border-paper-200 bg-white px-3 py-2 font-mono text-sm text-ink-800 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
          Kapan dipakai
        </label>
        <textarea
          rows={3}
          value={draft.usage}
          onChange={(e) => setDraft({ ...draft, usage: e.currentTarget.value })}
          className="block w-full resize-y rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
        />
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
          Level JLPT
        </span>
        <select
          value={draft.level}
          onChange={(e) =>
            setDraft({ ...draft, level: e.currentTarget.value as JlptLevel | "" })
          }
          className="block w-full rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
        >
          <option value="">— Tidak ditentukan —</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
          <option value="N2">N2</option>
          <option value="N1">N1</option>
        </select>
      </label>
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
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
          Kesalahan umum
        </label>
        <textarea
          rows={3}
          value={draft.commonMistake}
          onChange={(e) =>
            setDraft({ ...draft, commonMistake: e.currentTarget.value })
          }
          className="block w-full resize-y rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
        />
      </div>

      {dupStatus === "exists" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-700/10 dark:text-amber-200">
          Pola ini sudah ada di Catatan. Pertimbangkan membuka entri yang ada
          untuk diedit, atau ubah patternnya supaya tidak duplikat.
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
          Coba Lagi
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="button" onClick={() => onApply(toPayload(draft))}>
          Simpan ke Catatan
        </Button>
      </div>
    </div>
  );
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
  const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const target = norm(pattern);
  return existing.some((e) => norm(e) === target) ? "exists" : "new";
}
