"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DEFAULT_GREETING_SUBTITLE,
  getJapaneseGreeting,
} from "@/lib/japanese-greeting";

/**
 * Header Home (ifNote 2.0). Greeting Jepang dinamis dengan aksen kana &
 * animasi masuk. Server render pakai fallback supaya tidak hydration
 * mismatch (jam server bisa beda dari client).
 */
export function HomeHeader() {
  const [text, setText] = useState(DEFAULT_GREETING_SUBTITLE);

  useEffect(() => {
    const update = () => setText(getJapaneseGreeting().subtitle);
    update();
    const interval = setInterval(update, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative overflow-hidden rounded-notebook bg-accent-gradient-soft px-5 py-5 ring-1 ring-inset ring-accent-200/50 dark:bg-ink-800 dark:ring-ink-700 sm:px-6"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-4 select-none font-jp text-[110px] leading-none text-accent-500/[0.07] dark:text-accent-200/[0.06]"
      >
        今
      </span>
      <div className="relative">
        <p className="font-jp text-xs tracking-[0.3em] text-accent-500">ホーム</p>
        <p className="mt-1 font-jp text-lg text-ink-800 dark:text-paper-50 sm:text-xl">
          {text}
        </p>
        <p className="mt-1 text-sm text-ink-400">
          Lanjutkan belajarmu — catat, hafal, dan uji hari ini.
        </p>
      </div>
    </motion.header>
  );
}
