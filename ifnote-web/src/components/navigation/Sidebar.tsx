"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  NotebookPen,
  Layers,
  Target,
  Settings as SettingsIcon,
  Database,
  type LucideIcon,
} from "lucide-react";
import { BOTTOM_NAV, ROUTES } from "@/lib/constants";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Home: Home,
  Catatan: NotebookPen,
  Hafalan: Layers,
  Quiz: Target,
  Settings: SettingsIcon,
  Admin: Database,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  // On desktop, sidebar mirrors bottom nav and adds Settings link.
  const items = [
    ...BOTTOM_NAV.map((it) => ({ href: it.href, label: it.label })),
    { href: ROUTES.app.settings, label: "Settings" },
    // Admin (database viewer) hanya untuk owner.
    ...(user?.canManageAi ? [{ href: ROUTES.app.admin, label: "Admin" }] : []),
  ];

  return (
    <aside
      aria-label="Navigasi utama (sidebar)"
      className="hidden w-60 shrink-0 border-r border-paper-200/80 dark:border-ink-700 md:block"
    >
      <nav className="sticky top-[61px] py-5">
        <ul className="flex flex-col gap-1 px-3">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = ICONS[item.label];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "text-accent-700 dark:text-accent-200"
                      : "text-ink-600 hover:bg-paper-100 hover:text-ink-800 dark:text-paper-50/80 dark:hover:bg-ink-700 dark:hover:text-paper-50",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-accent-50 ring-1 ring-inset ring-accent-200/70 dark:bg-accent-500/15 dark:ring-accent-400/25"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <span
                    aria-hidden
                    className={cn(
                      "relative grid h-5 w-5 place-content-center",
                      active
                        ? "text-accent-600 dark:text-accent-300"
                        : "text-ink-400 group-hover:text-ink-600 dark:group-hover:text-paper-50",
                    )}
                  >
                    {Icon ? <Icon className="h-[18px] w-[18px]" /> : "•"}
                  </span>
                  <span className="relative">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
