"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import { useCreateBunpou, useAddToHafalan } from "@/features/catatan/useCatatan";
import { ClickableKanji } from "@/features/kanji/ClickableKanji";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";
import type { ExplainBunpouData } from "../types";

interface Props {
  data: ExplainBunpouData;
  source: "ai" | "mock";
  fallbackPattern: string;
}

export function BunpouResponseCard({ data, source, fallbackPattern }: Props) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const create = useCreateBunpou();
  const addToHafalan = useAddToHafalan();

  const pattern = (data.pattern || fallbackPattern || "").trim();

  const onSave = async () => {
    if (!pattern) return;
    try {
      const created = await create.mutateAsync({
        pattern,
        meaning: data.meaning,
        formula: data.formula || undefined,
        usage: data.usage || undefined,
        normalExample: data.example || undefined,
        exampleMeaning: data.exampleMeaning || undefined,
        commonMistake: data.commonMistake || undefined,
        mastery: "mid",
      });
      setSavedId(created.id);
      toast("Bunpou disimpan ke Catatan", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menyimpan";
      toast(msg, "error");
    }
  };

  const onAddHafalan = async () => {
    if (!savedId) {
      toast("Simpan dulu sebelum menambahkan ke Hafalan", "info");
      return;
    }
    try {
      await addToHafalan.mutateAsync({ itemType: "bunpou", itemId: savedId });
      toast("Ditambahkan ke Hafalan", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menambah ke Hafalan";
      toast(msg, "error");
    }
  };

  const onCopy = async () => {
    const text = [
      `${pattern} — ${data.meaning}`,
      data.formula ? `Formula: ${data.formula}` : "",
      data.usage ? `Kapan dipakai: ${data.usage}` : "",
      data.example ? `Contoh: ${data.example}` : "",
      data.exampleMeaning ? `Arti contoh: ${data.exampleMeaning}` : "",
      data.commonMistake ? `Kesalahan umum: ${data.commonMistake}` : "",
    ].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast("Tersalin ke clipboard", "success");
    } catch {
      toast("Tidak bisa menyalin", "error");
    }
  };

  return (
    <NotebookCard stripe="lilac" ruled className="p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-jp text-2xl text-lilac-600 dark:text-lilac-400">
          <ClickableKanji text={pattern} />
        </p>
        <Badge tone={source === "mock" ? "warn" : "leaf"}>{source === "mock" ? "Mock" : "AI"}</Badge>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <Field label="Arti">{data.meaning}</Field>
        {data.formula ? <Field label="Formula"><span className="font-jp">{data.formula}</span></Field> : null}
        {data.usage ? <Field label="Kapan dipakai">{data.usage}</Field> : null}
        {data.example ? (
          <Field label="Contoh">
            <ClickableKanji text={data.example} className="font-jp" />
          </Field>
        ) : null}
        {data.exampleMeaning ? <Field label="Arti contoh">{data.exampleMeaning}</Field> : null}
        {data.commonMistake ? <Field label="Kesalahan umum">{data.commonMistake}</Field> : null}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onSave} loading={create.isPending} disabled={!pattern || !!savedId}>
          {savedId ? "Tersimpan ✓" : "Simpan ke Catatan"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onAddHafalan} loading={addToHafalan.isPending} disabled={!savedId}>
          Tambah ke Hafalan
        </Button>
        <Link
          href={`${ROUTES.app.quiz}?type=bunpou`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-paper-200 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-paper-200/70 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600"
        >
          Buat Quiz
        </Link>
        <Button size="sm" variant="ghost" onClick={onCopy} className="ml-auto">Copy</Button>
      </div>
    </NotebookCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2">
      <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="text-ink-700 dark:text-paper-50">{children}</dd>
    </div>
  );
}
