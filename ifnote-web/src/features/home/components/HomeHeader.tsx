"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  DEFAULT_GREETING_SUBTITLE,
  getJapaneseGreeting,
} from "@/lib/japanese-greeting";
import { ROUTES } from "@/lib/constants";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/** Kanji hari (日月火水木金土) untuk stempel hanko di header. */
const DAY_KANJI = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * Header Home (Sumi & Washi): band sumi-ink gelap dengan grain washi,
 * ensō di kanan, greeting Jepang dinamis, dan stempel hanko berisi
 * kanji hari ini. Server render pakai fallback supaya tidak hydration
 * mismatch (jam server bisa beda dari client).
 */
export function HomeHeader() {
  const reduce = useReducedMotion();
  const [text, setText] = useState(DEFAULT_GREETING_SUBTITLE);
  const [dayKanji, setDayKanji] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setText(getJapaneseGreeting().subtitle);
      setDayKanji(DAY_KANJI[new Date().getDay()] ?? null);
    };
    update();
    const interval = setInterval(update, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="relative overflow-hidden rounded-notebook bg-ink-gradient px-5 py-6 text-paper-50 sm:px-7"
    >
      {/* washi grain */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(247,247,246,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* ensō */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-[230px] w-[230px]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <motion.circle
          cx="100"
          cy="100"
          r="84"
          stroke="rgba(247,247,246,0.09)"
          strokeWidth="9"
          strokeLinecap="round"
          transform="rotate(-96 100 100)"
          initial={reduce ? { pathLength: 0.93 } : { pathLength: 0 }}
          animate={{ pathLength: 0.93 }}
          transition={{ duration: 1.3, ease: EASE, delay: 0.15 }}
        />
      </svg>

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            <span className="font-jp text-xs tracking-[0.3em] text-accent-300">ホーム</span>
          </div>
          <p className="mt-2 truncate font-jp text-lg text-paper-50 sm:text-xl">{text}</p>
          <p className="mt-1 text-sm text-paper-50/65">
            Lanjutkan belajarmu — catat, hafal, dan uji hari ini.
          </p>
          {/* aksi cepat — langsung buka dialog tambah di Catatan */}
          <div className="mt-3 flex flex-wrap gap-2">
            <QuickAdd href={`${ROUTES.app.catatan}?add=kotoba`}>＋ Kotoba</QuickAdd>
            <QuickAdd href={`${ROUTES.app.catatan}?add=bunpou`}>＋ Bunpou</QuickAdd>
          </div>
        </div>

        {/* hanko kanji hari ini */}
        {/* (pill aksi cepat ada di kolom kiri) */}
        {dayKanji ? (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.6, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -5 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.3 }}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-[12px] bg-accent-gradient font-serif text-2xl text-white shadow-glow-sm"
          >
            {dayKanji}
          </motion.span>
        ) : null}
      </div>
    </motion.header>
  );
}

/** Pill aksi cepat di atas band sumi-ink. */
function QuickAdd({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full bg-paper-50/10 px-3 py-1 text-xs font-medium text-paper-50/90 ring-1 ring-inset ring-paper-50/20 transition-colors hover:bg-paper-50/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
    >
      {children}
    </Link>
  );
}
