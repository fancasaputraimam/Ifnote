"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import { ClickableKanji } from "@/features/kanji/ClickableKanji";
import { ROUTES } from "@/lib/constants";
import type { CatatanItem, Mastery } from "@/lib/types";
import { useAddToHafalan, useDeleteBunpou, useDeleteKotoba } from "@/features/catatan/useCatatan";
import { cn } from "@/lib/utils";

interface Props {
  item: CatatanItem;
  onEdit: (item: CatatanItem) => void;
}

const masteryTone: Record<Mastery, "leaf" | "warn" | "danger"> = {
  good: "leaf",
  mid: "warn",
  weak: "danger",
};

export function CatatanRow({ item, onEdit }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const addToHafalan = useAddToHafalan();
  const deleteKotoba = useDeleteKotoba();
  const deleteBunpou = useDeleteBunpou();

  const isKotoba = item.noteType === "kotoba";
  const detail = item.detail as Record<string, unknown>;

  const onAddHafalan = async () => {
    try {
      await addToHafalan.mutateAsync({ itemType: item.noteType, itemId: item.id });
      toast("Ditambahkan ke Hafalan", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menambah ke Hafalan";
      toast(msg, "error");
    }
  };

  const onDelete = async () => {
    try {
      if (isKotoba) {
        await deleteKotoba.mutateAsync(item.id);
      } else {
        await deleteBunpou.mutateAsync(item.id);
      }
      toast("Catatan dihapus", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menghapus";
      toast(msg, "error");
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-notebook border border-paper-200 bg-white transition-colors dark:border-ink-700 dark:bg-ink-800",
        open && "shadow-notebook",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-jp text-base font-medium text-ink-800 dark:text-paper-50">
              {item.jpOrPattern}
            </span>
            <span className="truncate text-xs text-ink-400">
              {item.meaning} · {isKotoba ? "Kotoba" : "Bunpou"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {item.level ? (
            <Badge tone={isKotoba ? "accent" : "lilac"}>{item.level}</Badge>
          ) : null}
          <Badge tone={masteryTone[item.mastery]}>{item.mastery}</Badge>
          <span aria-hidden className={cn("text-ink-400 transition-transform", open && "rotate-180")}>▾</span>
        </div>
      </button>

      {open ? (
        <div className="border-t border-paper-200 px-4 py-3 text-sm dark:border-ink-700">
          {isKotoba ? (
            <KotobaDetail detail={detail} />
          ) : (
            <BunpouDetail detail={detail} />
          )}

          {item.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <Badge key={t} tone="neutral">#{t}</Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => onEdit(item)}>Edit</Button>
            <Link
              href={`${ROUTES.app.ai}?mode=${isKotoba ? "explain-kotoba" : "explain-bunpou"}&q=${encodeURIComponent(item.jpOrPattern)}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-paper-200 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-paper-200/70 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600"
            >
              AI Jelaskan
            </Link>
            <Link
              href={`${ROUTES.app.quiz}?type=${isKotoba ? "kotoba" : "bunpou"}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-paper-200 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-paper-200/70 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600"
            >
              Buat Quiz
            </Link>
            <Button
              size="sm"
              variant="secondary"
              loading={addToHafalan.isPending}
              onClick={onAddHafalan}
            >
              Tambah ke Hafalan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-700/10"
              onClick={() => setConfirmDelete(true)}
            >
              Hapus
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus catatan?"
        description={`"${item.jpOrPattern}" akan dihapus dari catatan dan Hafalan order. Aksi ini tidak bisa di-undo.`}
        confirmLabel="Hapus"
        destructive
        onConfirm={onDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// ---------- detail blocks ------------------------------------------

function KotobaDetail({ detail }: { detail: Record<string, unknown> }) {
  const beginnerExample = stringOrNull(detail.beginnerExample);
  const normalExample = stringOrNull(detail.normalExample);
  const furiganaExample = stringOrNull(detail.furiganaExample);
  const exampleMeaning = stringOrNull(detail.exampleMeaning);
  const romaji = stringOrNull(detail.romaji);
  const type = stringOrNull(detail.type);

  return (
    <dl className="space-y-2">
      {romaji ? <Field label="Romaji">{romaji}</Field> : null}
      {type ? <Field label="Jenis">{type}</Field> : null}
      {beginnerExample ? (
        <Field label="Contoh (beginner)">
          <ClickableKanji text={beginnerExample} className="font-jp" />
        </Field>
      ) : null}
      {normalExample ? (
        <Field label="Contoh (normal)">
          <ClickableKanji text={normalExample} className="font-jp" />
        </Field>
      ) : null}
      {furiganaExample ? (
        <Field label="Contoh (furigana)">
          <span className="font-jp">{furiganaExample}</span>
        </Field>
      ) : null}
      {exampleMeaning ? <Field label="Arti">{exampleMeaning}</Field> : null}
    </dl>
  );
}

function BunpouDetail({ detail }: { detail: Record<string, unknown> }) {
  const formula = stringOrNull(detail.formula);
  const usage = stringOrNull(detail.usage);
  const beginnerExample = stringOrNull(detail.beginnerExample);
  const normalExample = stringOrNull(detail.normalExample);
  const furiganaExample = stringOrNull(detail.furiganaExample);
  const exampleMeaning = stringOrNull(detail.exampleMeaning);
  const note = stringOrNull(detail.note);
  const commonMistake = stringOrNull(detail.commonMistake);

  return (
    <dl className="space-y-2">
      {formula ? <Field label="Formula"><span className="font-jp">{formula}</span></Field> : null}
      {usage ? <Field label="Kapan dipakai">{usage}</Field> : null}
      {beginnerExample ? (
        <Field label="Contoh (beginner)">
          <ClickableKanji text={beginnerExample} className="font-jp" />
        </Field>
      ) : null}
      {normalExample ? (
        <Field label="Contoh (normal)">
          <ClickableKanji text={normalExample} className="font-jp" />
        </Field>
      ) : null}
      {furiganaExample ? (
        <Field label="Contoh (furigana)">
          <span className="font-jp">{furiganaExample}</span>
        </Field>
      ) : null}
      {exampleMeaning ? <Field label="Arti">{exampleMeaning}</Field> : null}
      {note ? <Field label="Catatan">{note}</Field> : null}
      {commonMistake ? <Field label="Kesalahan umum">{commonMistake}</Field> : null}
    </dl>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2">
      <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="text-ink-700 dark:text-paper-50">{children}</dd>
    </div>
  );
}

function stringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
