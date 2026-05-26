"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { toast } from "@/components/feedback/Toast";
import { ApiError } from "@/lib/api-client";
import type { Bunpou, Mastery } from "@/lib/types";
import {
  BunpouWritePayload,
  useCreateBunpou,
  useUpdateBunpou,
} from "@/features/catatan/useCatatan";

const schema = z.object({
  pattern: z.string().trim().min(1, "Pola wajib").max(120),
  meaning: z.string().trim().min(1, "Arti wajib").max(280),
  formula: z.string().trim().max(280).optional().or(z.literal("")),
  usage: z.string().trim().max(500).optional().or(z.literal("")),
  level: z.enum(["", "N5", "N4", "N3", "N2", "N1"]).optional(),
  tags: z.string().trim().max(200).optional(),
  beginnerExample: z.string().trim().max(500).optional().or(z.literal("")),
  normalExample: z.string().trim().max(500).optional().or(z.literal("")),
  furiganaExample: z.string().trim().max(500).optional().or(z.literal("")),
  exampleMeaning: z.string().trim().max(500).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  commonMistake: z.string().trim().max(500).optional().or(z.literal("")),
  mastery: z.enum(["good", "mid", "weak"]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Bunpou | null;
}

export function BunpouDialog({ open, onClose, initial }: Props) {
  const create = useCreateBunpou();
  const update = useUpdateBunpou();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm(),
  });

  useEffect(() => {
    if (open) form.reset(initial ? toForm(initial) : emptyForm());
  }, [open, initial, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = toPayload(values);
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, payload });
        toast("Bunpou diperbarui", "success");
      } else {
        await create.mutateAsync(payload);
        toast("Bunpou ditambahkan", "success");
      }
      onClose();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menyimpan";
      toast(msg, "error");
    }
  });

  const submitting = create.isPending || update.isPending;

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Bunpou" : "Tambah Bunpou"}>
      <form className="space-y-3" onSubmit={onSubmit} noValidate>
        <TextInput label="Pola" autoFocus {...form.register("pattern")} error={form.formState.errors.pattern?.message} placeholder="〜ながら" />
        <TextInput label="Arti" {...form.register("meaning")} error={form.formState.errors.meaning?.message} placeholder="sambil" />
        <TextInput label="Formula" {...form.register("formula")} placeholder="Vます tanpa ます + ながら" />
        <TextInput label="Kapan dipakai" {...form.register("usage")} placeholder="Dua aktivitas dilakukan bersamaan." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">Level JLPT</span>
            <select
              {...form.register("level")}
              className="block w-full rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm dark:bg-ink-800 dark:border-ink-700 dark:text-paper-50"
            >
              <option value="">— Tidak ditentukan —</option>
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </select>
          </label>
          <TextInput label="Tags" {...form.register("tags")} placeholder="grammar, partikel" hint="Pisahkan dengan koma" />
        </div>
        <TextInput label="Contoh (beginner)" {...form.register("beginnerExample")} />
        <TextInput label="Contoh (normal)" {...form.register("normalExample")} />
        <TextInput label="Contoh (furigana)" {...form.register("furiganaExample")} />
        <TextInput label="Arti contoh" {...form.register("exampleMeaning")} />
        <TextInput label="Catatan" {...form.register("note")} />
        <TextInput label="Kesalahan umum" {...form.register("commonMistake")} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">Mastery</span>
          <select
            {...form.register("mastery")}
            className="block w-full rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm dark:bg-ink-800 dark:border-ink-700 dark:text-paper-50"
          >
            <option value="good">good</option>
            <option value="mid">mid</option>
            <option value="weak">weak</option>
          </select>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={submitting}>
            {initial ? "Simpan" : "Tambah"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function emptyForm(): FormValues {
  return {
    pattern: "",
    meaning: "",
    formula: "",
    usage: "",
    level: "",
    tags: "",
    beginnerExample: "",
    normalExample: "",
    furiganaExample: "",
    exampleMeaning: "",
    note: "",
    commonMistake: "",
    mastery: "mid",
  };
}

function toForm(b: Bunpou): FormValues {
  return {
    pattern: b.pattern,
    meaning: b.meaning,
    formula: b.formula ?? "",
    usage: b.usage ?? "",
    level: (b.level ?? "") as FormValues["level"],
    tags: (b.tags ?? []).join(", "),
    beginnerExample: b.beginnerExample ?? "",
    normalExample: b.normalExample ?? "",
    furiganaExample: b.furiganaExample ?? "",
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
    meaning: v.meaning.trim(),
    formula: v.formula?.trim() || undefined,
    usage: v.usage?.trim() || undefined,
    level: v.level ? (v.level as "N5" | "N4" | "N3" | "N2" | "N1") : undefined,
    tags: tags.length ? tags : undefined,
    beginnerExample: v.beginnerExample?.trim() || undefined,
    normalExample: v.normalExample?.trim() || undefined,
    furiganaExample: v.furiganaExample?.trim() || undefined,
    exampleMeaning: v.exampleMeaning?.trim() || undefined,
    note: v.note?.trim() || undefined,
    commonMistake: v.commonMistake?.trim() || undefined,
    mastery: v.mastery,
  };
}
