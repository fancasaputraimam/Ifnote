"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import { useCreateKotoba } from "@/features/catatan/useCatatan";
import { ClickableKanji } from "@/features/kanji/ClickableKanji";
import { KotobaDialog } from "@/features/catatan/components/KotobaDialog";
import type { BulkKotobaData, BulkKotobaItem } from "../types";
import type { Kotoba } from "@/lib/types";

interface Props {
  data: BulkKotobaData;
  source: "ai" | "mock";
  /** Reset back to composer (clear preview). */
  onReset: () => void;
}

export function BulkPreview({ data, source, onReset }: Props) {
  const create = useCreateKotoba();
  const [items, setItems] = useState<BulkKotobaItem[]>(data.items ?? []);
  const [confirmAll, setConfirmAll] = useState(false);
  const [editing, setEditing] = useState<Kotoba | null>(null);
  const [savedJp, setSavedJp] = useState<Set<string>>(new Set());

  const counts = useMemo(() => {
    return {
      newItems: items.filter((i) => i.status === "new").length,
      exists: items.filter((i) => i.status === "exists").length,
      manual: items.filter((i) => i.status === "manual").length,
    };
  }, [items]);

  const onAddOne = async (it: BulkKotobaItem) => {
    if (it.status !== "new") return;
    try {
      await create.mutateAsync({
        jp: it.jp,
        meaning: it.meaning ?? "",
        romaji: it.romaji || undefined,
        type: it.type || undefined,
        level: isJlptLevel(it.level) ? it.level : undefined,
        beginnerExample: it.beginnerExample || undefined,
        mastery: "mid",
      });
      setSavedJp((s) => new Set(s).add(it.jp));
      toast(`${it.jp} ditambahkan`, "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menambahkan";
      toast(msg, "error");
    }
  };

  const onIgnore = (jp: string) => {
    setItems((arr) => arr.filter((it) => it.jp !== jp));
  };

  const onAddAllNew = async () => {
    setConfirmAll(false);
    const queue = items.filter((it) => it.status === "new" && !savedJp.has(it.jp));
    let ok = 0;
    let fail = 0;
    for (const it of queue) {
      try {
        await create.mutateAsync({
          jp: it.jp,
          meaning: it.meaning ?? "",
          romaji: it.romaji || undefined,
          type: it.type || undefined,
          level: isJlptLevel(it.level) ? it.level : undefined,
          beginnerExample: it.beginnerExample || undefined,
          mastery: "mid",
        });
        setSavedJp((s) => new Set(s).add(it.jp));
        ok++;
      } catch {
        fail++;
      }
    }
    if (ok > 0) toast(`${ok} kotoba ditambahkan`, "success");
    if (fail > 0) toast(`${fail} gagal disimpan`, "error");
  };

  const onEdit = (it: BulkKotobaItem) => {
    // Open the edit dialog pre-filled but as a "new" Kotoba (not yet saved).
    // We use editing=null with default values populated via the dialog's `initial`
    // expecting a Kotoba shape; build a stand-in so prefill works.
    const stand: Kotoba = {
      id: "draft",
      jp: it.jp,
      romaji: it.romaji ?? null,
      meaning: it.meaning ?? "",
      type: it.type ?? null,
      level: isJlptLevel(it.level) ? it.level : null,
      tags: [],
      beginnerExample: it.beginnerExample ?? null,
      normalExample: null,
      furiganaExample: null,
      exampleMeaning: null,
      mastery: "mid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditing(stand);
  };

  const remainingNew = items.filter((it) => it.status === "new" && !savedJp.has(it.jp)).length;

  return (
    <NotebookCard stripe="accent" className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ink-800 dark:text-paper-50">
          Preview import
        </h3>
        <Badge tone={source === "mock" ? "warn" : "leaf"}>{source === "mock" ? "Mock" : "AI"}</Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-400">
        <Badge tone="leaf" size="sm">{counts.newItems} baru</Badge>
        <Badge tone="neutral" size="sm">{counts.exists} sudah ada</Badge>
        <Badge tone="warn" size="sm">{counts.manual} perlu manual</Badge>
        <span>· {items.length} total</span>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">
          Tidak ada item untuk di-preview.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-paper-200 dark:divide-ink-700">
          {items.map((it) => {
            const saved = savedJp.has(it.jp);
            return (
              <li key={it.jp} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-jp text-base text-ink-800 dark:text-paper-50">
                    <ClickableKanji text={it.jp} />
                  </p>
                  <StatusBadge status={saved ? "exists" : it.status} />
                </div>
                <div className="mt-1 grid grid-cols-1 gap-1 text-xs sm:grid-cols-3">
                  <p className="text-ink-700 dark:text-paper-50">{it.meaning ?? "—"}</p>
                  <p className="text-ink-400">{it.romaji ?? ""}</p>
                  <p className="text-ink-400">
                    {[it.type, it.level].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {it.beginnerExample ? (
                  <p className="mt-1 truncate font-jp text-xs text-ink-400">
                    {it.beginnerExample}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {it.status === "new" && !saved ? (
                    <Button size="sm" onClick={() => onAddOne(it)} loading={create.isPending}>
                      Tambah
                    </Button>
                  ) : null}
                  <Button size="sm" variant="secondary" onClick={() => onEdit(it)}>
                    Edit manual
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onIgnore(it.jp)}>
                    Abaikan
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => setConfirmAll(true)}
          disabled={remainingNew === 0}
        >
          Tambahkan semua yang baru ({remainingNew})
        </Button>
        <Button variant="ghost" onClick={onReset} className="ml-auto">
          Reset preview
        </Button>
      </div>

      <ConfirmDialog
        open={confirmAll}
        title={`Tambahkan ${remainingNew} kotoba?`}
        description="Semua item dengan status 'baru' akan disimpan ke Catatan dan otomatis dimasukkan ke Hafalan order."
        confirmLabel="Tambahkan semua"
        onConfirm={onAddAllNew}
        onClose={() => setConfirmAll(false)}
      />

      {/* Manual edit dialog — uses the existing KotobaDialog in create mode */}
      <KotobaDialog
        open={!!editing}
        onClose={() => {
          if (editing) setSavedJp((s) => new Set(s).add(editing.jp));
          setEditing(null);
        }}
        initial={editing && editing.id !== "draft" ? editing : null}
      />
    </NotebookCard>
  );
}

function StatusBadge({ status }: { status: "new" | "exists" | "manual" }) {
  if (status === "new") return <Badge tone="leaf">baru</Badge>;
  if (status === "exists") return <Badge tone="neutral">sudah ada</Badge>;
  return <Badge tone="warn">manual</Badge>;
}

function isJlptLevel(v: unknown): v is "N5" | "N4" | "N3" | "N2" | "N1" {
  return v === "N5" || v === "N4" || v === "N3" || v === "N2" || v === "N1";
}
