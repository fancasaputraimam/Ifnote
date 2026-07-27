"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { AiLoading } from "@/components/ui/ai-loading";
import { useAnalyzeSentence, useBulkKotobaAi } from "@/features/ai/useAi";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/toast";
import {
  hasIncompleteExampleMeaning,
  normalizeAiKotobaResult,
} from "@/lib/ai-normalize";
import { cleanJapaneseResponse } from "@/lib/japanese-text";
import { cn, looksLikeJaSentence, normalizeJaKey } from "@/lib/utils";
import type { BulkKotobaItem } from "@/features/ai/types";
import type { JlptLevel, Mastery } from "@/lib/types";
import type { KotobaWritePayload } from "@/features/catatan/useCatatan";

const MAX_ITEMS = 50;

interface Props {
  /**
   * Save handler — parent calls POST /api/kotoba per item, invalidates
   * queries afterwards. Returns when all saves are settled. onProgress
   * dipanggil setiap satu item berhasil tersimpan.
   */
  onSaveAll: (
    payloads: KotobaWritePayload[],
    onProgress?: (saved: number, total: number) => void,
  ) => Promise<void>;
  onCancel: () => void;
  /** Existing kotoba JP strings used for additional client-side dedup. */
  existingJp: string[];
  /** Kotoba tersimpan (jp + id) untuk tombol "Buka yang tersimpan". */
  existingItems?: { jp: string; id: string }[];
  /** Buka entri tersimpan dalam mode edit (dipakai untuk duplikat). */
  onOpenSaved?: (id: string) => void;
}

export function KotobaBulkAi({
  onSaveAll,
  onCancel,
  existingJp,
  existingItems = [],
  onOpenSaved,
}: Props) {
  const bulk = useBulkKotobaAi();
  const sentenceAi = useAnalyzeSentence();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ saved: 0, total: 0 });
  /** Tags opsional yang dipasang ke SEMUA item yang disimpan. */
  const [globalTags, setGlobalTags] = useState("");
  /** Default untuk item tanpa level dari AI / mastery pilihan user. */
  const [globalLevel, setGlobalLevel] = useState<"" | JlptLevel>("");
  const [globalMastery, setGlobalMastery] = useState<Mastery>("mid");

  // Klasifikasi otomatis: baris yang terlihat seperti kalimat Jepang
  // diproses lewat analisa kalimat (ekstrak kotoba); sisanya dianggap
  // daftar kata / pasangan "kata = arti". Tanpa toggle manual.
  const parsed = useMemo(() => parseInput(text), [text]);
  const overLimit = parsed.words.length > MAX_ITEMS;

  /**
   * Susun EditableItem[] dari respons bulk AI. `hints` = arti dari user
   * (sintaks "食べます = makan" atau hasil ekstraksi kalimat) yang
   * mengalahkan arti tebakan AI.
   */
  const buildItems = (rawItems: BulkKotobaItem[], hints: Map<string, string>) => {
    // Re-check duplicates against current catatan list (defense in depth).
    const existingNorm = new Set(existingJp.map(normalize));
    const existingIdByJp = new Map(existingItems.map((x) => [normalize(x.jp), x.id]));
    return (rawItems ?? []).map((it) => {
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
          meaning:
            hints.get(normalize(it.sourceInput ?? "")) ??
            hints.get(normalize(norm.jp || it.jp)) ??
            (norm.meaning || it.meaning),
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
          existingId:
            merged.existingId ?? existingIdByJp.get(normalize(merged.jp)) ?? null,
          // Carry the normalized fields the bulk type doesn't model so
          // itemToPayload can save them. Per-example reading/meaning
          // dikirim terpisah supaya tidak saling tertukar (spec PART 3).
          normalExample: norm.normalExample,
          furiganaExample: norm.furiganaExample,
          exampleMeaning: norm.exampleMeaning,
          beginnerExampleReading: norm.beginnerExampleReading,
          beginnerExampleMeaning: norm.beginnerExampleMeaning,
          normalExampleReading: norm.normalExampleReading,
          normalExampleMeaning: norm.normalExampleMeaning,
          status,
          // Default-select only complete "new" items. Existing duplicates
          // and items needing manual review stay un-selected by default.
          selected: status === "new",
        };
      });
  };

  const finishAnalyze = (list: EditableItem[]) => {
    setItems(list);
    notify.success(
      "Analisa selesai",
      `${list.length} kotoba siap untuk kamu periksa.`,
      { icon: "✨" },
    );
  };

  /**
   * Analisa gabungan (otomatis, tanpa toggle):
   *  - baris kata / pasangan "kata = arti" → langsung ke pipeline bulk;
   *  - baris kalimat → analyze-sentence dulu, kotoba hasil ekstraksi
   *    (plus artinya sebagai hint konteks) ikut digabung ke bulk.
   */
  const onAnalyze = async () => {
    const { words, sentences } = parsed;
    if (words.length === 0 && sentences.length === 0) return;
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
      const hints = new Map(
        words
          .filter((p) => p.hint)
          .map((p) => [normalize(p.word), p.hint as string]),
      );
      const allWords = words.map((p) => p.word);

      // AI kadang menulis "音楽（おんがく）" — buang reading dalam kurung
      // supaya kata yang dikirim ke pipeline bulk bersih.
      const stripParen = (s: string) => s.replace(/[（(].*?[）)]/g, "").trim();
      for (const sentence of sentences) {
        const r = await sentenceAi.mutateAsync({ sentence });
        for (const k of r.data?.kotobaFound ?? []) {
          const jp = stripParen(k.jp);
          if (!jp) continue;
          if (allWords.some((w) => normalize(w) === normalize(jp))) continue;
          allWords.push(jp);
          if (k.meaning?.trim() && !hints.has(normalize(jp))) {
            hints.set(normalize(jp), k.meaning.trim());
          }
        }
      }

      if (allWords.length === 0) {
        setError("AI tidak menemukan kotoba di kalimat itu. Coba kalimat lain.");
        return;
      }
      const rb = await bulk.mutateAsync({ words: allWords.slice(0, MAX_ITEMS) });
      const cleaned = cleanJapaneseResponse(rb.data, {
        preserveRuby: false,
      }) as { items: BulkKotobaItem[] };
      finishAnalyze(buildItems(cleaned.items ?? [], hints));
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

  /** Perbarui satu item + hitung ulang statusnya (manual ⇄ new). */
  const patchItem = (idx: number, patch: Partial<EditableItem>) => {
    setItems((prev) =>
      prev
        ? prev.map((p, i) => {
            if (i !== idx) return p;
            const next = { ...p, ...patch };
            if (next.status !== "exists") {
              const incomplete = hasIncompleteExampleMeaning({
                meaning: next.meaning ?? "",
                normalExample: next.normalExample ?? next.beginnerExample ?? "",
                exampleMeaning: next.exampleMeaning ?? "",
              });
              const newStatus: BulkKotobaItem["status"] = incomplete ? "manual" : "new";
              // Naik dari manual → new: otomatis centang, karena user baru
              // saja melengkapinya.
              if (p.status === "manual" && newStatus === "new") next.selected = true;
              next.status = newStatus;
            }
            return next;
          })
        : prev,
    );
  };

  const onConfirmSave = async () => {
    if (!items) return;
    const tags = parseTags(globalTags);
    const defaults = { level: globalLevel || undefined, mastery: globalMastery };
    const payloads = items
      .filter((i) => i.selected)
      .map((i) => itemToPayload(i, tags, defaults));
    setSaving(true);
    setSaveProgress({ saved: 0, total: payloads.length });
    try {
      await onSaveAll(payloads, (saved, total) => setSaveProgress({ saved, total }));
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (sentenceAi.isPending) {
    return (
      <AiLoading
        title="AI sedang membaca kalimatmu…"
        description="Mengambil kotoba dari dalam kalimat."
      />
    );
  }

  if (bulk.isPending) {
    return (
      <AiLoading
        title="AI sedang menganalisa daftar…"
        description="Melengkapi reading, arti, contoh, dan level tiap kotoba."
      />
    );
  }

  if (saving) {
    const pct =
      saveProgress.total > 0
        ? Math.round((saveProgress.saved / saveProgress.total) * 100)
        : 0;
    return (
      <div className="space-y-3 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-700 dark:text-paper-50">Menyimpan kotoba ke Catatan…</span>
          <span className="font-medium tabular-nums text-ink-400">
            {saveProgress.saved}/{saveProgress.total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-paper-100 dark:bg-ink-900/60">
          <div
            className="h-full rounded-full bg-accent-gradient transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-ink-400">
          Disimpan berurutan supaya urutan Hafalan tetap rapi — jangan tutup dialog ini.
        </p>
      </div>
    );
  }

  // ----------------------------- input phase
  if (!items) {
    const canAnalyze =
      (parsed.words.length > 0 || parsed.sentences.length > 0) && !overLimit;
    return (
      <div className="space-y-4">
        {/* strip panduan — kertas washi dengan garis margin merah */}
        <div className="relative overflow-hidden rounded-xl border border-paper-200 bg-paper-50/70 py-2.5 pl-4 pr-3 dark:border-ink-700 dark:bg-ink-900/30">
          <span aria-hidden className="absolute inset-y-2 left-2 w-px bg-accent-500/25" />
          <p className="text-xs leading-relaxed text-ink-400">
            Tulis <span className="font-medium text-ink-700 dark:text-paper-100">satu kotoba per baris</span> (boleh{" "}
            <code className="rounded bg-paper-100 px-1 dark:bg-ink-700">kata = arti</code>)
            — atau langsung <span className="font-medium text-ink-700 dark:text-paper-100">kalimat Jepang utuh</span>:
            AI otomatis mengambil kotoba dari dalam kalimatnya.
          </p>
        </div>

        <div>
          <Textarea
            label="Kotoba, arti, atau kalimat"
            rows={6}
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canAnalyze) {
                e.preventDefault();
                void onAnalyze();
              }
            }}
            placeholder={"食べます = makan\n甘い物\n私は毎朝コーヒーを飲みながら新聞を読みます。"}
            className="font-jp"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink-400/80">
              Tekan <kbd className="rounded bg-paper-100 px-1 dark:bg-ink-700">Ctrl</kbd>+
              <kbd className="rounded bg-paper-100 px-1 dark:bg-ink-700">Enter</kbd> untuk analisa
            </span>
            {parsed.words.length > 0 || parsed.sentences.length > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                  overLimit
                    ? "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30"
                    : parsed.sentences.length > 0
                      ? "bg-accent-50 text-accent-600 ring-accent-200 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30"
                      : "bg-paper-100 text-ink-400 ring-paper-200 dark:bg-ink-800 dark:ring-ink-700",
                )}
              >
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                {parsed.words.length > 0 ? `${parsed.words.length} kata` : null}
                {parsed.words.length > 0 && parsed.sentences.length > 0 ? " · " : null}
                {parsed.sentences.length > 0
                  ? `${parsed.sentences.length} kalimat terdeteksi`
                  : null}
              </span>
            ) : null}
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

  // ----------------------------- preview phase
  if (confirmOpen) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-notebook border border-paper-200 bg-paper-50/60 p-4 pl-5 dark:border-ink-700 dark:bg-ink-900/30">
          <span aria-hidden className="absolute inset-y-3 left-2.5 w-px bg-accent-500/25" />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-2 -top-4 select-none font-jp text-6xl leading-none text-ink-800/[0.04] dark:text-paper-50/[0.04]"
          >
            済
          </span>
          <p className="relative text-sm text-ink-700 dark:text-paper-50">
            <span className="font-serif text-lg font-semibold text-accent-700 dark:text-accent-200">
              {counts.selected}
            </span>{" "}
            kotoba siap dicap masuk ke Catatan.
          </p>
          <div className="relative mt-2 flex flex-wrap gap-1.5 text-xs">
            {counts.exists > 0 ? (
              <Badge tone="warn">{counts.exists} duplikat dilewati</Badge>
            ) : null}
            {counts.manual > 0 ? (
              <Badge tone="neutral">{counts.manual} perlu edit manual</Badge>
            ) : null}
          </div>
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
              "rounded-xl border border-l-[3px] p-3 transition-colors",
              it.status === "exists"
                ? "border-amber-200 border-l-amber-400 bg-amber-50/70 dark:border-amber-700/40 dark:border-l-amber-500 dark:bg-amber-700/10"
                : it.status === "manual"
                ? "border-paper-200 border-l-ink-300 bg-paper-50/60 dark:border-ink-700 dark:border-l-ink-500 dark:bg-ink-900/30"
                : "border-paper-200 border-l-leaf-500 bg-white dark:border-ink-700 dark:border-l-leaf-600 dark:bg-ink-800",
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
                    kanaText={it.reading || undefined}
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
                      reading={it.beginnerExampleReading || undefined}
                      kanaText={it.beginnerExampleReading || undefined}
                      sentenceMode
                      inert
                    />
                  </div>
                ) : null}

                {/* aksi per item: edit inline / buka entri tersimpan */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {it.status === "exists" && onOpenSaved && it.existingId ? (
                    <button
                      type="button"
                      onClick={() => onOpenSaved(it.existingId as string)}
                      className="text-xs font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300"
                    >
                      Buka yang tersimpan →
                    </button>
                  ) : it.status !== "exists" ? (
                    <button
                      type="button"
                      aria-expanded={!!it.expanded}
                      onClick={() => patchItem(idx, { expanded: !it.expanded })}
                      className="text-xs font-medium text-ink-400 underline-offset-4 hover:text-accent-600 hover:underline dark:hover:text-accent-300"
                    >
                      {it.expanded ? "Tutup edit" : "✎ Edit"}
                    </button>
                  ) : null}
                  {it.status === "manual" ? (
                    <span className="text-[11px] italic text-ink-400">
                      lengkapi arti contohnya supaya siap disimpan
                    </span>
                  ) : null}
                </div>

                {it.expanded && it.status !== "exists" ? (
                  <div className="mt-3 space-y-2.5 rounded-xl border border-paper-200 bg-paper-50/60 p-3 dark:border-ink-700 dark:bg-ink-900/30">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <TextInput
                        label="Arti"
                        value={it.meaning ?? ""}
                        onChange={(e) => patchItem(idx, { meaning: e.currentTarget.value })}
                        placeholder="arti bahasa Indonesia"
                      />
                      <TextInput
                        label="Pembacaan (kana)"
                        value={it.reading ?? ""}
                        onChange={(e) => patchItem(idx, { reading: e.currentTarget.value })}
                        placeholder="たべます"
                      />
                    </div>
                    {it.beginnerExample || it.normalExample ? (
                      <TextInput
                        label="Arti contoh kalimat"
                        value={it.exampleMeaning ?? ""}
                        onChange={(e) =>
                          patchItem(idx, {
                            exampleMeaning: e.currentTarget.value,
                            normalExampleMeaning: e.currentTarget.value,
                          })
                        }
                        placeholder="terjemahan contoh kalimatnya"
                      />
                    ) : null}
                    <div className="grid grid-cols-2 gap-2.5">
                      <Select
                        label="Level JLPT"
                        value={(it.level as string) ?? ""}
                        onChange={(e) => patchItem(idx, { level: e.currentTarget.value })}
                      >
                        <option value="">— Tidak ditentukan —</option>
                        <option value="N5">N5</option>
                        <option value="N4">N4</option>
                        <option value="N3">N3</option>
                        <option value="N2">N2</option>
                        <option value="N1">N1</option>
                      </Select>
                      <Select
                        label="Mastery"
                        value={it.mastery ?? "mid"}
                        onChange={(e) =>
                          patchItem(idx, { mastery: e.currentTarget.value as Mastery })
                        }
                      >
                        <option value="good">good</option>
                        <option value="mid">mid</option>
                        <option value="weak">weak</option>
                      </Select>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* default untuk semua item yang disimpan */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <TextInput
          label="Tags untuk semua (opsional)"
          value={globalTags}
          onChange={(e) => setGlobalTags(e.currentTarget.value)}
          placeholder="makanan, bab-3"
        />
        <Select
          label="Level default"
          value={globalLevel}
          onChange={(e) => setGlobalLevel(e.currentTarget.value as "" | JlptLevel)}
        >
          <option value="">Otomatis (dari AI)</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
          <option value="N2">N2</option>
          <option value="N1">N1</option>
        </Select>
        <Select
          label="Mastery default"
          value={globalMastery}
          onChange={(e) => setGlobalMastery(e.currentTarget.value as Mastery)}
        >
          <option value="good">good</option>
          <option value="mid">mid</option>
          <option value="weak">weak</option>
        </Select>
      </div>

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
  /** Editor inline sedang terbuka. */
  expanded?: boolean;
  /** Mastery pilihan user (default "mid"). */
  mastery?: Mastery;
  /** Field tambahan dari normalisasi (tidak ada di BulkKotobaItem). */
  normalExample?: string;
  furiganaExample?: string;
  exampleMeaning?: string;
  beginnerExampleReading?: string;
  beginnerExampleMeaning?: string;
  normalExampleReading?: string;
  normalExampleMeaning?: string;
}

function emptyItem(jp: string): EditableItem {
  return {
    jp,
    status: "new",
    selected: true,
  };
}

interface ParsedWord {
  word: string;
  /** Arti dari user (sintaks "kata = arti") — mengalahkan tebakan AI. */
  hint?: string;
}

interface ParsedInput {
  words: ParsedWord[];
  /** Baris yang terdeteksi sebagai kalimat Jepang (maks 3 per analisa). */
  sentences: string[];
}

/**
 * Parse input — klasifikasi otomatis per baris:
 *  - baris yang terlihat seperti KALIMAT Jepang → dianalisa utuh
 *    (AI mengekstrak kotoba dari dalamnya), koma di kalimat aman;
 *  - baris berformat "kata = arti" jadi SATU item dengan hint arti;
 *  - baris lain boleh berisi beberapa kata dipisah koma.
 */
function parseInput(text: string): ParsedInput {
  const words: ParsedWord[] = [];
  const sentences: string[] = [];
  for (const rawLine of text.split(/\r?\n|;/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (looksLikeJaSentence(line)) {
      if (sentences.length < 3) sentences.push(line);
      continue;
    }
    const eq = line.split(/=|＝/);
    if (eq.length >= 2 && eq[0].trim()) {
      words.push({
        word: eq[0].trim(),
        hint: eq.slice(1).join("=").trim() || undefined,
      });
      continue;
    }
    for (const w of line.split(/,|、/)) {
      const t = w.trim();
      if (t) words.push({ word: t });
    }
  }
  return { words, sentences };
}

const normalize = normalizeJaKey;

function parseTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function itemToPayload(
  it: EditableItem,
  tags?: string[],
  defaults?: { level?: JlptLevel; mastery?: Mastery },
): KotobaWritePayload {
  const lv = String(it.level || "").toUpperCase();
  const safeLevel: JlptLevel | undefined =
    lv === "N5" || lv === "N4" || lv === "N3" || lv === "N2" || lv === "N1"
      ? (lv as JlptLevel)
      : defaults?.level;
  // Pastikan furigana lengkap ikut tersimpan ke DB. Tanpa ini, accordion
  // detail di Catatan dan baris contoh di Hafalan render kanji tanpa
  // furigana karena `normalExample`/`furiganaExample` selalu null.
  const beginnerExample = it.beginnerExample?.trim() || undefined;
  const normalExample = it.normalExample?.trim() || beginnerExample;
  const furiganaExample = it.furiganaExample?.trim() || undefined;
  // Per-example reading/meaning. beginnerExampleReading TIDAK boleh
  // fallback ke shared exampleReading (itu reading kalimat normal).
  const beginnerExampleReading = it.beginnerExampleReading?.trim() || undefined;
  const beginnerExampleMeaning = it.beginnerExampleMeaning?.trim() || undefined;
  const normalExampleReading =
    it.normalExampleReading?.trim() || it.exampleReading?.trim() || undefined;
  const normalExampleMeaning =
    it.normalExampleMeaning?.trim() || it.exampleMeaning?.trim() || undefined;
  return {
    jp: it.jp.trim(),
    reading: it.reading?.trim() || undefined,
    romaji: it.romaji?.trim() || undefined,
    meaning: (it.meaning ?? "").trim() || it.jp,
    type: it.type?.trim() || undefined,
    level: safeLevel,
    beginnerExample,
    beginnerExampleReading,
    beginnerExampleMeaning,
    normalExample,
    normalExampleReading,
    normalExampleMeaning,
    furiganaExample,
    // Shared alias = reading/meaning kalimat normal (backward compat).
    exampleReading: normalExampleReading,
    exampleMeaning: normalExampleMeaning,
    tags: tags && tags.length ? tags : undefined,
    mastery: it.mastery ?? defaults?.mastery ?? "mid",
  };
}
