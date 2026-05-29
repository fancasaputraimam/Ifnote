"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { cn } from "@/lib/utils";
import type { Kotoba, Mastery } from "@/lib/types";
import {
  KotobaWritePayload,
  useCreateKotoba,
  useUpdateKotoba,
} from "@/features/catatan/useCatatan";
import { KotobaAiAnalyze } from "./KotobaAiAnalyze";
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
  normalExample: z.string().trim().max(500).optional().or(z.literal("")),
  furiganaExample: z.string().trim().max(500).optional().or(z.literal("")),
  exampleReading: z.string().trim().max(500).optional().or(z.literal("")),
  exampleMeaning: z.string().trim().max(500).optional().or(z.literal("")),
  mastery: z.enum(["good", "mid", "weak"]),
});

type FormValues = z.infer<typeof schema>;

type Tab = "manual" | "ai" | "bulk";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Kotoba | null;
  /** All kotoba JP strings already saved — for AI duplicate detection. */
  existingJp?: string[];
  /** Tab to open by default. Useful for "Tambah dengan AI" CTAs. */
  initialTab?: Tab;
  /**
   * Buka kotoba yang sudah tersimpan dalam mode edit (dipakai ketika
   * lookup AI menemukan item yang sudah ada di Catatan).
   * Dialog ini akan di-close dan parent yang membuka ulang dengan
   * `initial` ter-set.
   */
  onOpenSaved?: (id: string) => void;
}

export function KotobaDialog({
  open,
  onClose,
  initial,
  existingJp = [],
  initialTab,
  onOpenSaved,
}: Props) {
  const isEdit = !!initial;
  const create = useCreateKotoba();
  const update = useUpdateKotoba();

  // Tabs only meaningful when adding new — when editing existing, force manual.
  // The "Manual" tab pill is intentionally hidden in Add mode (per spec): user
  // adds via AI Analyze or Bulk AI; the manual form is still rendered
  // automatically as the review step after AI fills it in (`onAiApply`),
  // and it stays the only branch for editing existing entries.
  const [tab, setTab] = useState<Tab>(initialTab ?? "ai");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm(),
  });

  useEffect(() => {
    if (open) {
      form.reset(initial ? toForm(initial) : emptyForm());
      setTab(isEdit ? "manual" : initialTab ?? "ai");
    }
  }, [open, initial, isEdit, initialTab, form]);

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

  /** AI flow → fill manual form with AI data, switch to manual tab so user
   *  can review + tweak before final Simpan. */
  const onAiApply = (payload: KotobaWritePayload) => {
    form.reset({
      jp: payload.jp ?? "",
      reading: payload.reading ?? "",
      romaji: payload.romaji ?? "",
      meaning: payload.meaning ?? "",
      type: payload.type ?? "",
      level: (payload.level ?? "") as FormValues["level"],
      tags: (payload.tags ?? []).join(", "),
      beginnerExample: payload.beginnerExample ?? "",
      normalExample: payload.normalExample ?? "",
      furiganaExample: payload.furiganaExample ?? "",
      exampleReading: payload.exampleReading ?? "",
      exampleMeaning: payload.exampleMeaning ?? "",
      mastery: payload.mastery ?? "mid",
    });
    setTab("manual");
    notify.info(
      "Pratinjau AI siap",
      "Periksa hasilnya sebelum kamu simpan.",
      { icon: "✨" },
    );
  };

  /** Bulk flow → save all selected items here, then close modal. */
  const onBulkSaveAll = async (payloads: KotobaWritePayload[]) => {
    if (payloads.length === 0) return;
    try {
      await notify.promise(
        async () => {
          // Sequential to keep hafalan_order deterministic.
          for (const p of payloads) {
            await create.mutateAsync(p);
          }
        },
        {
          loading: {
            title: "Menyimpan kotoba",
            message: `Sedang menambahkan ${payloads.length} kotoba…`,
            icon: "📚",
          },
          success: {
            title: "Kotoba berhasil disimpan",
            message: `${payloads.length} kotoba baru masuk ke Catatan.`,
            icon: "🌸",
          },
          error: (err) => {
            const m = mapApiErrorToUserMessage(err, {
              title: "Gagal menyimpan kotoba",
              message: "Coba lagi sebentar.",
            });
            return { title: m.title, message: m.message, icon: "⚠️" };
          },
        },
      );
      onClose();
    } catch {
      // notify.promise sudah menampilkan toast error — swallow.
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Kotoba" : "Tambah Kotoba"}
    >
      {!isEdit ? (
        <div className="mb-4 inline-flex flex-wrap gap-1 rounded-full border border-paper-200 bg-paper-50 p-0.5 text-xs dark:border-ink-700 dark:bg-ink-900/40">
          <TabBtn active={tab === "ai"} onClick={() => setTab("ai")}>
            ✨ AI Analyze
          </TabBtn>
          <TabBtn active={tab === "bulk"} onClick={() => setTab("bulk")}>
            ✨ Bulk AI
          </TabBtn>
        </div>
      ) : null}

      {tab === "manual" || isEdit ? (
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
            label="Contoh kalimat (beginner)"
            {...form.register("beginnerExample")}
            placeholder="ごはんを たべます。"
          />
          <TextInput
            label="Contoh kalimat (normal)"
            {...form.register("normalExample")}
            placeholder="ごはんを食べます。"
          />
          <TextInput
            label="Contoh kalimat (furigana)"
            {...form.register("furiganaExample")}
            placeholder="ごはんを 食(た)べます。"
          />
          <TextInput
            label="Pembacaan contoh (hiragana)"
            {...form.register("exampleReading")}
            placeholder="ごはんを たべます。"
          />
          <TextInput
            label="Arti contoh"
            {...form.register("exampleMeaning")}
            placeholder="Saya makan nasi."
          />
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

      {!isEdit && tab === "ai" ? (
        <KotobaAiAnalyze
          onApply={onAiApply}
          onCancel={onClose}
          existingJp={existingJp}
          onOpenSaved={onOpenSaved}
        />
      ) : null}

      {!isEdit && tab === "bulk" ? (
        <KotobaBulkAi
          onSaveAll={onBulkSaveAll}
          onCancel={onClose}
          existingJp={existingJp}
        />
      ) : null}
    </Modal>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 font-medium transition-colors",
        active
          ? "bg-accent-500 text-white"
          : "text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
      )}
    >
      {children}
    </button>
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
    normalExample: "",
    furiganaExample: "",
    exampleReading: "",
    exampleMeaning: "",
    mastery: "mid",
  };
}

function toForm(k: Kotoba): FormValues {
  return {
    jp: k.jp,
    reading: k.reading ?? "",
    romaji: k.romaji ?? "",
    meaning: k.meaning,
    type: k.type ?? "",
    level: (k.level ?? "") as FormValues["level"],
    tags: (k.tags ?? []).join(", "),
    beginnerExample: k.beginnerExample ?? "",
    normalExample: k.normalExample ?? "",
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
  return {
    jp: v.jp.trim(),
    reading: v.reading?.trim() || undefined,
    romaji: v.romaji?.trim() || undefined,
    meaning: v.meaning.trim(),
    type: v.type?.trim() || undefined,
    level: v.level ? (v.level as "N5" | "N4" | "N3" | "N2" | "N1") : undefined,
    tags: tags.length ? tags : undefined,
    beginnerExample: v.beginnerExample?.trim() || undefined,
    normalExample: v.normalExample?.trim() || undefined,
    furiganaExample: v.furiganaExample?.trim() || undefined,
    exampleReading: v.exampleReading?.trim() || undefined,
    exampleMeaning: v.exampleMeaning?.trim() || undefined,
    mastery: v.mastery,
  };
}
