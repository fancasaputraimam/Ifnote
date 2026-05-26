"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import { useCreateKotoba, useAddToHafalan } from "@/features/catatan/useCatatan";
import { ClickableKanji } from "@/features/kanji/ClickableKanji";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";
import type { ExplainKotobaData } from "../types";

interface Props {
  data: ExplainKotobaData;
  source: "ai" | "mock";
  /** Original input the user typed — used as fallback for `topic`. */
  fallbackJp: string;
}

export function KotobaResponseCard({ data, source, fallbackJp }: Props) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const create = useCreateKotoba();
  const addToHafalan = useAddToHafalan();

  const jp = (data.topic || fallbackJp || "").trim();

  const onSave = async () => {
    if (!jp) return;
    try {
      const created = await create.mutateAsync({
        jp,
        meaning: data.meaning,
        type: data.type || undefined,
        level: isJlptLevel(data.level) ? data.level : undefined,
        romaji: data.romaji || undefined,
        normalExample: data.example || undefined,
        exampleMeaning: data.exampleMeaning || undefined,
        mastery: "mid",
      });
      setSavedId(created.id);
      toast("Kotoba disimpan ke Catatan", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menyimpan";
      toast(msg, "error");
    }
  };

  const onAddHafalan = async () => {
    if (!savedId) {
      toast("Simpan ke Catatan dulu sebelum menambahkan ke Hafalan", "info");
      return;
    }
    try {
      await addToHafalan.mutateAsync({ itemType: "kotoba", itemId: savedId });
      toast("Ditambahkan ke Hafalan", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menambah ke Hafalan";
      toast(msg, "error");
    }
  };

  const onCopy = async () => {
    const text = [
      `${jp} — ${data.meaning}`,
      data.romaji ? `(${data.romaji})` : "",
      data.type ? `Jenis: ${data.type}` : "",
      data.level ? `Level: ${data.level}` : "",
      data.example ? `Contoh: ${data.example}` : "",
      data.exampleMeaning ? `Arti contoh: ${data.exampleMeaning}` : "",
      data.note ? `Catatan: ${data.note}` : "",
    ].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast("Tersalin ke clipboard", "success");
    } catch {
      toast("Tidak bisa menyalin (browser tidak mengizinkan)", "error");
    }
  };

  return (
    <NotebookCard stripe="accent" ruled className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-jp text-2xl text-ink-800 dark:text-paper-50">
            <ClickableKanji text={jp} />
          </p>
          {data.romaji ? (
            <p className="text-xs text-ink-400">{data.romaji}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {data.level ? <Badge tone="accent">{data.level}</Badge> : null}
          <Badge tone={source === "mock" ? "warn" : "leaf"}>{source === "mock" ? "Mock" : "AI"}</Badge>
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <Field label="Arti">{data.meaning}</Field>
        {data.type ? <Field label="Jenis">{data.type}</Field> : null}
        {data.example ? (
          <Field label="Contoh">
            <ClickableKanji text={data.example} className="font-jp" />
          </Field>
        ) : null}
        {data.exampleMeaning ? <Field label="Arti contoh">{data.exampleMeaning}</Field> : null}
        {data.note ? <Field label="Catatan">{data.note}</Field> : null}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onSave} loading={create.isPending} disabled={!jp || !!savedId}>
          {savedId ? "Tersimpan ✓" : "Simpan ke Catatan"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onAddHafalan} loading={addToHafalan.isPending} disabled={!savedId}>
          Tambah ke Hafalan
        </Button>
        <Link
          href={`${ROUTES.app.quiz}?type=kotoba`}
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

function isJlptLevel(v: unknown): v is "N5" | "N4" | "N3" | "N2" | "N1" {
  return v === "N5" || v === "N4" || v === "N3" || v === "N2" || v === "N1";
}
