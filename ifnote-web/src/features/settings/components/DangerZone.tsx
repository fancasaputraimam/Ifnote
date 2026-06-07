"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { SettingsSection } from "@/components/ui/SettingsSection";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { useResetBackup } from "@/features/settings/useSettings";

export function DangerZone() {
  const reset = useResetBackup();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onReset = async () => {
    try {
      await reset.mutateAsync();
      notify.success(
        "Data direset",
        "Semua catatan, hafalan, dan progress kamu sudah dihapus.",
      );
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal mereset data",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <SettingsSection
      icon={<AlertTriangle className="h-5 w-5" />}
      title="Danger zone"
      description="Aksi di sini tidak bisa di-undo."
    >
      <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 dark:border-rose-700/40 dark:bg-rose-700/10">
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
    </SettingsSection>
  );
}
