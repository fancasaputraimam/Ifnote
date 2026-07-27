"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  /** ms sampai auto logout. Dipakai untuk countdown live di footer dialog. */
  msUntilLogout: number;
  onContinue: () => void;
  onLogout: () => void;
}

/**
 * Dialog peringatan idle. Muncul tepat sebelum auto-logout untuk memberi
 * user kesempatan menahan sesi.
 *
 * Tombol:
 *   - Lanjutkan -> reset timer, tutup dialog, sesi diteruskan.
 *   - Logout    -> logout sekarang juga.
 *
 * Footer menampilkan countdown live ("akan keluar dalam 0:42") supaya
 * user tahu seberapa mendesak. Countdown di-tick di sini saja — hook
 * idle yang men-trigger autonomous logout adalah otoritas waktu
 * sebenarnya; angka di footer hanya panduan visual.
 */
export function IdleWarningDialog({
  open,
  msUntilLogout,
  onContinue,
  onLogout,
}: Props) {
  const [remaining, setRemaining] = useState(msUntilLogout);

  useEffect(() => {
    if (!open) return;
    setRemaining(msUntilLogout);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const left = Math.max(0, msUntilLogout - (Date.now() - startedAt));
      setRemaining(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [open, msUntilLogout]);

  return (
    <Modal open={open} onClose={onContinue} title="Kamu masih di sana?">
      <div className="space-y-4">
        <p className="text-sm text-ink-700 dark:text-paper-50">
          Demi keamanan, sesi akan keluar otomatis jika tidak ada aktivitas.
        </p>
        <p className="text-xs text-ink-400" aria-live="polite">
          {formatRemaining(remaining)}
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onLogout}>
            Logout
          </Button>
          <Button type="button" onClick={onContinue} autoFocus>
            Lanjutkan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Sesi akan segera berakhir";
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m > 0) {
    return `Sesi akan keluar otomatis dalam ${m} menit ${s
      .toString()
      .padStart(2, "0")} detik`;
  }
  return `Sesi akan keluar otomatis dalam ${s} detik`;
}
