"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, string> = {
  Home: "🏠",
  Catatan: "📒",
  Hafalan: "🗂",
  Quiz: "🎯",
  "AI Tutor": "🤖",
  Settings: "⚙️",
};

export function Sidebar() {
  const pathname = usePathname();
  // On desktop, sidebar mirrors bottom nav and adds Settings link.
  const items = [
    ...BOTTOM_NAV.map((it) => ({ href: it.href, label: it.label })),
    { href: ROUTES.app.settings, label: "Settings" },
  ];

  return (
    <aside
      aria-label="Navigasi utama (sidebar)"
      className="hidden md:block w-56 shrink-0 border-r border-paper-200 dark:border-ink-700"
    >
      <nav className="sticky top-[57px] py-4">
        <ul className="flex flex-col gap-1 px-3">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent-50 text-accent-700 dark:bg-accent-700/20 dark:text-accent-200"
                      : "text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
                  )}
                >
                  <span aria-hidden>{ICONS[item.label] ?? "•"}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
