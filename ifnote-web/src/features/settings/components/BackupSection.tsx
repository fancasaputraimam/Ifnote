"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import {
  useExportBackup,
  useImportBackup,
} from "@/features/settings/useSettings";

export function BackupSection() {
  const exportMut = useExportBackup();
  const importMut = useImportBackup();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{ payload: unknown; replace: boolean } | null>(null);

  const onExport = async () => {
    try {
      const data = await exportMut.mutateAsync();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ifnote-backup-${data.exportedAt.replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("Backup di-export", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal mengexport";
      toast(msg, "error");
    }
  };

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking same file
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => toast("Gagal membaca file", "error");
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object") {
          toast("File tidak valid", "error");
          return;
        }
        // Backend expects { data: <export.data> }; accept either full export or
        // the inner `data` directly for forward-compat.
        const inner = (parsed as { data?: unknown }).data ?? parsed;
        setPendingImport({ payload: inner, replace: false });
      } catch {
        toast("JSON tidak valid", "error");
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async (replace: boolean) => {
    if (!pendingImport) return;
    try {
      const result = await importMut.mutateAsync({ data: pendingImport.payload, replace });
      const counts = Object.entries(result.counts)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${k}: ${n}`)
        .join(" · ");
      toast(`Import sukses${counts ? ` — ${counts}` : ""}`, "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal mengimport";
      toast(msg, "error");
    } finally {
      setPendingImport(null);
    }
  };

  return (
    <NotebookCard className="p-5">
      <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
        Backup data
      </h2>
      <p className="mt-1 text-xs text-ink-400">
        Export atau import semua catatanmu sebagai file JSON. Ekspor tidak
        memuat password atau API key.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onExport} loading={exportMut.isPending}>Export Data</Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          Import Data
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onPickFile}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-ink-400">
        <Badge tone="neutral" size="sm">kotoba</Badge>
        <Badge tone="neutral" size="sm">bunpou</Badge>
        <Badge tone="neutral" size="sm">hafalan order</Badge>
        <Badge tone="neutral" size="sm">quiz progress</Badge>
        <Badge tone="neutral" size="sm">settings</Badge>
        <Badge tone="neutral" size="sm">kanji cache</Badge>
      </div>

      <ConfirmDialog
        open={!!pendingImport}
        title="Import backup?"
        description={
          "Pilih cara import:\n\n" +
          "• Append (tombol bawah dikiri) — tambahkan ke data yang sudah ada.\n" +
          "• Replace — hapus dulu semua data lama, lalu masukkan dari file."
        }
        confirmLabel="Append (default)"
        cancelLabel="Batal"
        onConfirm={() => void confirmImport(false)}
        onClose={() => setPendingImport(null)}
      />

      {/* Replace confirmation flow: open second confirm explicitly */}
      {pendingImport ? (
        <div className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-700/10 dark:text-rose-200">
          <p>
            Atau pilih <span className="font-semibold">Replace</span> kalau kamu
            mau menimpa semua data lama dengan isi backup ini.
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="danger" onClick={() => void confirmImport(true)} loading={importMut.isPending}>
              Replace
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPendingImport(null)}>
              Batal
            </Button>
          </div>
        </div>
      ) : null}
    </NotebookCard>
  );
}
