"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TextInput } from "@/components/ui/TextInput";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { AiLoading } from "@/components/ui/ai-loading";
import { useExplainKotoba, useTranslateExample } from "@/features/ai/useAi";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/toast";
import {
  hasIncompleteExampleMeaning,
  normalizeAiKotobaResult,
  type NormalizedKotoba,
} from "@/lib/ai-normalize";
import type { JlptLevel } from "@/lib/types";
import type { KotobaWritePayload } from "@/features/catatan/useCatatan";

interface Props {
  /** Apply the AI preview into the parent form (Tambah Kotoba). */
  onApply: (payload: KotobaWritePayload) => void;
  /** Cancel/back. */
  onCancel: () => void;
  /** Existing kotoba JP strings (already in catatan), for duplicate detection. */
  existingJp: string[];
  /**
   * Optional callback when user wants to open an existing saved entry.
   * Currently passed through from CatatanScreen but the duplicate-resolve UI
   * ("Buka entri yang ada") is wired in a follow-up — accepted here so the
   * prop chain type-checks cleanly.
   */
  onOpenSaved?: (id: string) => void;
}

/**
 * AI Analyze panel for single Kotoba.
 *
 * Flow:
 *   1. user types Indonesian or Japanese hint
 *   2. clicks Analisa
 *   3. backend AI returns structured response
 *   4. response normalized via `normalizeAiKotobaResult` (handles
 *      reading/kana/yomi/furigana key aliases — never loses furigana)
 *   5. preview card shows AI result + duplicate warning
 *   6. user can edit fields, then `onApply(payload)` hands them to parent form
 *
 * Never auto-saves. The parent form is what actually POSTs to /api/kotoba.
 */
export function KotobaAiAnalyze({
  onApply,
  onCancel,
  existingJp,
  onOpenSaved: _onOpenSaved,
}: Props) {
  const explain = useExplainKotoba();
  const repair = useTranslateExample();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<NormalizedKotoba | null>(null);
  /** Set once the auto-repair has run (success or fail) so we don't loop. */
  const repairAttempted = useRef(false);

  const onAnalyze = async () => {
    const value = input.trim();
    if (!value) return;
    setError(null);
    repairAttempted.current = false;
    try {
      const r = await explain.mutateAsync({ jp: value });
      const normalized = normalizeAiKotobaResult(
        r.data as unknown as Record<string, unknown>,
      );
      // jp boleh kosong kalau provider hanya balikin "topic" — coba pakai
      // input user sebagai fallback.
      if (!normalized.jp) normalized.jp = value;
      setDraft(normalized);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memanggil AI";
      setError(msg);
      // Toast paralel — supaya user tetap melihat feedback meskipun panel
      // AI ini scroll keluar layar (panjang form).
      notify.apiError(e);
    }
  };

  // Auto-repair: kalau AI balik dengan kalimat contoh tapi tanpa
  // terjemahan natural, panggil endpoint repair satu kali untuk mengisi
  // exampleMeaning. User tetap bisa edit manual kalau hasil repair
  // belum sesuai.
  useEffect(() => {
    if (!draft) return;
    if (repairAttempted.current) return;
    if (repair.isPending) return;
    const incomplete = hasIncompleteExampleMeaning({
      meaning: draft.meaning,
      normalExample: draft.normalExample,
      exampleMeaning: draft.exampleMeaning,
    });
    if (!incomplete) return;
    if (!draft.jp.trim() || !draft.normalExample.trim()) return;
    repairAttempted.current = true;
    repair
      .mutateAsync({
        kotoba: draft.jp,
        meaning: draft.meaning,
        normalExample: draft.normalExample,
        exampleReading: draft.exampleReading || undefined,
      })
      .then((res) => {
        const t = (res.data?.exampleMeaning ?? "").trim();
        if (!t) return;
        setDraft((prev) => (prev ? { ...prev, exampleMeaning: t } : prev));
      })
      .catch(() => {
        // Diam saja — UI tetap menampilkan warning + Save tetap disabled.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const dupStatus = draft ? duplicateStatus(draft.jp, existingJp) : "new";
  const exampleIncomplete = draft
    ? hasIncompleteExampleMeaning({
        meaning: draft.meaning,
        normalExample: draft.normalExample,
        exampleMeaning: draft.exampleMeaning,
      })
    : false;
  const canSave =
    !!draft &&
    !!draft.jp.trim() &&
    !!draft.meaning.trim() &&
    !exampleIncomplete;

  if (explain.isPending) {
    return (
      <AiLoading
        title="AI sedang menganalisa kotoba…"
        description="Tunggu sebentar ya."
      />
    );
  }

  if (repair.isPending) {
    return (
      <AiLoading
        title="AI sedang melengkapi arti contoh…"
        description="Tunggu sebentar ya."
      />
    );
  }

  if (!draft) {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
            Masukkan kotoba atau artinya
          </label>
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Contoh: 食べます, makan, berat, 甜い物"}
            className="block w-full resize-none rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
          />
          <p className="mt-1 text-xs text-ink-400">
            Bisa bahasa Jepang atau Indonesia. AI akan mengembalikan tulisan
            Jepang, pembacaan, arti, jenis, level, contoh kalimat, dan arti
            contoh.
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
            Analisa pakai AI
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
        {input.trim() && input.trim() !== draft.jp ? (
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
            text={draft.jp}
            reading={draft.reading || undefined}
            inert
          />
        </div>
        <div className="text-sm text-ink-700 dark:text-paper-50">{draft.meaning}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextInput
          label="Tulisan Jepang"
          value={draft.jp}
          onChange={(e) => setDraft({ ...draft, jp: e.currentTarget.value })}
        />
        <TextInput
          label="Pembacaan (kana)"
          value={draft.reading}
          onChange={(e) => setDraft({ ...draft, reading: e.currentTarget.value })}
          placeholder="ひらがな"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextInput
          label="Romaji"
          value={draft.romaji}
          onChange={(e) => setDraft({ ...draft, romaji: e.currentTarget.value })}
        />
        <TextInput
          label="Arti"
          value={draft.meaning}
          onChange={(e) => setDraft({ ...draft, meaning: e.currentTarget.value })}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextInput
          label="Jenis kata"
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.currentTarget.value })}
        />
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
      </div>
      <TextInput
        label="Contoh kalimat (Jepang)"
        value={draft.normalExample}
        onChange={(e) =>
          setDraft({ ...draft, normalExample: e.currentTarget.value, beginnerExample: e.currentTarget.value })
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

      {dupStatus === "exists" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-700/10 dark:text-amber-200">
          Kotoba ini sudah ada di Catatan. Kalau tetap disimpan, akan jadi entri
          terpisah — pertimbangkan membuka entri yang sudah ada untuk diedit.
        </div>
      ) : null}

      {exampleIncomplete ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-700/10 dark:text-amber-200">
          🍂 Arti contoh belum lengkap. Isi terjemahan kalimat contoh dulu
          sebelum simpan.
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
          Coba Lagi
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="button"
          disabled={!canSave}
          onClick={() => onApply(toPayload(draft))}
        >
          Simpan ke Catatan
        </Button>
      </div>
    </div>
  );
}

function toPayload(d: NormalizedKotoba): KotobaWritePayload {
  return {
    jp: d.jp.trim(),
    reading: d.reading.trim() || undefined,
    romaji: d.romaji.trim() || undefined,
    meaning: d.meaning.trim() || d.jp,
    type: d.type.trim() || undefined,
    level: d.level || undefined,
    beginnerExample: d.beginnerExample.trim() || undefined,
    normalExample: d.normalExample.trim() || undefined,
    furiganaExample: d.furiganaExample.trim() || undefined,
    exampleReading: d.exampleReading.trim() || undefined,
    exampleMeaning: d.exampleMeaning.trim() || undefined,
    mastery: "mid",
  };
}

function duplicateStatus(jp: string, existing: string[]): "new" | "exists" {
  const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const target = norm(jp);
  return existing.some((e) => norm(e) === target) ? "exists" : "new";
}
