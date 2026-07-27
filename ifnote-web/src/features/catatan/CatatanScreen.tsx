"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";

import { CatatanFilters } from "./components/CatatanFilters";
import { SummaryRow } from "./components/SummaryRow";
import { CatatanRow } from "./components/CatatanRow";
import { KotobaDialog } from "./components/KotobaDialog";
import { BunpouDialog } from "./components/BunpouDialog";

import {
  useCatatanCount,
  useCatatanInfinite,
  type CatatanFilterType,
} from "./useCatatan";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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

type SortKey = "terbaru" | "level" | "lemah" | "az";

const LEVEL_ORDER: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
const MASTERY_ORDER: Record<string, number> = { weak: 0, mid: 1, good: 2 };

export function CatatanScreen() {
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<CatatanFilterType>("all");
  const [level, setLevel] = useState<JlptLevel | null>(null);
  const [sort, setSort] = useState<SortKey>("terbaru");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  // Dialog state
  const [kotobaOpen, setKotobaOpen] = useState(false);
  const [bunpouOpen, setBunpouOpen] = useState(false);
  const [editing, setEditing] = useState<{ type: "kotoba" | "bunpou"; id: string } | null>(null);
  const editingFull = useFullItem(editing);

  // Deep-link dari QuickActions / /app/ai redirect / Home
  //   ?add=kotoba|bunpou
  //   ?openAdd=ai-kotoba|ai-bunpou|bulk-kotoba
  //   ?q=<teks>  → prefill pencarian (dipakai item Fokus/Terbaru di Home)
  // Semua varian AI/bulk sekarang mendarat di dialog yang sama (create =
  // tab "Dengan AI" default), jadi cukup buka dialognya.
  useEffect(() => {
    const add = params.get("add");
    const openAdd = params.get("openAdd");
    const q = params.get("q");
    if (add === "kotoba" || openAdd === "ai-kotoba" || openAdd === "bulk-kotoba") {
      setKotobaOpen(true);
    } else if (add === "bunpou" || openAdd === "ai-bunpou") {
      setBunpouOpen(true);
    }
    if (q) setSearch(q);
    if (add || openAdd || q) {
      router.replace("/app/catatan", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useCatatanInfinite({
    search: debouncedSearch || undefined,
    type,
    level: level ?? undefined,
    limit: 50,
  });

  const items = useMemo(
    () => list.data?.pages.flatMap((p) => p.items) ?? [],
    [list.data],
  );
  const listTotal = list.data?.pages[0]?.pagination.total ?? 0;

  // Total per tipe dari pagination.total (jujur walau list belum memuat
  // semua halaman). Fallback ke hitungan item termuat selagi loading.
  const kotobaTotalQ = useCatatanCount("kotoba", {
    search: debouncedSearch || undefined,
    level: level ?? undefined,
  });
  const bunpouTotalQ = useCatatanCount("bunpou", {
    search: debouncedSearch || undefined,
    level: level ?? undefined,
  });
  const summary = {
    kotoba:
      kotobaTotalQ.data ?? items.filter((i) => i.noteType === "kotoba").length,
    bunpou:
      bunpouTotalQ.data ?? items.filter((i) => i.noteType === "bunpou").length,
  };

  // Sort client-side di atas item yang sudah termuat.
  const sortedItems = useMemo(() => {
    if (sort === "terbaru") return items;
    const copy = [...items];
    if (sort === "level") {
      copy.sort(
        (a, b) =>
          (a.level ? LEVEL_ORDER[a.level] ?? 9 : 9) -
          (b.level ? LEVEL_ORDER[b.level] ?? 9 : 9),
      );
    } else if (sort === "lemah") {
      copy.sort(
        (a, b) => (MASTERY_ORDER[a.mastery] ?? 9) - (MASTERY_ORDER[b.mastery] ?? 9),
      );
    } else if (sort === "az") {
      copy.sort((a, b) => a.jpOrPattern.localeCompare(b.jpOrPattern, "ja"));
    }
    return copy;
  }, [items, sort]);

  // For AI duplicate detection inside Add dialogs.
  const existingKotobaJp = useMemo(
    () => items.filter((i) => i.noteType === "kotoba").map((i) => i.jpOrPattern),
    [items],
  );
  const existingBunpouPatterns = useMemo(
    () => items.filter((i) => i.noteType === "bunpou").map((i) => i.jpOrPattern),
    [items],
  );
  // jp/pattern + id — untuk tombol "Buka entri yang ada" pada duplikat.
  const existingKotobaItems = useMemo(
    () =>
      items
        .filter((i) => i.noteType === "kotoba")
        .map((i) => ({ jp: i.jpOrPattern, id: i.id })),
    [items],
  );
  const existingBunpouItems = useMemo(
    () =>
      items
        .filter((i) => i.noteType === "bunpou")
        .map((i) => ({ pattern: i.jpOrPattern, id: i.id })),
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
  const remaining = Math.max(0, listTotal - items.length);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2 normal-case">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            <span className="font-jp tracking-[0.28em]">ノート・きろく</span>
          </span>
        }
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
        level={level}
        setLevel={setLevel}
        suggestions={searchSuggestions}
      />

      <SummaryRow {...summary} type={type} setType={setType} />

      {/* Toolbar list: jumlah hasil + urutan */}
      {!list.isLoading && !list.isError && items.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-400">
            Menampilkan{" "}
            <span className="font-semibold text-ink-700 dark:text-paper-100">
              {items.length}
            </span>{" "}
            dari {listTotal} catatan
          </p>
          <label className="flex items-center gap-2 text-xs text-ink-400">
            Urutkan
            <Select
              aria-label="Urutkan catatan"
              value={sort}
              onChange={(e) => setSort(e.currentTarget.value as SortKey)}
              className="w-auto py-1.5 pl-3 pr-8 text-xs"
            >
              <option value="terbaru">Terbaru</option>
              <option value="level">Level N5→N1</option>
              <option value="lemah">Paling lemah dulu</option>
              <option value="az">A→Z (あ→ん)</option>
            </Select>
          </label>
        </div>
      ) : null}

      {list.isLoading ? (
        <LoadingState label="Memuat catatan…" />
      ) : list.isError ? (
        <PanelCard padding="compact">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">Mode offline</Badge>
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
                  onClick={() => { setEditing(null); setKotobaOpen(true); }}
                >
                  Tambah Kotoba
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setEditing(null); setBunpouOpen(true); }}
                >
                  Tambah Bunpou
                </Button>
              </div>
            ) : null
          }
        />
      ) : (
        <>
          <ul className="space-y-2">
            {sortedItems.map((item, i) => (
              <motion.li
                key={`${item.noteType}-${item.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  ease: "easeOut",
                  delay: Math.min(i * 0.03, 0.3),
                }}
              >
                <CatatanRow
                  item={item}
                  onEdit={onEdit}
                  onTagClick={(tag) => setSearch(tag)}
                />
              </motion.li>
            ))}
          </ul>

          {list.hasNextPage ? (
            <div className="flex justify-center pt-1">
              <Button
                variant="secondary"
                size="sm"
                loading={list.isFetchingNextPage}
                onClick={() => list.fetchNextPage()}
              >
                Muat lebih ({remaining} lagi)
              </Button>
            </div>
          ) : null}
        </>
      )}

      <KotobaDialog
        open={kotobaOpen}
        onClose={onCloseDialog}
        initial={editing?.type === "kotoba" ? (editingFull.data as Kotoba | undefined) ?? null : null}
        existingJp={existingKotobaJp}
        existingItems={existingKotobaItems}
        onOpenSaved={(id) => {
          // Buka kotoba yang sudah tersimpan langsung di mode edit.
          setEditing({ type: "kotoba", id });
        }}
      />
      <BunpouDialog
        open={bunpouOpen}
        onClose={onCloseDialog}
        initial={editing?.type === "bunpou" ? (editingFull.data as Bunpou | undefined) ?? null : null}
        existingPatterns={existingBunpouPatterns}
        existingItems={existingBunpouItems}
        onOpenSaved={(id) => {
          setEditing({ type: "bunpou", id });
        }}
      />
    </div>
  );
}
