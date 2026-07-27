"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PanelCard } from "@/components/ui/PanelCard";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { cn } from "@/lib/utils";
import {
  useAdminTables,
  useAdminRows,
  useAdminDeleteRow,
  fetchFullExport,
  importFullDb,
} from "./useAdmin";

const PAGE_SIZE = 25;

/**
 * Admin / database viewer (owner-only). Server sudah menolak non-owner
 * (403), tapi UI juga menyaring: hanya owner yang melihat panel ini —
 * selain itu tampilkan pesan akses ditolak.
 */
export function AdminScreen() {
  const { user } = useAuth();
  const tablesQ = useAdminTables();
  const [active, setActive] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const rowsQ = useAdminRows(active, page, PAGE_SIZE);
  const del = useAdminDeleteRow(active ?? "");
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [pendingImport, setPendingImport] = useState<Record<string, unknown[]> | null>(null);

  const tables = tablesQ.data?.tables ?? [];
  const totalPages = useMemo(() => {
    const t = rowsQ.data?.pagination.total ?? 0;
    return Math.max(1, Math.ceil(t / PAGE_SIZE));
  }, [rowsQ.data]);

  // Non-owner guard di UI (defense in depth — server tetap 403).
  if (user && user.canManageAi === false) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="🔒 Admin" title="Database Viewer" />
        <EmptyState
          icon="🔒"
          title="Akses ditolak"
          description="Halaman ini hanya untuk owner."
        />
      </div>
    );
  }

  const onSelect = (name: string) => {
    setActive(name);
    setPage(1);
  };

  const onDelete = async (id: string) => {
    try {
      await del.mutateAsync(id);
      notify.success("Baris dihapus", "Data sudah dihapus dari tabel.", { icon: "🗑" });
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menghapus",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    } finally {
      setConfirmDel(null);
    }
  };

  // --- Full DB export: unduh dump JSON semua tabel ---
  const onExport = async () => {
    setBusy("export");
    try {
      const dump = await fetchFullExport();
      const stamp = (dump.meta.exportedAt ?? "").replace(/[:.]/g, "-").slice(0, 19) || "export";
      const blob = new Blob([JSON.stringify(dump, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ifnote-full-db-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify.success("Database di-export", "File JSON sudah diunduh. Simpan dengan aman — berisi data sensitif.", { icon: "🗄" });
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal export",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    } finally {
      setBusy(null);
    }
  };

  // --- Pilih file → parse → minta konfirmasi sebelum import ---
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset supaya file sama bisa dipilih ulang
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          data?: Record<string, unknown[]>;
        };
        if (!parsed.data || typeof parsed.data !== "object") {
          notify.error("File tidak valid", "Format bukan export full-db ifNote.");
          return;
        }
        setPendingImport(parsed.data);
      } catch {
        notify.error("Gagal membaca file", "Pastikan file JSON hasil export.");
      }
    };
    reader.readAsText(file);
  };

  const onConfirmImport = async () => {
    if (!pendingImport) return;
    setBusy("import");
    try {
      const r = await importFullDb(pendingImport);
      const total = Object.values(r.counts).reduce((s, c) => s + c.ok, 0);
      qc.invalidateQueries({ queryKey: ["admin"] });
      notify.success("Import selesai", `${total} baris ter-merge ke database.`, { icon: "✅" });
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal import",
        message: "Periksa file & coba lagi.",
      });
      notify[m.variant](m.title, m.message);
    } finally {
      setBusy(null);
      setPendingImport(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="🗄 Admin"
        title="Database Viewer"
        subtitle="Lihat & kelola isi PostgreSQL. Kolom rahasia (password, API key) disensor."
      />

      {/* Toolbar export / import full-database (untuk pindah server) */}
      <PanelCard padding="compact" className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink-800 dark:text-paper-50">
            Export / Import Database
          </div>
          <p className="mt-0.5 text-xs text-ink-400">
            Cadangan penuh semua tabel & user (termasuk login & API key terenkripsi)
            untuk pindah server. Import bersifat merge (upsert). File sangat sensitif.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="secondary" loading={busy === "export"} onClick={onExport}>
            ⬇ Export
          </Button>
          <Button
            size="sm"
            variant="secondary"
            loading={busy === "import"}
            onClick={() => fileRef.current?.click()}
          >
            ⬆ Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onPickFile}
          />
        </div>
      </PanelCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
        {/* Daftar tabel */}
        <aside className="space-y-1">
          {tablesQ.isLoading ? (
            <LoadingState label="Memuat tabel…" />
          ) : (
            tables.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => onSelect(t.name)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  "active:scale-[0.98] motion-reduce:active:scale-100",
                  active === t.name
                    ? "border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-700/25 dark:text-accent-200"
                    : "border-paper-200 text-ink-700 hover:bg-paper-100 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50 dark:hover:bg-ink-700",
                )}
              >
                <span className="flex items-center gap-1.5 truncate">
                  {t.label}
                  {t.hasSecrets ? <span title="Punya kolom rahasia">🔒</span> : null}
                </span>
                <Badge tone="neutral" size="sm">{t.count}</Badge>
              </button>
            ))
          )}
        </aside>

        {/* Viewer baris */}
        <section className="min-w-0">
          {!active ? (
            <EmptyState
              icon="🗄"
              title="Pilih tabel"
              description="Klik salah satu tabel di kiri untuk melihat isinya."
            />
          ) : rowsQ.isLoading ? (
            <LoadingState label="Memuat baris…" />
          ) : rowsQ.isError ? (
            <PanelCard padding="compact">
              <p className="text-sm text-ink-700 dark:text-paper-50">
                Gagal memuat data. Pastikan kamu owner dan server aktif.
              </p>
            </PanelCard>
          ) : (rowsQ.data?.rows.length ?? 0) === 0 ? (
            <EmptyState icon="📭" title="Tabel kosong" description="Belum ada baris." />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink-800 dark:text-paper-50">
                  {rowsQ.data?.label}{" "}
                  <span className="text-ink-400">
                    · {rowsQ.data?.pagination.total} baris
                  </span>
                </h2>
              </div>

              <div className="overflow-x-auto rounded-notebook border border-paper-200 dark:border-ink-700">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-paper-100 dark:bg-ink-700">
                    <tr>
                      {(rowsQ.data?.columns ?? []).map((c) => (
                        <th
                          key={c}
                          className="whitespace-nowrap px-3 py-2 font-semibold uppercase tracking-wide text-ink-400"
                        >
                          {c}
                        </th>
                      ))}
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-200 dark:divide-ink-700">
                    {(rowsQ.data?.rows ?? []).map((row, i) => (
                      <tr
                        key={String(row.id ?? i)}
                        className="bg-white align-top hover:bg-paper-50 dark:bg-ink-800 dark:hover:bg-ink-700/50"
                      >
                        {(rowsQ.data?.columns ?? []).map((c) => (
                          <td
                            key={c}
                            className="max-w-[260px] truncate px-3 py-2 text-ink-700 dark:text-paper-50"
                            title={formatCell(row[c])}
                          >
                            {formatCell(row[c])}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          {typeof row.id === "string" ? (
                            <button
                              type="button"
                              onClick={() => setConfirmDel(row.id as string)}
                              className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-700/10"
                            >
                              Hapus
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-2 text-xs text-ink-400">
                <span>
                  Halaman {rowsQ.data?.pagination.page} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Sebelumnya
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Berikutnya →
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        title="Hapus baris ini?"
        description="Tindakan ini permanen dan bisa menghapus data terkait (cascade). Lanjutkan?"
        confirmLabel="Hapus"
        cancelLabel="Batal"
        destructive
        onConfirm={() => confirmDel && onDelete(confirmDel)}
        onClose={() => setConfirmDel(null)}
      />

      <ConfirmDialog
        open={!!pendingImport}
        title="Import database ini?"
        description="Baris dari file akan di-merge (upsert by id) ke database saat ini — data yang sudah ada akan diperbarui, yang baru ditambahkan. Pastikan file berasal dari sumber tepercaya."
        confirmLabel="Import sekarang"
        cancelLabel="Batal"
        onConfirm={onConfirmImport}
        onClose={() => setPendingImport(null)}
      />
    </div>
  );
}

/** Tampilkan sel apa adanya tapi ringkas: object → JSON, null → "—". */
function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
