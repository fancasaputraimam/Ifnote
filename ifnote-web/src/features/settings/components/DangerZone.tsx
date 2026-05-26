"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import { useResetBackup } from "@/features/settings/useSettings";

export function DangerZone() {
  const reset = useResetBackup();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onReset = async () => {
    try {
      await reset.mutateAsync();
      toast("Semua data kamu sudah dihapus", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menghapus data";
      toast(msg, "error");
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <NotebookCard className="border-rose-300 p-5 dark:border-rose-700/40">
      <h2 className="text-base font-semibold text-rose-700 dark:text-rose-300">
        Danger zone
      </h2>
      <p className="mt-1 text-xs text-ink-400">
        Aksi di sini tidak bisa di-undo.
      </p>

      <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 dark:border-rose-700/40 dark:bg-rose-700/10">
        <p className="text-sm text-rose-700 dark:text-rose-200">
          <span className="font-semibold">Reset data</span> menghapus semua
          kotoba, bunpou, hafalan order, quiz progress, dan kanji cache milikmu.
          Akun dan settings tetap ada — kamu masih bisa login dan mulai dari
          nol.
        </p>
        <div className="mt-3">
          <Button variant="danger" onClick={() => setConfirmOpen(true)} loading={reset.isPending}>
            Reset semua data saya
          </Button>
        </div>
      </div>

      <p className="mt-3 text-xs italic text-ink-400">
        Hapus akun belum tersedia. Kalau kamu butuh, hubungi admin.
      </p>

      <ConfirmDialog
        open={confirmOpen}
        title="Yakin reset semua data?"
        description="Aksi ini akan menghapus semua kotoba, bunpou, hafalan order, quiz progress, dan kanji cache milikmu. Tidak bisa di-undo."
        confirmLabel="Ya, reset semua"
        destructive
        onConfirm={onReset}
        onClose={() => setConfirmOpen(false)}
      />
    </NotebookCard>
  );
}
