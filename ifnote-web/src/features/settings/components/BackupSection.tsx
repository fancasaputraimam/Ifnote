"use client";

import { useRef, useState } from "react";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SettingsSection } from "@/components/ui/SettingsSection";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
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
      notify.success("Backup di-export", "File JSON sudah didownload.");
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal mengexport",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking same file
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () =>
      notify.error("Gagal membaca file", "Coba pilih file lain.");
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object") {
          notify.error(
            "File tidak valid",
            "Pastikan ini file backup ifNote.",
          );
          return;
        }
        // Backend expects { data: <export.data> }; accept either full export or
        // the inner `data` directly for forward-compat.
        const inner = (parsed as { data?: unknown }).data ?? parsed;
        setPendingImport({ payload: inner, replace: false });
      } catch {
        notify.error(
          "JSON tidak valid",
          "File backup ini tidak bisa dibaca.",
        );
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
      notify.success(
        "Import sukses",
        counts || "Data backup sudah dimasukkan.",
      );
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal mengimport",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    } finally {
      setPendingImport(null);
    }
  };

  return (
    <SettingsSection
      icon={<Database className="h-5 w-5" />}
      title="Backup data"
      description="Export atau import semua catatanmu sebagai file JSON. Ekspor tidak memuat password atau API key."
    >
      <div className="flex flex-wrap gap-2">
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

      {/* SATU dialog dengan tiga aksi. Dulu opsi Replace dirender di
          BELAKANG overlay ConfirmDialog sehingga mustahil diklik. */}
      <Dialog open={!!pendingImport} onOpenChange={(v) => { if (!v) setPendingImport(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Import backup?</DialogTitle>
            <DialogDescription>Pilih cara memasukkan isi file backup ini.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={importMut.isPending}
              onClick={() => void confirmImport(false)}
              className="w-full rounded-xl border border-paper-200 bg-paper-50/60 p-3.5 text-left transition-colors hover:border-accent-300 hover:bg-accent-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900/30 dark:hover:border-accent-500/50 dark:hover:bg-accent-500/10"
            >
              <div className="text-sm font-semibold text-ink-800 dark:text-paper-50">
                Append <span className="ml-1 text-xs font-normal text-ink-400">(disarankan)</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-400">
                Tambahkan isi backup ke data yang sudah ada. Tidak ada yang dihapus.
              </p>
            </button>

            <button
              type="button"
              disabled={importMut.isPending}
              onClick={() => void confirmImport(true)}
              className="w-full rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-left transition-colors hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60 dark:border-rose-700/40 dark:bg-rose-700/10 dark:hover:bg-rose-700/20"
            >
              <div className="text-sm font-semibold text-rose-700 dark:text-rose-200">Replace</div>
              <p className="mt-0.5 text-xs leading-relaxed text-rose-600/80 dark:text-rose-200/70">
                Hapus dulu <span className="font-semibold">semua data lama</span>, lalu masukkan dari
                file. Tidak bisa di-undo.
              </p>
            </button>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPendingImport(null)}
              disabled={importMut.isPending}
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
