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
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { normalizeJaKey } from "@/lib/utils";
import { normalizeAiKotobaResult } from "@/lib/ai-normalize";
import { useBulkKotobaAi } from "@/features/ai/useAi";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { api } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { CatatanList, Kotoba, Mastery } from "@/lib/types";
import {
  KotobaWritePayload,
  useCreateKotoba,
  useCreateKotobaRaw,
  useInvalidateCatatan,
  useUpdateKotoba,
} from "@/features/catatan/useCatatan";
import { KotobaBulkAi } from "./KotobaBulkAi";

const schema = z.object({
  jp: z.string().trim().min(1, "Tulisan Jepang wajib").max(120),
  reading: z.string().trim().max(120).optional().or(z.literal("")),
  romaji: z.string().trim().max(120).optional().or(z.literal("")),
  meaning: z.string().trim().min(1, "Arti wajib").max(280),
  type: z.string().trim().max(80).optional().or(z.literal("")),
  level: z.enum(["", "N5", "N4", "N3", "N2", "N1"]).optional(),
  tags: z.string().trim().max(200).optional(),
  beginnerExample: z.string().trim().max(500).optional().or(z.literal("")),
  beginnerExampleReading: z.string().trim().max(500).optional().or(z.literal("")),
  beginnerExampleMeaning: z.string().trim().max(500).optional().or(z.literal("")),
  normalExample: z.string().trim().max(500).optional().or(z.literal("")),
  normalExampleReading: z.string().trim().max(500).optional().or(z.literal("")),
  normalExampleMeaning: z.string().trim().max(500).optional().or(z.literal("")),
  furiganaExample: z.string().trim().max(500).optional().or(z.literal("")),
  exampleReading: z.string().trim().max(500).optional().or(z.literal("")),
  exampleMeaning: z.string().trim().max(500).optional().or(z.literal("")),
  mastery: z.enum(["good", "mid", "weak"]),
});

type FormValues = z.infer<typeof schema>;

/**
 * Create mode: tab "Dengan AI" (bulk textarea, default) atau "Isi manual".
 * Edit mode: langsung form manual. Bulk endpoint menerima 1..50 item jadi
 * satu kotoba cukup satu baris.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Kotoba | null;
  /** All kotoba JP strings already saved — for AI duplicate detection. */
  existingJp?: string[];
  /** Kotoba tersimpan (jp + id) — untuk tombol "Buka yang tersimpan". */
  existingItems?: { jp: string; id: string }[];
  /**
   * Buka kotoba yang sudah tersimpan dalam mode edit (dipakai ketika
   * analisa AI menemukan duplikat yang sudah ada di Catatan).
   */
  onOpenSaved?: (id: string) => void;
}

export function KotobaDialog({
  open,
  onClose,
  initial,
  existingJp = [],
  existingItems = [],
  onOpenSaved,
}: Props) {
  const isEdit = !!initial;
  const create = useCreateKotoba();
  const createRaw = useCreateKotobaRaw();
  const invalidateCatatan = useInvalidateCatatan();
  const update = useUpdateKotoba();
  // Mode create: "Dengan AI" (default) atau "Isi manual". Manual penting
  // sebagai fallback saat AI belum dikonfigurasi.
  const [manualMode, setManualMode] = useState(false);
  // Progressive disclosure: field opsional dilipat, kecuali di mode edit.
  const [showDetails, setShowDetails] = useState(false);
  // "Lengkapi dengan AI" di dalam form manual — mengisi field yang kosong.
  const aiFill = useBulkKotobaAi();

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
        notify.success("Kotoba diperbarui", "Perubahan sudah disimpan.", { icon: "🌸" });
        onClose();
      } else {
        await create.mutateAsync(payload);
        notify.success(
          "Kotoba disimpan",
          keepOpen
            ? "Lanjut — tulis kotoba berikutnya."
            : "Catatan baru sudah masuk ke daftar kamu.",
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
        title: "Gagal menyimpan kotoba",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  const onSubmit = form.handleSubmit((v) => saveValues(v, false));
  const onSubmitNext = form.handleSubmit((v) => saveValues(v, true));

  const submitting = create.isPending || update.isPending;

  // Peringatan duplikat live (create + manual saja). Dua lapis:
  //  1) daftar yang sudah termuat di layar (instan),
  //  2) pencarian SERVER (debounced) — menutup celah koleksi >100 item
  //     yang halamannya belum termuat.
  const jpValue = form.watch("jp");
  const debouncedJp = useDebouncedValue((jpValue ?? "").trim(), 350);
  const serverDupQ = useQuery<CatatanList>({
    queryKey: ["catatan", "dup", "kotoba", normalizeJaKey(debouncedJp)],
    queryFn: () =>
      api.get<CatatanList>("/api/catatan", {
        query: { search: debouncedJp, type: "kotoba", page: 1, limit: 5 },
      }),
    enabled: open && !isEdit && manualMode && debouncedJp.length > 0,
    retry: 0,
    staleTime: 30_000,
  });
  const dup = useMemo(() => {
    if (isEdit) return null;
    const key = normalizeJaKey(jpValue ?? "");
    if (!key) return null;
    const local = existingJp.some((j) => normalizeJaKey(j) === key)
      ? existingItems.find((x) => normalizeJaKey(x.jp) === key) ?? null
      : null;
    if (local) return local;
    const remote = serverDupQ.data?.items.find(
      (i) => i.noteType === "kotoba" && normalizeJaKey(i.jpOrPattern) === key,
    );
    return remote ? { jp: remote.jpOrPattern, id: remote.id } : null;
  }, [isEdit, jpValue, existingJp, existingItems, serverDupQ.data]);

  /** Isi field yang masih kosong dari hasil AI (tidak menimpa input user). */
  const onAiFill = async () => {
    const word = form.getValues("jp").trim();
    if (!word) return;
    try {
      const r = await aiFill.mutateAsync({ words: [word] });
      const raw = (r.data?.items ?? [])[0];
      if (!raw) throw new Error("AI tidak mengembalikan hasil");
      const n = normalizeAiKotobaResult(raw as unknown as Record<string, unknown>);
      const fillIfEmpty = (field: keyof FormValues, val?: string | null) => {
        if (!val) return;
        const cur = String(form.getValues(field) ?? "");
        if (!cur.trim()) form.setValue(field, val as never, { shouldDirty: true });
      };
      fillIfEmpty("reading", n.reading);
      fillIfEmpty("romaji", n.romaji);
      fillIfEmpty("meaning", n.meaning);
      fillIfEmpty("type", n.type);
      const lv = String(n.level ?? "").toUpperCase();
      if (["N5", "N4", "N3", "N2", "N1"].includes(lv)) fillIfEmpty("level", lv);
      fillIfEmpty("normalExample", n.normalExample || n.beginnerExample);
      fillIfEmpty("normalExampleReading", n.normalExampleReading || n.exampleReading);
      fillIfEmpty("normalExampleMeaning", n.normalExampleMeaning || n.exampleMeaning);
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

  /** Bulk flow — save all selected items here, then close modal. */
  const onBulkSaveAll = async (
    payloads: KotobaWritePayload[],
    onProgress?: (saved: number, total: number) => void,
  ) => {
    if (payloads.length === 0) return;
    // Loader inline (progress "Menyimpan i/n" di KotobaBulkAi) sudah jadi
    // indikator proses. Jangan pakai notify.promise — itu memunculkan toast
    // loading kedua yang berputar bersamaan (loading dobel).
    let saved = 0;
    try {
      // Sequential to keep hafalan_order deterministic. Pakai mutation RAW
      // (tanpa invalidasi per item) — dulu tiap item memicu 7 invalidasi
      // query → badai refetch selama loop 50 item.
      for (const p of payloads) {
        await createRaw.mutateAsync(p);
        saved += 1;
        onProgress?.(saved, payloads.length);
      }
      notify.success(
        "Kotoba berhasil disimpan",
        `${payloads.length} kotoba baru masuk ke Catatan.`,
        { icon: "🌸" },
      );
      onClose();
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menyimpan kotoba",
        message:
          saved > 0
            ? `${saved} dari ${payloads.length} sudah tersimpan. Analisa ulang akan menandai yang tersimpan sebagai duplikat — sisanya bisa dicoba lagi.`
            : "Belum ada yang tersimpan. Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    } finally {
      // Invalidasi SEKALI — apa pun hasilnya (partial save tetap perlu sync).
      if (saved > 0) invalidateCatatan();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl">
      <CatatanDialogHeader type="kotoba" mode={initial ? "edit" : "add"} />

      {/* Mode create: pilih Dengan AI atau Isi manual. Manual = fallback
          saat AI belum dikonfigurasi. Edit mode langsung form manual. */}
      {!isEdit ? <CreateModeTabs manual={manualMode} onChange={setManualMode} /> : null}

      {isEdit || manualMode ? (
        <form className="space-y-3" onSubmit={onSubmit} noValidate>
          {/* --- field wajib --- */}
          <TextInput
            label="Tulisan Jepang"
            autoFocus
            {...form.register("jp")}
            error={form.formState.errors.jp?.message}
            placeholder="例: 食べます"
          />

          {dup ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-700/10 dark:text-amber-200">
              <span className="min-w-0 flex-1">
                Kotoba ini sudah ada di Catatan — simpan lagi akan membuat duplikat.
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
            placeholder="makan"
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
                disabled={!jpValue?.trim()}
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
                  label="Romaji"
                  {...form.register("romaji")}
                  error={form.formState.errors.romaji?.message}
                  placeholder="tabemasu"
                />
                <TextInput
                  label="Pembacaan (kana)"
                  {...form.register("reading")}
                  placeholder="たべます"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput
                  label="Jenis Kata"
                  {...form.register("type")}
                  placeholder="kata kerja / sifat-i / dst."
                />
                <TextInput
                  label="Tags"
                  {...form.register("tags")}
                  placeholder="makanan, verb-1"
                />
              </div>
              <TextInput
                label="Contoh kalimat"
                {...form.register("normalExample")}
                placeholder="ごはんを食べます。"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput
                  label="Pembacaan contoh (hiragana)"
                  {...form.register("normalExampleReading")}
                  placeholder="ごはんをたべます。"
                />
                <TextInput
                  label="Arti contoh"
                  {...form.register("normalExampleMeaning")}
                  placeholder="Saya makan nasi."
                />
              </div>
              <p className="text-xs text-ink-400">
                Cukup satu contoh kalimat. Tampilannya menyesuaikan Mode Jepang
                otomatis: kana di Pemula, kanji + furigana di Normal, kanji saja
                di Pro. Isi pembacaan (hiragana) supaya furigana &amp; mode Pemula
                tampil benar.
              </p>
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
        <KotobaBulkAi
          onSaveAll={onBulkSaveAll}
          onCancel={onClose}
          existingJp={existingJp}
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
    jp: "",
    reading: "",
    romaji: "",
    meaning: "",
    type: "",
    level: "",
    tags: "",
    beginnerExample: "",
    beginnerExampleReading: "",
    beginnerExampleMeaning: "",
    normalExample: "",
    normalExampleReading: "",
    normalExampleMeaning: "",
    furiganaExample: "",
    exampleReading: "",
    exampleMeaning: "",
    mastery: "mid",
  };
}

function toForm(k: Kotoba): FormValues {
  // Satu contoh kalimat. Ambil dari normal → beginner → furigana (mana yang
  // ada), beserta reading & arti yang berpasangan. Field beginner/furigana
  // tetap disimpan di balik layar untuk kompatibilitas data lama.
  const example = k.normalExample || k.beginnerExample || k.furiganaExample || "";
  const exampleReading =
    (k.normalExample ? k.normalExampleReading : k.beginnerExample ? k.beginnerExampleReading : "") ||
    k.exampleReading ||
    "";
  const exampleMeaning =
    (k.normalExample ? k.normalExampleMeaning : k.beginnerExample ? k.beginnerExampleMeaning : "") ||
    k.exampleMeaning ||
    "";
  return {
    jp: k.jp,
    reading: k.reading ?? "",
    romaji: k.romaji ?? "",
    meaning: k.meaning,
    type: k.type ?? "",
    level: (k.level ?? "") as FormValues["level"],
    tags: (k.tags ?? []).join(", "),
    beginnerExample: k.beginnerExample ?? "",
    beginnerExampleReading: k.beginnerExampleReading ?? "",
    beginnerExampleMeaning: k.beginnerExampleMeaning ?? "",
    normalExample: example,
    normalExampleReading: exampleReading,
    normalExampleMeaning: exampleMeaning,
    furiganaExample: k.furiganaExample ?? "",
    exampleReading: k.exampleReading ?? "",
    exampleMeaning: k.exampleMeaning ?? "",
    mastery: k.mastery as Mastery,
  };
}

function toPayload(v: FormValues): KotobaWritePayload {
  const tags = (v.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  // Form sekarang cuma punya satu contoh kalimat (disimpan di field
  // normal*). Mirror ke beginner* + shared example* supaya tampilan
  // (Catatan/Hafalan) konsisten apa pun mode yang dipilih user.
  const example = v.normalExample?.trim() || undefined;
  const exampleReading = v.normalExampleReading?.trim() || undefined;
  const exampleMeaning = v.normalExampleMeaning?.trim() || undefined;
  return {
    jp: v.jp.trim(),
    reading: v.reading?.trim() || undefined,
    romaji: v.romaji?.trim() || undefined,
    meaning: v.meaning.trim(),
    type: v.type?.trim() || undefined,
    level: v.level ? (v.level as "N5" | "N4" | "N3" | "N2" | "N1") : undefined,
    tags: tags.length ? tags : undefined,
    beginnerExample: example,
    beginnerExampleReading: exampleReading,
    beginnerExampleMeaning: exampleMeaning,
    normalExample: example,
    normalExampleReading: exampleReading,
    normalExampleMeaning: exampleMeaning,
    furiganaExample: v.furiganaExample?.trim() || undefined,
    exampleReading,
    exampleMeaning,
    mastery: v.mastery,
  };
}
