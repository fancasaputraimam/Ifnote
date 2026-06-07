"use client";

import { Button } from "@/components/ui/Button";
import { UserRound } from "lucide-react";
import { SettingsSection } from "@/components/ui/SettingsSection";
import { useAuth } from "@/features/auth/AuthProvider";

export function AccountSection() {
  const { user, logout } = useAuth();

  return (
    <SettingsSection
      icon={<UserRound className="h-5 w-5" />}
      title="Akun"
      description="Informasi akunmu di ifNote."
    >
      <dl className="space-y-2 text-sm">
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
    </SettingsSection>
  );
}
