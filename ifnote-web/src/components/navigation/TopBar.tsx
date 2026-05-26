"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { useAuth } from "@/features/auth/AuthProvider";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

interface Props {
  /** Page-specific subtitle / breadcrumb. Optional. */
  subtitle?: string;
}

export function TopBar({ subtitle }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const onSettings = pathname?.startsWith(ROUTES.app.settings);

  return (
    <header className="sticky top-0 z-30 border-b border-paper-200 bg-paper-50/85 backdrop-blur dark:border-ink-700 dark:bg-paper-900/85">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <Link
          href={ROUTES.app.home}
          className="flex items-center gap-2 font-semibold text-ink-800 dark:text-paper-50"
        >
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-accent-500/15 text-accent-600 dark:text-accent-300 font-jp">
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex h-8 items-center gap-1 rounded-full px-2 text-sm font-medium text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-paper-200 text-xs uppercase dark:bg-ink-700">
                {(user?.name || user?.email || "?").charAt(0)}
              </span>
              <span className="hidden max-w-[10ch] truncate sm:block">{user?.name || user?.email || "—"}</span>
            </button>
            {menuOpen ? (
              <div
                role="menu"
                onMouseLeave={() => setMenuOpen(false)}
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-notebook border border-paper-200 bg-white shadow-notebook-md dark:border-ink-700 dark:bg-ink-800"
              >
                <div className="border-b border-paper-200 px-4 py-3 dark:border-ink-700">
                  <div className="text-sm font-semibold text-ink-800 dark:text-paper-50">
                    {user?.name || user?.email || "Pengguna"}
                  </div>
                  {user?.email ? (
                    <div className="text-xs text-ink-400">{user.email}</div>
                  ) : null}
                </div>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(ROUTES.app.settings);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-paper-100 dark:hover:bg-ink-700"
                >
                  Settings
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-700/10"
                >
                  Keluar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
