"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { NotebookCard } from "@/components/ui/NotebookCard";

import { CatatanFilters } from "./components/CatatanFilters";
import { SummaryRow } from "./components/SummaryRow";
import { FocusCard } from "./components/FocusCard";
import { CatatanRow } from "./components/CatatanRow";
import { KotobaDialog } from "./components/KotobaDialog";
import { BunpouDialog } from "./components/BunpouDialog";

import {
  useCatatanList,
  type CatatanFilterStatus,
  type CatatanFilterType,
} from "./useCatatan";
import type { Bunpou, CatatanItem, JlptLevel, Kotoba } from "@/lib/types";
import { api } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetch the original Kotoba/Bunpou row when the user clicks "Edit", so the
 * dialog form can prefill all rich fields (the catatan list payload only
 * carries a normalised view).
 */
function useFullItem(active: { type: "kotoba" | "bunpou"; id: string } | null) {
  return useQuery<Kotoba | Bunpou>({
    queryKey: ["catatan", "full", active?.type, active?.id],
    queryFn: () => {
      if (!active) throw new Error("inactive");
      return active.type === "kotoba"
        ? api.get<Kotoba>(`/api/kotoba/${active.id}`)
        : api.get<Bunpou>(`/api/bunpou/${active.id}`);
    },
    enabled: !!active,
    staleTime: 30_000,
  });
}

export function CatatanScreen() {
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<CatatanFilterType>("all");
  const [level, setLevel] = useState<JlptLevel | null>(null);
  const [status, setStatus] = useState<CatatanFilterStatus>("all");

  // Dialog state
  const [kotobaOpen, setKotobaOpen] = useState(false);
  const [bunpouOpen, setBunpouOpen] = useState(false);
  const [editing, setEditing] = useState<{ type: "kotoba" | "bunpou"; id: string } | null>(null);
  const editingFull = useFullItem(editing);

  // Deep-link from QuickActions: /app/catatan?add=kotoba|bunpou
  useEffect(() => {
    const add = params.get("add");
    if (add === "kotoba") setKotobaOpen(true);
    else if (add === "bunpou") setBunpouOpen(true);
    if (add) {
      // Strip the param so reload doesn't re-open the dialog
      router.replace("/app/catatan", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useCatatanList({
    search: search.trim() || undefined,
    type,
    level: level ?? undefined,
    status: status === "all" ? undefined : status,
    limit: 100,
  });

  const items = list.data?.items ?? [];

  const summary = useMemo(() => {
    return {
      kotoba: items.filter((i) => i.noteType === "kotoba").length,
      bunpou: items.filter((i) => i.noteType === "bunpou").length,
      review: items.filter((i) => i.mastery === "mid" || i.mastery === "weak").length,
      weak: items.filter((i) => i.mastery === "weak").length,
    };
  }, [items]);

  const onEdit = (item: CatatanItem) => {
    setEditing({ type: item.noteType, id: item.id });
    if (item.noteType === "kotoba") setKotobaOpen(true);
    else setBunpouOpen(true);
  };

  const onCloseDialog = () => {
    setKotobaOpen(false);
    setBunpouOpen(false);
    setEditing(null);
  };

  const noResults = !list.isLoading && items.length === 0;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-accent-600 dark:text-accent-300">
          📚 Study Notes
        </div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-ink-800 dark:text-paper-50 sm:text-3xl">Catatan</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => { setEditing(null); setBunpouOpen(true); }}>
              + Bunpou
            </Button>
            <Button size="sm" onClick={() => { setEditing(null); setKotobaOpen(true); }}>
              + Kotoba
            </Button>
          </div>
        </div>
        <p className="text-sm text-ink-400">
          Gabungan kotoba, bunpou, contoh kalimat, dan review.
        </p>
      </header>

      <CatatanFilters
        search={search}
        setSearch={setSearch}
        type={type}
        setType={setType}
        level={level}
        setLevel={setLevel}
        status={status}
        setStatus={setStatus}
      />

      <SummaryRow {...summary} />

      <FocusCard weakCount={summary.weak} reviewCount={summary.review - summary.weak} />

      {list.isLoading ? (
        <LoadingState label="Memuat catatan…" />
      ) : list.isError ? (
        <NotebookCard className="p-5">
          <div className="flex items-center gap-2">
            <Badge tone="warn">Mode offline</Badge>
            <p className="text-sm text-ink-700 dark:text-paper-50">
              Tidak bisa terhubung ke server. Coba lagi setelah koneksi pulih.
            </p>
          </div>
        </NotebookCard>
      ) : noResults ? (
        <EmptyState
          icon="📒"
          title={search || level || status !== "all" ? "Tidak ada hasil" : "Catatan masih kosong"}
          description={
            search || level || status !== "all"
              ? "Coba ubah kata kunci atau filter."
              : "Mulai dengan menambah kotoba atau bunpou pertamamu."
          }
          action={
            !search && !level && status === "all" ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { setEditing(null); setKotobaOpen(true); }}>
                  Tambah Kotoba
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setEditing(null); setBunpouOpen(true); }}>
                  Tambah Bunpou
                </Button>
              </div>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${item.noteType}-${item.id}`}>
              <CatatanRow item={item} onEdit={onEdit} />
            </li>
          ))}
        </ul>
      )}

      <KotobaDialog
        open={kotobaOpen}
        onClose={onCloseDialog}
        initial={editing?.type === "kotoba" ? (editingFull.data as Kotoba | undefined) ?? null : null}
      />
      <BunpouDialog
        open={bunpouOpen}
        onClose={onCloseDialog}
        initial={editing?.type === "bunpou" ? (editingFull.data as Bunpou | undefined) ?? null : null}
      />
    </div>
  );
}
