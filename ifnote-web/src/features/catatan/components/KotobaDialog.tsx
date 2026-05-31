"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextInput } from "@/components/ui/TextInput";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import type { Kotoba, Mastery } from "@/lib/types";
import {
  KotobaWritePayload,
  useCreateKotoba,
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
 * In create mode the dialog renders the bulk-AI textarea directly — no
 * mode selector pills. The bulk endpoint accepts 1..50 items so a single
 * kotoba is just a one-line entry. Edit mode renders the manual form.
 *
 * The legacy `initialTab` prop is still accepted for backwards-compat
 * with deep links (`?openAdd=ai-kotoba` / `?openAdd=bulk-kotoba`) but
 * has no visual effect anymore: both options now land on the same
 * bulk textarea.
 */
type Tab = "manual" | "ai" | "bulk";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Kotoba | null;
  /** All kotoba JP strings already saved — for AI duplicate detection. */
  existingJp?: string[];
  /** Tab to open by default. Useful for "Tambah dengan AI" CTAs (legacy). */
  initialTab?: Tab;
  /**
   * Buka kotoba yang sudah tersimpan dalam mode edit (dipakai ketika
   * lookup AI menemukan item yang sudah ada di Catatan).
   * Disimpan di interface untuk backwards-compat — tidak dipakai di
   * create mode lagi.
   */
  onOpenSaved?: (id: string) => void;
}

export function KotobaDialog({
  open,
  onClose,
  initial,
  existingJp = [],
  initialTab: _initialTab,
  onOpenSaved: _onOpenSaved,
}: Props) {
  const isEdit = !!initial;
  const create = useCreateKotoba();
  const update = useUpdateKotoba();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm(),
  });

  useEffect(() => {
    if (open) {
      form.reset(initial ? toForm(initial) : emptyForm());
    }
  }, [open, initial, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = toPayload(values);
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, payload });
        notify.success("Kotoba diperbarui", "Perubahan sudah disimpan.", { icon: "🌸" });
      } else {
        await create.mutateAsync(payload);
        notify.success(
          "Kotoba disimpan",
          "Catatan baru sudah masuk ke daftar kamu.",
          { icon: "📚" },
        );
      }
      onClose();
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menyimpan kotoba",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  });

  const submitting = create.isPending || update.isPending;

  /** Bulk flow — save all selected items here, then close modal. */
  const onBulkSaveAll = async (payloads: KotobaWritePayload[]) => {
    if (payloads.length === 0) return;
    // Loader inline (LoadingState "Menyimpan kotoba…" di KotobaBulkAi, state
    // `saving`) sudah jadi indikator proses. Jangan pakai notify.promise — itu
    // memunculkan toast loading kedua yang berputar bersamaan (loading dobel).
    try {
      // Sequential to keep hafalan_order deterministic.
      for (const p of payloads) {
        await create.mutateAsync(p);
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
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
      <DialogHeader>
        <DialogTitle>{initial ? "Edit Kotoba" : "Tambah Kotoba"}</DialogTitle>
      </DialogHeader>
      {/* Tab pills removed in create mode: dialog renders the bulk-AI
          textarea directly per spec. Edit mode renders the manual form. */}

      {/* Manual form: rendered ONLY for edit mode. Add mode never
          shows manual fields per spec — the bulk-AI textarea is the
          single create surface. */}
      {isEdit ? (
        <form className="space-y-3" onSubmit={onSubmit} noValidate>
          <TextInput
            label="Tulisan Jepang"
            autoFocus
            {...form.register("jp")}
            error={form.formState.errors.jp?.message}
            placeholder="例: 食べます"
          />
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
          <TextInput
            label="Arti"
            {...form.register("meaning")}
            error={form.formState.errors.meaning?.message}
            placeholder="makan"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput
              label="Jenis Kata"
              {...form.register("type")}
              placeholder="kata kerja / sifat-i / dst."
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
                Level JLPT
              </span>
              <select
                {...form.register("level")}
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
            label="Tags"
            {...form.register("tags")}
            hint="Pisahkan dengan koma. Misal: makanan, verb-1"
            placeholder="makanan, verb-1"
          />
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
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
              Mastery
            </span>
            <select
              {...form.register("mastery")}
              className="block w-full rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
            >
              <option value="good">good</option>
              <option value="mid">mid</option>
              <option value="weak">weak</option>
            </select>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              {initial ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      ) : null}

      {!isEdit ? (
        <KotobaBulkAi
          onSaveAll={onBulkSaveAll}
          onCancel={onClose}
          existingJp={existingJp}
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
