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
import type { Kotoba, Mastery } from "@/lib/types";
import {
  KotobaWritePayload,
  useCreateKotoba,
  useUpdateKotoba,
} from "@/features/catatan/useCatatan";

const schema = z.object({
  jp: z.string().trim().min(1, "Tulisan Jepang wajib").max(120),
  romaji: z.string().trim().max(120).optional().or(z.literal("")),
  meaning: z.string().trim().min(1, "Arti wajib").max(280),
  type: z.string().trim().max(80).optional().or(z.literal("")),
  level: z.enum(["", "N5", "N4", "N3", "N2", "N1"]).optional(),
  tags: z.string().trim().max(200).optional(),
  beginnerExample: z.string().trim().max(500).optional().or(z.literal("")),
  normalExample: z.string().trim().max(500).optional().or(z.literal("")),
  furiganaExample: z.string().trim().max(500).optional().or(z.literal("")),
  exampleMeaning: z.string().trim().max(500).optional().or(z.literal("")),
  mastery: z.enum(["good", "mid", "weak"]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Kotoba | null;
}

export function KotobaDialog({ open, onClose, initial }: Props) {
  const create = useCreateKotoba();
  const update = useUpdateKotoba();

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
        toast("Kotoba diperbarui", "success");
      } else {
        await create.mutateAsync(payload);
        toast("Kotoba ditambahkan", "success");
      }
      onClose();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menyimpan";
      toast(msg, "error");
    }
  });

  const submitting = create.isPending || update.isPending;

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Kotoba" : "Tambah Kotoba"}>
      <form className="space-y-3" onSubmit={onSubmit} noValidate>
        <TextInput label="Tulisan Jepang" autoFocus {...form.register("jp")} error={form.formState.errors.jp?.message} placeholder="例: 食べます" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput label="Romaji" {...form.register("romaji")} error={form.formState.errors.romaji?.message} placeholder="tabemasu" />
          <TextInput label="Arti" {...form.register("meaning")} error={form.formState.errors.meaning?.message} placeholder="makan" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput label="Jenis Kata" {...form.register("type")} placeholder="kata kerja / sifat-i / dst." />
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
          label="Arti contoh"
          {...form.register("exampleMeaning")}
          placeholder="Saya makan nasi."
        />
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
    jp: "",
    romaji: "",
    meaning: "",
    type: "",
    level: "",
    tags: "",
    beginnerExample: "",
    normalExample: "",
    furiganaExample: "",
    exampleMeaning: "",
    mastery: "mid",
  };
}

function toForm(k: Kotoba): FormValues {
  return {
    jp: k.jp,
    romaji: k.romaji ?? "",
    meaning: k.meaning,
    type: k.type ?? "",
    level: (k.level ?? "") as FormValues["level"],
    tags: (k.tags ?? []).join(", "),
    beginnerExample: k.beginnerExample ?? "",
    normalExample: k.normalExample ?? "",
    furiganaExample: k.furiganaExample ?? "",
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
    romaji: v.romaji?.trim() || undefined,
    meaning: v.meaning.trim(),
    type: v.type?.trim() || undefined,
    level: v.level ? (v.level as "N5" | "N4" | "N3" | "N2" | "N1") : undefined,
    tags: tags.length ? tags : undefined,
    beginnerExample: v.beginnerExample?.trim() || undefined,
    normalExample: v.normalExample?.trim() || undefined,
    furiganaExample: v.furiganaExample?.trim() || undefined,
    exampleMeaning: v.exampleMeaning?.trim() || undefined,
    mastery: v.mastery,
  };
}
