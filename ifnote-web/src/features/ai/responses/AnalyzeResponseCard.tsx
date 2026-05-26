"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import {
  useCreateBunpou,
  useCreateKotoba,
  useAddToHafalan,
} from "@/features/catatan/useCatatan";
import { ClickableKanji } from "@/features/kanji/ClickableKanji";
import { ROUTES } from "@/lib/constants";
import type { AnalyzeSentenceData } from "../types";

interface Props {
  data: AnalyzeSentenceData;
  source: "ai" | "mock";
}

export function AnalyzeResponseCard({ data, source }: Props) {
  const createKotoba = useCreateKotoba();
  const createBunpou = useCreateBunpou();
  const addToHafalan = useAddToHafalan();
  const [savingHafalan, setSavingHafalan] = useState(false);

  const onSaveBunpou = async () => {
    if (!data.bunpouFound || data.bunpouFound.length === 0) return;
    let ok = 0; let fail = 0;
    for (const b of data.bunpouFound) {
      try {
        await createBunpou.mutateAsync({
          pattern: b.pattern,
          meaning: b.meaning,
          mastery: "mid",
        });
        ok++;
      } catch { fail++; }
    }
    if (ok) toast(`${ok} bunpou disimpan`, "success");
    if (fail) toast(`${fail} gagal disimpan`, "error");
  };

  const onSaveKotoba = async () => {
    if (!data.kotobaFound || data.kotobaFound.length === 0) return;
    let ok = 0; let fail = 0;
    for (const k of data.kotobaFound) {
      try {
        await createKotoba.mutateAsync({
          jp: k.jp,
          meaning: k.meaning,
          mastery: "mid",
        });
        ok++;
      } catch { fail++; }
    }
    if (ok) toast(`${ok} kotoba disimpan`, "success");
    if (fail) toast(`${fail} gagal disimpan`, "error");
  };

  const onAddAllToHafalan = async () => {
    setSavingHafalan(true);
    let ok = 0; let fail = 0;
    try {
      // Create then immediately append. We pull fresh ids from the create result.
      for (const k of data.kotobaFound ?? []) {
        try {
          const created = await createKotoba.mutateAsync({ jp: k.jp, meaning: k.meaning, mastery: "mid" });
          await addToHafalan.mutateAsync({ itemType: "kotoba", itemId: created.id });
          ok++;
        } catch (e) {
          // 409 (already exists) is fine; surface other failures
          if (e instanceof ApiError && e.status === 409) continue;
          fail++;
        }
      }
      for (const b of data.bunpouFound ?? []) {
        try {
          const created = await createBunpou.mutateAsync({ pattern: b.pattern, meaning: b.meaning, mastery: "mid" });
          await addToHafalan.mutateAsync({ itemType: "bunpou", itemId: created.id });
          ok++;
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) continue;
          fail++;
        }
      }
      if (ok) toast(`${ok} item dimasukkan Hafalan`, "success");
      if (fail) toast(`${fail} gagal`, "error");
    } finally {
      setSavingHafalan(false);
    }
  };

  const onCopy = async () => {
    const text = [
      `Kalimat: ${data.sentence}`,
      `Arti: ${data.meaning}`,
      ...(data.bunpouFound ?? []).map((b) => `Bunpou: ${b.pattern} — ${b.meaning}`),
      ...(data.kotobaFound ?? []).map((k) => `Kotoba: ${k.jp} — ${k.meaning}`),
      ...(data.particles ?? []).map((p) => `Partikel ${p.symbol}: ${p.role}`),
      ...(data.recommendations ?? []).map((r) => `Saran: ${r}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast("Tersalin", "success");
    } catch {
      toast("Tidak bisa menyalin", "error");
    }
  };

  return (
    <NotebookCard stripe="lilac" ruled className="p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-ink-800 dark:text-paper-50">
          Analisa kalimat
        </h3>
        <Badge tone={source === "mock" ? "warn" : "leaf"}>{source === "mock" ? "Mock" : "AI"}</Badge>
      </div>

      <p className="mt-2 font-jp text-lg text-ink-800 dark:text-paper-50">
        <ClickableKanji text={data.sentence} />
      </p>
      {data.meaning ? (
        <p className="mt-1 text-sm text-ink-400">{data.meaning}</p>
      ) : null}

      {data.bunpouFound && data.bunpouFound.length > 0 ? (
        <div className="mt-3">
          <h4 className="text-xs uppercase tracking-wide text-ink-400">Bunpou ditemukan</h4>
          <ul className="mt-1 space-y-1 text-sm">
            {data.bunpouFound.map((b, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span className="font-jp text-ink-800 dark:text-paper-50">{b.pattern}</span>
                <span className="truncate text-ink-400">{b.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.kotobaFound && data.kotobaFound.length > 0 ? (
        <div className="mt-3">
          <h4 className="text-xs uppercase tracking-wide text-ink-400">Kotoba ditemukan</h4>
          <ul className="mt-1 space-y-1 text-sm">
            {data.kotobaFound.map((k, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span className="font-jp text-ink-800 dark:text-paper-50">
                  <ClickableKanji text={k.jp} />
                </span>
                <span className="truncate text-ink-400">{k.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.particles && data.particles.length > 0 ? (
        <div className="mt-3">
          <h4 className="text-xs uppercase tracking-wide text-ink-400">Partikel</h4>
          <ul className="mt-1 space-y-1 text-sm">
            {data.particles.map((p, i) => (
              <li key={i}>
                <span className="font-jp text-ink-800 dark:text-paper-50">{p.symbol}</span>
                <span className="ml-2 text-ink-400">{p.role}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.recommendations && data.recommendations.length > 0 ? (
        <div className="mt-3 rounded-xl bg-paper-50/60 px-3 py-2 dark:bg-ink-900/30">
          <h4 className="text-xs uppercase tracking-wide text-ink-400">Saran lanjutan</h4>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-700 dark:text-paper-50">
            {data.recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={onSaveBunpou}
          disabled={!data.bunpouFound?.length}
          loading={createBunpou.isPending && !savingHafalan}
        >
          Simpan Bunpou
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onSaveKotoba}
          disabled={!data.kotobaFound?.length}
          loading={createKotoba.isPending && !savingHafalan}
        >
          Simpan Kotoba Baru
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onAddAllToHafalan}
          loading={savingHafalan}
          disabled={!(data.bunpouFound?.length || data.kotobaFound?.length)}
        >
          Add to Hafalan
        </Button>
        <LinkButton size="sm" variant="secondary" href={ROUTES.app.quiz}>
          Generate Quiz
        </LinkButton>
        <Button size="sm" variant="ghost" onClick={onCopy} className="ml-auto">
          Copy
        </Button>
      </div>
    </NotebookCard>
  );
}
