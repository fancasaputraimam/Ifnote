"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { AiLoading } from "@/components/ui/ai-loading";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useBulkKotobaAi } from "@/features/ai/useAi";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/toast";
import {
  hasIncompleteExampleMeaning,
  normalizeAiKotobaResult,
} from "@/lib/ai-normalize";
import { cleanJapaneseResponse } from "@/lib/japanese-text";
import { cn } from "@/lib/utils";
import type { BulkKotobaItem } from "@/features/ai/types";
import type { JlptLevel } from "@/lib/types";
import type { KotobaWritePayload } from "@/features/catatan/useCatatan";

const MAX_ITEMS = 50;

interface Props {
  /**
   * Save handler — parent calls POST /api/kotoba per item, invalidates
   * queries afterwards. Returns when all saves are settled.
   */
  onSaveAll: (payloads: KotobaWritePayload[]) => Promise<void>;
  onCancel: () => void;
  /** Existing kotoba JP strings used for additional client-side dedup. */
  existingJp: string[];
}

export function KotobaBulkAi({ onSaveAll, onCancel, existingJp }: Props) {
  const bulk = useBulkKotobaAi();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => parseInput(text), [text]);
  const overLimit = parsed.length > MAX_ITEMS;

  const onAnalyze = async () => {
    if (parsed.length === 0) return;
    if (overLimit) {
      setError(
        `Maksimal ${MAX_ITEMS} kotoba per analisa. Kurangi jumlah input dulu.`,
      );
      notify.warning(
        "Batas analisa",
        `Maksimal ${MAX_ITEMS} kotoba per sekali analisa. Kurangi jumlah input dulu.`,
      );
      return;
    }
    setError(null);
    try {
      const r = await bulk.mutateAsync({ words: parsed });
      const cleaned = cleanJapaneseResponse(r.data, {
        preserveRuby: false,
      }) as { items: BulkKotobaItem[] };
      // Re-check duplicates against current catatan list (defense in depth).
      const existingNorm = new Set(existingJp.map(normalize));
      const list: EditableItem[] = (cleaned.items ?? []).map((it) => {
        // Lewatkan response per-item ke normalisasi alias supaya
        // kana/yomi/furigana/hiragana di-collapse ke `reading`, dan
        // exampleFurigana/exampleKana di-collapse ke `exampleReading`.
        // Tanpa ini, bulk endpoint kehilangan furigana saat provider
        // membalas dengan key alternatif.
        const norm = normalizeAiKotobaResult(
          it as unknown as Record<string, unknown>,
        );
        const merged: BulkKotobaItem = {
          ...it,
          jp: norm.jp || it.jp,
          reading: norm.reading || it.reading,
          romaji: norm.romaji || it.romaji,
          meaning: norm.meaning || it.meaning,
          type: norm.type || it.type,
          level: norm.level || it.level,
          beginnerExample: norm.beginnerExample || it.beginnerExample,
          normalExample: norm.normalExample || it.normalExample,
          exampleReading: norm.exampleReading || it.exampleReading,
          exampleMeaning: norm.exampleMeaning || it.exampleMeaning,
        };

        const isExisting = existingNorm.has(normalize(merged.jp));
        // Mark items as "manual" (Perlu dicek) when AI returned a
        // sentence example but no Indonesian translation — user must
        // fill it before bulk save (PRD PART 10).
        const incompleteMeaning = hasIncompleteExampleMeaning({
          meaning: merged.meaning ?? "",
          normalExample: merged.normalExample ?? merged.beginnerExample ?? "",
          exampleMeaning: merged.exampleMeaning ?? "",
        });

        let status: BulkKotobaItem["status"];
        if (isExisting) status = "exists";
        else if (incompleteMeaning) status = "manual";
        else status = it.status ?? "new";

        return {
          ...emptyItem(merged.jp),
          ...merged,
          // Carry the normalized fields the bulk type doesn't model so
          // itemToPayload can save them.
          normalExample: norm.normalExample,
          furiganaExample: norm.furiganaExample,
          exampleMeaning: norm.exampleMeaning,
          status,
          // Default-select only complete "new" items. Existing duplicates
          // and items needing manual review stay un-selected by default.
          selected: status === "new",
        };
      });
      setItems(list);
      notify.success(
        "Analisa selesai",
        `${list.length} kotoba siap untuk kamu periksa.`,
        { icon: "✨" },
      );
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memanggil AI";
      setError(msg);
      notify.apiError(e);
    }
  };

  const counts = useMemo(() => {
    if (!items)
      return { newItems: 0, exists: 0, manual: 0, selected: 0, total: 0 };
    return {
      newItems: items.filter((i) => i.status === "new").length,
      exists: items.filter((i) => i.status === "exists").length,
      manual: items.filter((i) => i.status === "manual").length,
      selected: items.filter((i) => i.selected).length,
      total: items.length,
    };
  }, [items]);

  const onConfirmSave = async () => {
    if (!items) return;
    setSaving(true);
    try {
      const payloads = items
        .filter((i) => i.selected)
        .map((i) => itemToPayload(i));
      await onSaveAll(payloads);
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (bulk.isPending) {
    return (
      <AiLoading
        title={`AI sedang menganalisa daftar…`}
        description={`Mengecek ${parsed.length} kotoba yang kamu masukkan.`}
      />
    );
  }

  if (saving) {
    return <LoadingState label="Menyimpan kotoba ke catatan…" />;
  }

  // ----------------------------- input phase
  if (!items) {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
            Masukkan banyak kotoba
          </label>
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"berat\n重い\nmakanan manis\n生い物\nkadang-kadang\n時々"}
            className="block w-full resize-y rounded-xl border border-paper-200 bg-white px-3 py-2 font-mono text-sm text-ink-800 placeholder:text-ink-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <p className="text-ink-400">
              Boleh Bahasa Jepang atau Indonesia. Satu baris satu kotoba. Maksimal {MAX_ITEMS} kotoba per analisa.
            </p>
            <span
              className={cn(
                "font-medium",
                overLimit ? "text-rose-600 dark:text-rose-400" : "text-ink-400",
              )}
            >
              {parsed.length} / {MAX_ITEMS} kotoba
            </span>
          </div>
        </div>
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-700/10 dark:text-rose-200">
            {error}
          </div>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={parsed.length === 0 || overLimit}
            onClick={onAnalyze}
          >
            {parsed.length > 0
              ? `Analisa ${parsed.length} Kotoba`
              : "Analisa dengan AI"}
          </Button>
        </div>
      </div>
    );
  }

  // ----------------------------- preview phase
  if (confirmOpen) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-paper-200 bg-paper-50/60 p-4 dark:border-ink-700 dark:bg-ink-900/30">
          <p className="text-sm text-ink-700 dark:text-paper-50">
            AI menemukan{" "}
            <span className="font-semibold">{counts.selected}</span> kotoba siap
            disimpan.{" "}
            {counts.exists > 0
              ? `${counts.exists} duplikat akan dilewati.`
              : ""}{" "}
            {counts.manual > 0 ? `${counts.manual} perlu edit manual.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmOpen(false)}
          >
            Kembali
          </Button>
          <Button type="button" onClick={onConfirmSave}>
            Simpan {counts.selected} kotoba
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
        <Badge tone="leaf">Baru: {counts.newItems}</Badge>
        <Badge tone="warn">Sudah ada: {counts.exists}</Badge>
        <Badge tone="neutral">Manual: {counts.manual}</Badge>
        <span className="ml-auto">{counts.total} item</span>
      </div>

      <ul className="-mx-1 max-h-[55vh] space-y-2 overflow-y-auto px-1">
        {items.map((it, idx) => (
          <li
            key={`${it.jp}-${idx}`}
            className={cn(
              "rounded-xl border p-3 transition-colors",
              it.status === "exists"
                ? "border-amber-200 bg-amber-50/70 dark:border-amber-700/40 dark:bg-amber-700/10"
                : it.status === "manual"
                ? "border-paper-200 bg-paper-50/60 dark:border-ink-700 dark:bg-ink-900/30"
                : "border-paper-200 bg-white dark:border-ink-700 dark:bg-ink-800",
            )}
          >
            <div className="flex flex-wrap items-start gap-3">
              <input
                type="checkbox"
                aria-label={`Pilih ${it.jp}`}
                checked={it.selected}
                disabled={it.status === "exists"}
                onChange={(e) =>
                  setItems((prev) =>
                    prev
                      ? prev.map((p, i) =>
                          i === idx
                            ? { ...p, selected: e.target.checked }
                            : p,
                        )
                      : prev,
                  )
                }
                className="mt-1 h-4 w-4 accent-accent-500"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      it.status === "exists"
                        ? "warn"
                        : it.status === "manual"
                        ? "neutral"
                        : "leaf"
                    }
                  >
                    {it.status === "exists"
                      ? "Sudah ada"
                      : it.status === "manual"
                      ? "Perlu cek manual"
                      : "Baru"}
                  </Badge>
                  {it.level ? <Badge tone="accent">{it.level}</Badge> : null}
                </div>
                <div className="mt-1 text-base font-semibold text-ink-800 dark:text-paper-50">
                  <JapaneseText
                    text={it.jp}
                    reading={it.reading || undefined}
                    inert
                  />
                </div>
                <div className="text-sm text-ink-700 dark:text-paper-50">
                  {it.meaning ?? (
                    <span className="italic text-ink-400">— belum ada arti —</span>
                  )}
                </div>
                {it.sourceInput && it.sourceInput !== it.jp ? (
                  <div className="mt-1 text-[11px] text-ink-400">
                    Input:{" "}
                    <span className="text-ink-500 dark:text-ink-50/70">
                      {it.sourceInput}
                    </span>
                    {it.inputLanguage && it.inputLanguage !== "unknown" ? (
                      <span className="ml-1">({it.inputLanguage})</span>
                    ) : null}
                  </div>
                ) : null}
                {it.romaji ? (
                  <div className="text-xs text-ink-400">{it.romaji}</div>
                ) : null}
                {it.beginnerExample ? (
                  <div className="mt-1 text-xs text-ink-400">
                    Contoh:{" "}
                    <JapaneseText
                      text={it.beginnerExample}
                      reading={it.exampleReading || undefined}
                      inert
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={() => setItems(null)}>
          Reset
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="button"
          disabled={counts.selected === 0}
          onClick={() => setConfirmOpen(true)}
        >
          Simpan {counts.selected} kotoba
        </Button>
      </div>
    </div>
  );
}

interface EditableItem extends BulkKotobaItem {
  selected: boolean;
  /** Field tambahan dari normalisasi (tidak ada di BulkKotobaItem). */
  normalExample?: string;
  furiganaExample?: string;
  exampleMeaning?: string;
}

function emptyItem(jp: string): EditableItem {
  return {
    jp,
    status: "new",
    selected: true,
  };
}

function parseInput(text: string): string[] {
  return text
    .split(/\r?\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalize(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

function itemToPayload(it: EditableItem): KotobaWritePayload {
  const lv = String(it.level || "").toUpperCase();
  const safeLevel: JlptLevel | undefined =
    lv === "N5" || lv === "N4" || lv === "N3" || lv === "N2" || lv === "N1"
      ? (lv as JlptLevel)
      : undefined;
  // Pastikan furigana lengkap ikut tersimpan ke DB. Tanpa ini, accordion
  // detail di Catatan dan baris contoh di Hafalan render kanji tanpa
  // furigana karena `normalExample`/`furiganaExample` selalu null.
  const beginnerExample = it.beginnerExample?.trim() || undefined;
  const normalExample = it.normalExample?.trim() || beginnerExample;
  const furiganaExample = it.furiganaExample?.trim() || undefined;
  return {
    jp: it.jp.trim(),
    reading: it.reading?.trim() || undefined,
    romaji: it.romaji?.trim() || undefined,
    meaning: (it.meaning ?? "").trim() || it.jp,
    type: it.type?.trim() || undefined,
    level: safeLevel,
    beginnerExample,
    normalExample,
    furiganaExample,
    exampleReading: it.exampleReading?.trim() || undefined,
    exampleMeaning: it.exampleMeaning?.trim() || undefined,
    mastery: "mid",
  };
}
