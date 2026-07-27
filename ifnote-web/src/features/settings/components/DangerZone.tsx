"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TextInput } from "@/components/ui/TextInput";
import { SettingsSection } from "@/components/ui/SettingsSection";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { useResetBackup } from "@/features/settings/useSettings";

const CONFIRM_WORD = "RESET";

export function DangerZone() {
  const reset = useResetBackup();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const close = () => {
    setConfirmOpen(false);
    setTyped("");
  };

  const onReset = async () => {
    if (typed.trim().toUpperCase() !== CONFIRM_WORD) return;
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
      close();
    }
  };

  const canConfirm = typed.trim().toUpperCase() === CONFIRM_WORD;

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

      {/* Konfirmasi berlapis: aksi paling destruktif di app butuh mengetik
          RESET — dialog ya/tidak biasa terlalu mudah salah klik. */}
      <Dialog open={confirmOpen} onOpenChange={(v) => { if (!v) close(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-rose-700 dark:text-rose-300">
              Yakin reset semua data?
            </DialogTitle>
            <DialogDescription>
              Semua kotoba, bunpou, hafalan order, quiz progress, dan kanji
              cache milikmu akan dihapus permanen. Tidak bisa di-undo.
            </DialogDescription>
          </DialogHeader>

          <TextInput
            label={`Ketik "${CONFIRM_WORD}" untuk mengkonfirmasi`}
            value={typed}
            autoFocus
            onChange={(e) => setTyped(e.currentTarget.value)}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
          />

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              Batal
            </Button>
            <Button
              variant="danger"
              disabled={!canConfirm}
              loading={reset.isPending}
              onClick={() => void onReset()}
            >
              Ya, hapus semuanya
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
