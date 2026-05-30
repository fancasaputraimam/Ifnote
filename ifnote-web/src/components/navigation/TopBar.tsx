"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSettings } from "@/features/settings/useSettings";
import { normalizeJpMode } from "@/hooks/useJapaneseMode";
import { IconButton } from "@/components/ui/IconButton";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Props {
  /** Page-specific subtitle / breadcrumb. Optional. */
  subtitle?: string;
}

export function TopBar({ subtitle }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const settingsQ = useSettings();

  const onSettings = pathname?.startsWith(ROUTES.app.settings);

  const jpMode = normalizeJpMode(settingsQ.data?.jpMode);
  const aiModel =
    settingsQ.data?.canManageAi === true
      ? settingsQ.data.aiModelId ?? null
      : null;

  const onLogout = async () => {
    notify.info("Keluar dari akun", "Sampai jumpa lagi.", { icon: "👋" });
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-paper-200 bg-paper-50/85 backdrop-blur dark:border-ink-700 dark:bg-paper-900/85">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <Link
          href={ROUTES.app.home}
          className="flex items-center gap-2 font-semibold text-ink-800 dark:text-paper-50"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-full bg-accent-500/15 text-accent-600 dark:text-accent-300 font-jp"
          >
            ノ
          </span>
          <span>{APP_NAME}</span>
        </Link>
        {subtitle ? (
          <span className="hidden truncate text-sm text-ink-400 sm:block">— {subtitle}</span>
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label="Buka Settings"
            onClick={() => router.push(ROUTES.app.settings)}
            className={cn(onSettings && "text-accent-600 dark:text-accent-300 bg-accent-50/60 dark:bg-accent-700/20")}
          >
            ⚙️
          </IconButton>
          <ProfileDropdown
            user={{
              name: user?.name,
              email: user?.email,
              avatar: user?.avatarUrl,
              role: user?.role,
              canManageAi: user?.canManageAi,
              model: aiModel,
              jpMode,
            }}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
}
