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

/** Kanji pengiring tiap menu — watermark halus di pill aktif. */
const KANA: Record<string, string> = {
  Home: "家",
  Catatan: "言",
  Hafalan: "記",
  Quiz: "試",
};

/**
 * Bottom bar (Sumi & Washi): dock melayang berbentuk pil di atas konten,
 * kertas semi-transparan dengan hairline + blur. Item aktif mengembang
 * menjadi pill vermillion (accent-gradient) berisi ikon + label, dengan
 * kanji watermark; item lain cukup ikon. Transisi pakai spring layout.
 */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-40 md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center gap-1 rounded-full border border-paper-200/90 bg-white/90 p-1.5 shadow-notebook-lg backdrop-blur-xl dark:border-ink-700 dark:bg-ink-800/90">
        {BOTTOM_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICONS[item.label];
          return (
            <motion.li
              key={item.href}
              layout
              transition={{ type: "spring", stiffness: 400, damping: 34 }}
              className={cn("min-w-0", active ? "flex-[1.9]" : "flex-1")}
            >
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "relative flex h-11 items-center justify-center overflow-hidden rounded-full text-xs font-medium transition-colors",
                  active
                    ? "text-white"
                    : "text-ink-400 hover:bg-paper-100 hover:text-ink-700 dark:hover:bg-ink-700/60 dark:hover:text-paper-50",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="bottomnav-active"
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-accent-gradient shadow-glow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                ) : null}

                {active ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-0.5 top-1/2 -translate-y-1/2 select-none font-serif text-2xl leading-none text-white/15"
                  >
                    {KANA[item.label]}
                  </span>
                ) : null}

                <span className="relative flex min-w-0 items-center gap-1.5 px-2">
                  {Icon ? <Icon className="h-5 w-5 shrink-0" /> : null}
                  {active ? (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22, delay: 0.06 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  ) : (
                    <span className="sr-only">{item.label}</span>
                  )}
                </span>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
}
