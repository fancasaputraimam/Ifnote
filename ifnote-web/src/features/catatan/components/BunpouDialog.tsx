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
import type { Bunpou, Mastery } from "@/lib/types";
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
type Tab = "manual" | "ai";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Bunpou | null;
  /** Existing patterns sudah disimpan, untuk AI dedup. */
  existingPatterns?: string[];
  initialTab?: Tab;
  /**
   * Buka bunpou yang sudah tersimpan dalam mode edit (dipakai ketika
   * lookup AI menemukan item yang sudah ada di Catatan).
   */
  onOpenSaved?: (id: string) => void;
}

export function BunpouDialog({
  open,
  onClose,
  initial,
  existingPatterns = [],
  initialTab,
  onOpenSaved,
}: Props) {
  const isEdit = !!initial;
  const create = useCreateBunpou();
  const update = useUpdateBunpou();

  const [tab, setTab] = useState<Tab>(initialTab ?? "manual");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm(),
  });

  useEffect(() => {
    if (open) {
      form.reset(initial ? toForm(initial) : emptyForm());
      setTab(isEdit ? "manual" : initialTab ?? "manual");
    }
  }, [open, initial, isEdit, initialTab, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = toPayload(values);
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, payload });
        notify.success("Bunpou diperbarui", "Perubahan sudah disimpan.", { icon: "📚" });
      } else {
        await create.mutateAsync(payload);
        notify.success(
          "Bunpou disimpan",
          "Pola bunpou berhasil ditambahkan.",
          { icon: "📚" },
        );
      }
      onClose();
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menyimpan bunpou",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  });

  const submitting = create.isPending || update.isPending;

  const onAiApply = (payload: BunpouWritePayload) => {
    form.reset({
      pattern: payload.pattern,
      reading: payload.reading ?? "",
      meaning: payload.meaning,
      formula: payload.formula ?? "",
      usage: payload.usage ?? "",
      level: (payload.level ?? "") as FormValues["level"],
      tags: (payload.tags ?? []).join(", "),
      beginnerExample: payload.beginnerExample ?? "",
      normalExample: payload.normalExample ?? "",
      furiganaExample: payload.furiganaExample ?? "",
      exampleReading: payload.exampleReading ?? "",
      exampleMeaning: payload.exampleMeaning ?? "",
      note: payload.note ?? "",
      commonMistake: payload.commonMistake ?? "",
      mastery: payload.mastery ?? "mid",
    });
    setTab("manual");
    notify.info(
      "Pratinjau AI siap",
      "Periksa hasilnya sebelum kamu simpan.",
      { icon: "✨" },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Bunpou" : "Tambah Bunpou"}
    >
      {!isEdit ? (
        <div className="mb-4 inline-flex flex-wrap gap-1 rounded-full border border-paper-200 bg-paper-50 p-0.5 text-xs dark:border-ink-700 dark:bg-ink-900/40">
          <TabBtn active={tab === "manual"} onClick={() => setTab("manual")}>
            Manual
          </TabBtn>
          <TabBtn active={tab === "ai"} onClick={() => setTab("ai")}>
            ✨ AI Analyze
          </TabBtn>
        </div>
      ) : null}

      {tab === "manual" || isEdit ? (
        <form className="space-y-3" onSubmit={onSubmit} noValidate>
          <TextInput
            label="Pola"
            autoFocus
            {...form.register("pattern")}
            error={form.formState.errors.pattern?.message}
            placeholder="〜ながら"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput
              label="Pembacaan pola (kana)"
              {...form.register("reading")}
              placeholder="opsional"
            />
            <TextInput
              label="Arti"
              {...form.register("meaning")}
              error={form.formState.errors.meaning?.message}
              placeholder="sambil"
            />
          </div>
          <TextInput
            label="Formula"
            {...form.register("formula")}
            placeholder="Vます tanpa ます + ながら"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
              Kapan dipakai
            </label>
            <textarea
              {...form.register("usage")}
              rows={3}
              placeholder="Dua aktivitas dilakukan bersamaan."
              className="block w-full resize-y rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <TextInput
              label="Tags"
              {...form.register("tags")}
              placeholder="grammar, partikel"
              hint="Pisahkan dengan koma"
            />
          </div>
          <TextInput
            label="Contoh (beginner)"
            {...form.register("beginnerExample")}
          />
          <TextInput
            label="Contoh (normal)"
            {...form.register("normalExample")}
          />
          <TextInput
            label="Contoh (furigana)"
            {...form.register("furiganaExample")}
          />
          <TextInput
            label="Pembacaan contoh (hiragana)"
            {...form.register("exampleReading")}
          />
          <TextInput label="Arti contoh" {...form.register("exampleMeaning")} />
          <TextInput label="Catatan" {...form.register("note")} />
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
              Kesalahan umum
            </label>
            <textarea
              {...form.register("commonMistake")}
              rows={3}
              placeholder="Pisahkan poin dengan baris baru atau angka 1. 2. 3. supaya rapi"
              className="block w-full resize-y rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
            />
          </div>
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
        <BunpouAiAnalyze
          onApply={onAiApply}
          onCancel={onClose}
          existingPatterns={existingPatterns}
          onOpenSaved={onOpenSaved}
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
  return {
    pattern: b.pattern,
    reading: b.reading ?? "",
    meaning: b.meaning,
    formula: b.formula ?? "",
    usage: b.usage ?? "",
    level: (b.level ?? "") as FormValues["level"],
    tags: (b.tags ?? []).join(", "),
    beginnerExample: b.beginnerExample ?? "",
    normalExample: b.normalExample ?? "",
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
  return {
    pattern: v.pattern.trim(),
    reading: v.reading?.trim() || undefined,
    meaning: v.meaning.trim(),
    formula: v.formula?.trim() || undefined,
    usage: v.usage?.trim() || undefined,
    level: v.level ? (v.level as "N5" | "N4" | "N3" | "N2" | "N1") : undefined,
    tags: tags.length ? tags : undefined,
    beginnerExample: v.beginnerExample?.trim() || undefined,
    normalExample: v.normalExample?.trim() || undefined,
    furiganaExample: v.furiganaExample?.trim() || undefined,
    exampleReading: v.exampleReading?.trim() || undefined,
    exampleMeaning: v.exampleMeaning?.trim() || undefined,
    note: v.note?.trim() || undefined,
    commonMistake: v.commonMistake?.trim() || undefined,
    mastery: v.mastery,
  };
}
