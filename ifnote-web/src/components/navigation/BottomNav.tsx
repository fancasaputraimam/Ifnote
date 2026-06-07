"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, NotebookPen, Layers, Target, type LucideIcon } from "lucide-react";
import { BOTTOM_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Home: Home,
  Catatan: NotebookPen,
  Hafalan: Layers,
  Quiz: Target,
};

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className="bottom-nav-safe fixed bottom-0 left-0 right-0 z-40 w-full max-w-full overflow-x-hidden border-t border-paper-200/80 bg-white/85 backdrop-blur-xl dark:border-ink-700 dark:bg-ink-900/85 md:hidden"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2 py-1">
        {BOTTOM_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICONS[item.label];
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "text-accent-600 dark:text-accent-300"
                    : "text-ink-400 hover:text-ink-700 dark:hover:text-paper-50",
                )}
              >
                <span
                  aria-hidden
                  className="relative grid h-8 w-12 place-content-center"
                >
                  {active ? (
                    <motion.span
                      layoutId="bottomnav-active"
                      className="absolute inset-0 rounded-full bg-accent-50 dark:bg-accent-500/15"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative">
                    {Icon ? <Icon className="h-5 w-5" /> : "•"}
                  </span>
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
