"use client";

import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { SettingsSection } from "@/components/ui/SettingsSection";
import { useAuth } from "@/features/auth/AuthProvider";
import { getInitials } from "@/components/ui/profile-dropdown";
import { ROUTES } from "@/lib/constants";

export function AccountSection() {
  const { user, logout } = useAuth();

  const name = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const isOwner = (user?.role ?? "").toLowerCase() === "owner";

  return (
    <SettingsSection
      icon={<UserRound className="h-5 w-5" />}
      title="Akun"
      description="Informasi akunmu di ifNote."
    >
      <div className="flex items-center gap-3">
        {/* avatar stempel hanko — konsisten dengan dropdown profil */}
        <span className="grid h-12 w-12 shrink-0 -rotate-3 place-items-center overflow-hidden rounded-[11px] bg-accent-gradient text-sm font-semibold uppercase text-white shadow-glow-sm">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            getInitials(user?.name?.trim() || user?.email || "User")
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-serif text-base font-semibold text-ink-800 dark:text-paper-50">
              {name}
            </span>
            {isOwner ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent-700 ring-1 ring-inset ring-accent-200 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30">
                <span aria-hidden className="font-serif">主</span> Owner
              </span>
            ) : null}
          </div>
          <p className="truncate text-sm text-ink-400">{user?.email || "—"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <LinkButton size="sm" variant="secondary" href={ROUTES.app.profile}>
          Buka Profil
        </LinkButton>
        <Button size="sm" variant="ghost" onClick={() => void logout()}>
          Keluar
        </Button>
      </div>
    </SettingsSection>
  );
}
