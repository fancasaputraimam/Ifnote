"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

import { CatatanFilters } from "./components/CatatanFilters";
import { SummaryRow } from "./components/SummaryRow";
import { CatatanRow } from "./components/CatatanRow";
import { KotobaDialog } from "./components/KotobaDialog";
import { BunpouDialog } from "./components/BunpouDialog";

import {
  useCatatanList,
  type CatatanFilterType,
} from "./useCatatan";
import type { Bunpou, CatatanItem, JlptLevel, Kotoba } from "@/lib/types";
import { api } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { PanelCard } from "@/components/ui/PanelCard";

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

  // Dialog state
  const [kotobaOpen, setKotobaOpen] = useState(false);
  const [bunpouOpen, setBunpouOpen] = useState(false);
  const [kotobaTab, setKotobaTab] = useState<"manual" | "ai" | "bulk">("manual");
  const [bunpouTab, setBunpouTab] = useState<"manual" | "ai">("manual");
  const [editing, setEditing] = useState<{ type: "kotoba" | "bunpou"; id: string } | null>(null);
  const editingFull = useFullItem(editing);

  // Deep-link dari QuickActions / /app/ai redirect / Home
  //   ?add=kotoba|bunpou
  //   ?openAdd=ai-kotoba|ai-bunpou|bulk-kotoba
  useEffect(() => {
    const add = params.get("add");
    const openAdd = params.get("openAdd");
    if (add === "kotoba") setKotobaOpen(true);
    else if (add === "bunpou") setBunpouOpen(true);
    if (openAdd === "ai-kotoba") {
      setKotobaTab("ai");
      setKotobaOpen(true);
    } else if (openAdd === "bulk-kotoba") {
      setKotobaTab("bulk");
      setKotobaOpen(true);
    } else if (openAdd === "ai-bunpou") {
      setBunpouTab("ai");
      setBunpouOpen(true);
    }
    if (add || openAdd) {
      router.replace("/app/catatan", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useCatatanList({
    search: search.trim() || undefined,
    type,
    level: level ?? undefined,
    // Status filter dihapus dari Catatan UI (task PART 2). Tetap omit
    // dari query supaya backend tidak menerima status apapun.
    limit: 100,
  });

  const items = useMemo(() => list.data?.items ?? [], [list.data]);

  const summary = useMemo(() => {
    return {
      kotoba: items.filter((i) => i.noteType === "kotoba").length,
      bunpou: items.filter((i) => i.noteType === "bunpou").length,
    };
  }, [items]);

  // For AI duplicate detection inside Add dialogs.
  const existingKotobaJp = useMemo(
    () => items.filter((i) => i.noteType === "kotoba").map((i) => i.jpOrPattern),
    [items],
  );
  const existingBunpouPatterns = useMemo(
    () => items.filter((i) => i.noteType === "bunpou").map((i) => i.jpOrPattern),
    [items],
  );

  // Saran live untuk ActionSearchBar — dari item yang sudah dimuat.
  const searchSuggestions = useMemo(
    () =>
      items.map((i) => ({
        id: `${i.noteType}-${i.id}`,
        label: i.jpOrPattern,
        description: i.meaning,
        end: i.level ?? (i.noteType === "kotoba" ? "Kotoba" : "Bunpou"),
      })),
    [items],
  );

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

  const hasActiveFilter = !!search || !!level || type !== "all";
  const noResults = !list.isLoading && items.length === 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="📚 Study Notes"
        title="Catatan"
        subtitle="Gabungan kotoba, bunpou, contoh kalimat, dan review."
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 sm:flex-none"
              onClick={() => { setEditing(null); setBunpouOpen(true); }}
            >
              + Bunpou
            </Button>
            <Button
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => { setEditing(null); setKotobaOpen(true); }}
            >
              + Kotoba
            </Button>
          </>
        }
      />

      <CatatanFilters
        search={search}
        setSearch={setSearch}
        type={type}
        setType={setType}
        level={level}
        setLevel={setLevel}
        suggestions={searchSuggestions}
      />

      <SummaryRow {...summary} />

      {list.isLoading ? (
        <LoadingState label="Memuat catatan…" />
      ) : list.isError ? (
        <PanelCard tone="rose" stripe padding="compact">
          <div className="flex items-center gap-2">
            <Badge tone="warn">Mode offline</Badge>
            <p className="text-sm text-ink-700 dark:text-paper-50">
              Tidak bisa terhubung ke server. Coba lagi setelah koneksi pulih.
            </p>
          </div>
        </PanelCard>
      ) : noResults ? (
        <EmptyState
          icon="📒"
          title={hasActiveFilter ? "Tidak ada hasil" : "Catatan masih kosong"}
          description={
            hasActiveFilter
              ? "Coba ubah kata kunci atau filter."
              : "Mulai dengan menambah kotoba atau bunpou pertamamu."
          }
          action={
            !hasActiveFilter ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setKotobaTab("manual");
                    setKotobaOpen(true);
                  }}
                >
                  Tambah Kotoba
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(null);
                    setBunpouTab("manual");
                    setBunpouOpen(true);
                  }}
                >
                  Tambah Bunpou
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(null);
                    setKotobaTab("bulk");
                    setKotobaOpen(true);
                  }}
                >
                  ✨ Import Kotoba dengan AI
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
        existingJp={existingKotobaJp}
        initialTab={kotobaTab}
        onOpenSaved={(id) => {
          // Buka kotoba yang sudah tersimpan langsung di mode edit.
          setEditing({ type: "kotoba", id });
          setKotobaTab("manual");
        }}
      />
      <BunpouDialog
        open={bunpouOpen}
        onClose={onCloseDialog}
        initial={editing?.type === "bunpou" ? (editingFull.data as Bunpou | undefined) ?? null : null}
        existingPatterns={existingBunpouPatterns}
        initialTab={bunpouTab}
        onOpenSaved={(id) => {
          setEditing({ type: "bunpou", id });
          setBunpouTab("manual");
        }}
      />
    </div>
  );
}
