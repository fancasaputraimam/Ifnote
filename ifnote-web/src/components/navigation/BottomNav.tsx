"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, string> = {
  Home: "🏠",
  Catatan: "📒",
  Hafalan: "🗂",
  Quiz: "🎯",
};

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className="bottom-nav-safe fixed bottom-0 left-0 right-0 z-40 w-full max-w-full overflow-x-hidden border-t border-paper-200 bg-white/95 backdrop-blur dark:border-ink-700 dark:bg-ink-800/95 md:hidden"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {BOTTOM_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium",
                  "transition-colors",
                  active
                    ? "text-accent-600 dark:text-accent-300"
                    : "text-ink-400 hover:text-ink-700 dark:hover:text-paper-50",
                )}
              >
                <span aria-hidden className="text-lg leading-none">{ICONS[item.label] ?? "•"}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
