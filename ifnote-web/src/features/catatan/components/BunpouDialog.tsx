"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CatatanDialogHeader } from "./CatatanDialogHeader";
import { CreateModeTabs } from "./CreateModeTabs";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { normalizeJaKey } from "@/lib/utils";
import { normalizeAiBunpouResult } from "@/lib/ai-normalize";
import { useExplainBunpou } from "@/features/ai/useAi";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { api } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { Bunpou, CatatanList, Mastery } from "@/lib/types";
import {
  BunpouWritePayload,
  useCreateBunpou,
  useUpdateBunpou,
} from "@/features/catatan/useCatatan";
import { BunpouAiAnalyze } from "./BunpouAiAnalyze";

const schema = z.object({
  pattern: z.string().trim().min(1, "Pola wajib").max(120),
  reading: z.string().trim().max(120).optional().or(z.literal("")),
  meaning: z.string().trim().min(1, "Arti wajib").max(280),
  formula: z.string().trim().max(280).optional().or(z.literal("")),
  usage: z.string().trim().max(500).optional().or(z.literal("")),
  level: z.enum(["", "N5", "N4", "N3", "N2", "N1"]).optional(),
  tags: z.string().trim().max(200).optional(),
  beginnerExample: z.string().trim().max(500).optional().or(z.literal("")),
  normalExample: z.string().trim().max(500).optional().or(z.literal("")),
  furiganaExample: z.string().trim().max(500).optional().or(z.literal("")),
  exampleReading: z.string().trim().max(500).optional().or(z.literal("")),
  exampleMeaning: z.string().trim().max(500).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  commonMistake: z.string().trim().max(500).optional().or(z.literal("")),
  mastery: z.enum(["good", "mid", "weak"]),
});

type FormValues = z.infer<typeof schema>;

/**
 * Create mode: tab "Dengan AI" (analisa pola, default) atau "Isi manual".
 * Edit mode: langsung form manual.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Bunpou | null;
  /** Existing patterns sudah disimpan, untuk AI dedup. */
  existingPatterns?: string[];
  /** Bunpou tersimpan (pattern + id) — untuk tombol "Buka entri yang ada". */
  existingItems?: { pattern: string; id: string }[];
  /**
   * Buka bunpou yang sudah tersimpan dalam mode edit (dipakai ketika
   * analisa AI menemukan pola duplikat di Catatan).
   */
  onOpenSaved?: (id: string) => void;
}

export function BunpouDialog({
  open,
  onClose,
  initial,
  existingPatterns = [],
  existingItems = [],
  onOpenSaved,
}: Props) {
  const isEdit = !!initial;
  const create = useCreateBunpou();
  const update = useUpdateBunpou();
  // Mode create: "Dengan AI" (default) atau "Isi manual" (fallback saat
  // AI belum dikonfigurasi).
  const [manualMode, setManualMode] = useState(false);
  // Progressive disclosure: field opsional dilipat, kecuali di mode edit.
  const [showDetails, setShowDetails] = useState(false);
  // "Lengkapi dengan AI" di dalam form manual — mengisi field yang kosong.
  const aiFill = useExplainBunpou();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm(),
  });

  useEffect(() => {
    if (open) {
      form.reset(initial ? toForm(initial) : emptyForm());
      setManualMode(false);
      setShowDetails(!!initial);
    }
  }, [open, initial, form]);

  const saveValues = async (values: FormValues, keepOpen: boolean) => {
    const payload = toPayload(values);
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, payload });
        notify.success("Bunpou diperbarui", "Perubahan sudah disimpan.", { icon: "🌸" });
        onClose();
      } else {
        await create.mutateAsync(payload);
        notify.success(
          "Bunpou disimpan",
          keepOpen ? "Lanjut — tulis pola berikutnya." : "Pola bunpou berhasil ditambahkan.",
          { icon: "📚" },
        );
        if (keepOpen) {
          form.reset(emptyForm());
          setShowDetails(false);
        } else {
          onClose();
        }
      }
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menyimpan bunpou",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  const onSubmit = form.handleSubmit((v) => saveValues(v, false));
  const onSubmitNext = form.handleSubmit((v) => saveValues(v, true));

  const submitting = create.isPending || update.isPending;

  // Peringatan duplikat live (create + manual saja). Dua lapis: daftar
  // termuat (instan) + pencarian server (debounced) untuk koleksi besar.
  const patternValue = form.watch("pattern");
  const debouncedPattern = useDebouncedValue((patternValue ?? "").trim(), 350);
  const serverDupQ = useQuery<CatatanList>({
    queryKey: ["catatan", "dup", "bunpou", normalizeJaKey(debouncedPattern)],
    queryFn: () =>
      api.get<CatatanList>("/api/catatan", {
        query: { search: debouncedPattern, type: "bunpou", page: 1, limit: 5 },
      }),
    enabled: open && !isEdit && manualMode && debouncedPattern.length > 0,
    retry: 0,
    staleTime: 30_000,
  });
  const dup = useMemo(() => {
    if (isEdit) return null;
    const key = normalizeJaKey(patternValue ?? "");
    if (!key) return null;
    const local = existingPatterns.some((p) => normalizeJaKey(p) === key)
      ? existingItems.find((x) => normalizeJaKey(x.pattern) === key) ?? null
      : null;
    if (local) return local;
    const remote = serverDupQ.data?.items.find(
      (i) => i.noteType === "bunpou" && normalizeJaKey(i.jpOrPattern) === key,
    );
    return remote ? { pattern: remote.jpOrPattern, id: remote.id } : null;
  }, [isEdit, patternValue, existingPatterns, existingItems, serverDupQ.data]);

  /** Isi field yang masih kosong dari hasil AI (tidak menimpa input user). */
  const onAiFill = async () => {
    const pattern = form.getValues("pattern").trim();
    if (!pattern) return;
    try {
      const r = await aiFill.mutateAsync({ pattern });
      const n = normalizeAiBunpouResult(r.data as unknown as Record<string, unknown>);
      const fillIfEmpty = (field: keyof FormValues, val?: string | null) => {
        if (!val) return;
        const cur = String(form.getValues(field) ?? "");
        if (!cur.trim()) form.setValue(field, val as never, { shouldDirty: true });
      };
      fillIfEmpty("reading", n.reading);
      fillIfEmpty("meaning", n.meaning);
      fillIfEmpty("formula", n.formula);
      fillIfEmpty("usage", n.usage);
      const lv = String(n.level ?? "").toUpperCase();
      if (["N5", "N4", "N3", "N2", "N1"].includes(lv)) fillIfEmpty("level", lv);
      fillIfEmpty("normalExample", n.normalExample || n.beginnerExample);
      fillIfEmpty("exampleReading", n.exampleReading);
      fillIfEmpty("exampleMeaning", n.exampleMeaning);
      fillIfEmpty("note", n.note);
      fillIfEmpty("commonMistake", n.commonMistake);
      setShowDetails(true);
      notify.success("Terisi oleh AI", "Periksa hasilnya, lalu simpan.", { icon: "✨" });
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal melengkapi dengan AI",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  /**
   * AI flow — in create mode, save directly to Catatan after AI preview.
   * Manual form is intentionally NOT rendered for new items (per spec):
   * the AI panel itself already lets the user review/edit fields before
   * clicking "Simpan ke Catatan". In edit mode this callback is unused
   * because the AI tab is hidden.
   */
  const onAiApply = async (
    payload: BunpouWritePayload,
    opts?: { keepOpen?: boolean },
  ): Promise<boolean> => {
    try {
      await create.mutateAsync(payload);
      notify.success(
        "Bunpou disimpan",
        `\u300C${payload.pattern}\u300D berhasil ditambahkan.`,
        { icon: "\uD83C\uDF38" },
      );
      // keepOpen = antrian multi-pola / daftar dari kalimat masih jalan.
      if (!opts?.keepOpen) onClose();
      return true;
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menyimpan bunpou",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
      // false \u2192 panel AI tidak lanjut ke pola berikutnya.
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl">
      <CatatanDialogHeader type="bunpou" mode={initial ? "edit" : "add"} />

      {/* Mode create: pilih Dengan AI atau Isi manual. Edit mode langsung
          form manual. */}
      {!isEdit ? <CreateModeTabs manual={manualMode} onChange={setManualMode} /> : null}

      {isEdit || manualMode ? (
        <form className="space-y-3" onSubmit={onSubmit} noValidate>
          {/* --- field wajib --- */}
          <TextInput
            label="Pola"
            autoFocus
            {...form.register("pattern")}
            error={form.formState.errors.pattern?.message}
            placeholder="〜ながら"
          />

          {dup ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-700/10 dark:text-amber-200">
              <span className="min-w-0 flex-1">
                Pola ini sudah ada di Catatan — simpan lagi akan membuat duplikat.
              </span>
              {onOpenSaved ? (
                <button
                  type="button"
                  onClick={() => onOpenSaved(dup.id)}
                  className="shrink-0 font-semibold underline-offset-4 hover:underline"
                >
                  Buka yang tersimpan →
                </button>
              ) : null}
            </div>
          ) : null}

          <TextInput
            label="Arti"
            {...form.register("meaning")}
            error={form.formState.errors.meaning?.message}
            placeholder="sambil"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select label="Level JLPT" {...form.register("level")}>
              <option value="">— Tidak ditentukan —</option>
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </Select>
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full gap-1.5"
                loading={aiFill.isPending}
                disabled={!patternValue?.trim()}
                onClick={onAiFill}
              >
                <span aria-hidden>✨</span> Lengkapi dengan AI
              </Button>
            </div>
          </div>

          {/* --- detail opsional (dilipat) --- */}
          <button
            type="button"
            aria-expanded={showDetails}
            onClick={() => setShowDetails((v) => !v)}
            className="flex w-full items-center gap-2 pt-1 text-xs font-medium text-ink-400 transition-colors hover:text-ink-700 dark:hover:text-paper-50"
          >
            <span aria-hidden className="h-px flex-1 bg-paper-200 dark:bg-ink-700" />
            Detail opsional {showDetails ? "▲" : "▼"}
            <span aria-hidden className="h-px flex-1 bg-paper-200 dark:bg-ink-700" />
          </button>

          {showDetails ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput
                  label="Pembacaan pola (kana)"
                  {...form.register("reading")}
                  placeholder="opsional"
                />
                <TextInput
                  label="Tags"
                  {...form.register("tags")}
                  placeholder="grammar, partikel"
                />
              </div>
              <TextInput
                label="Formula"
                {...form.register("formula")}
                placeholder="Vます tanpa ます + ながら"
              />
              <Textarea
                label="Kapan dipakai"
                {...form.register("usage")}
                rows={3}
                placeholder="Dua aktivitas dilakukan bersamaan."
              />
              <TextInput
                label="Contoh kalimat"
                {...form.register("normalExample")}
                placeholder="音楽を聞きながら勉強します。"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput
                  label="Pembacaan contoh (hiragana)"
                  {...form.register("exampleReading")}
                  placeholder="おんがくをききながらべんきょうします。"
                />
                <TextInput label="Arti contoh" {...form.register("exampleMeaning")} />
              </div>
              <p className="text-xs text-ink-400">
                Cukup satu contoh kalimat. Tampilannya menyesuaikan Mode Jepang
                otomatis: kana di Pemula, kanji + furigana di Normal, kanji saja
                di Pro. Isi pembacaan (hiragana) supaya furigana &amp; mode Pemula
                tampil benar.
              </p>
              <TextInput label="Catatan" {...form.register("note")} />
              <Textarea
                label="Kesalahan umum"
                {...form.register("commonMistake")}
                rows={3}
                placeholder="Pisahkan poin dengan baris baru atau angka 1. 2. 3. supaya rapi"
              />
              <Select label="Mastery" {...form.register("mastery")}>
                <option value="good">good</option>
                <option value="mid">mid</option>
                <option value="weak">weak</option>
              </Select>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            {!isEdit ? (
              <Button
                type="button"
                variant="secondary"
                loading={submitting}
                onClick={() => void onSubmitNext()}
              >
                Simpan &amp; tambah lagi
              </Button>
            ) : null}
            <Button type="submit" loading={submitting}>
              {initial ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      ) : null}

      {!isEdit && !manualMode ? (
        <BunpouAiAnalyze
          onApply={onAiApply}
          onCancel={onClose}
          existingPatterns={existingPatterns}
          existingItems={existingItems}
          onOpenSaved={onOpenSaved}
        />
      ) : null}
      </DialogContent>
    </Dialog>
  );
}

function emptyForm(): FormValues {
  return {
    pattern: "",
    reading: "",
    meaning: "",
    formula: "",
    usage: "",
    level: "",
    tags: "",
    beginnerExample: "",
    normalExample: "",
    furiganaExample: "",
    exampleReading: "",
    exampleMeaning: "",
    note: "",
    commonMistake: "",
    mastery: "mid",
  };
}

function toForm(b: Bunpou): FormValues {
  // Satu contoh kalimat: normal → beginner → furigana (mana yang ada).
  const example = b.normalExample || b.beginnerExample || b.furiganaExample || "";
  return {
    pattern: b.pattern,
    reading: b.reading ?? "",
    meaning: b.meaning,
    formula: b.formula ?? "",
    usage: b.usage ?? "",
    level: (b.level ?? "") as FormValues["level"],
    tags: (b.tags ?? []).join(", "),
    beginnerExample: b.beginnerExample ?? "",
    normalExample: example,
    furiganaExample: b.furiganaExample ?? "",
    exampleReading: b.exampleReading ?? "",
    exampleMeaning: b.exampleMeaning ?? "",
    note: b.note ?? "",
    commonMistake: b.commonMistake ?? "",
    mastery: b.mastery as Mastery,
  };
}

function toPayload(v: FormValues): BunpouWritePayload {
  const tags = (v.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  // Satu contoh kalimat (disimpan di normalExample). Mirror ke beginner
  // supaya tampilan konsisten di semua mode.
  const example = v.normalExample?.trim() || undefined;
  return {
    pattern: v.pattern.trim(),
    reading: v.reading?.trim() || undefined,
    meaning: v.meaning.trim(),
    formula: v.formula?.trim() || undefined,
    usage: v.usage?.trim() || undefined,
    level: v.level ? (v.level as "N5" | "N4" | "N3" | "N2" | "N1") : undefined,
    tags: tags.length ? tags : undefined,
    beginnerExample: example,
    normalExample: example,
    furiganaExample: v.furiganaExample?.trim() || undefined,
    exampleReading: v.exampleReading?.trim() || undefined,
    exampleMeaning: v.exampleMeaning?.trim() || undefined,
    note: v.note?.trim() || undefined,
    commonMistake: v.commonMistake?.trim() || undefined,
    mastery: v.mastery,
  };
}
