"use client";

import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { useAuth } from "@/features/auth/AuthProvider";

export function AccountSection() {
  const { user, logout } = useAuth();

  return (
    <NotebookCard className="p-5">
      <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
        Akun
      </h2>
      <p className="mt-1 text-xs text-ink-400">
        Informasi akunmu di ifNote.
      </p>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="grid grid-cols-[7rem_1fr] gap-2">
          <dt className="text-xs uppercase tracking-wide text-ink-400">Nama</dt>
          <dd className="text-ink-700 dark:text-paper-50">{user?.name || "—"}</dd>
        </div>
        <div className="grid grid-cols-[7rem_1fr] gap-2">
          <dt className="text-xs uppercase tracking-wide text-ink-400">Email</dt>
          <dd className="text-ink-700 dark:text-paper-50">{user?.email || "—"}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => void logout()}>
          Keluar
        </Button>
      </div>
    </NotebookCard>
  );
}
