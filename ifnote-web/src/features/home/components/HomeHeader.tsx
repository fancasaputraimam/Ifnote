"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_GREETING_SUBTITLE,
  getJapaneseGreeting,
} from "@/lib/japanese-greeting";

/**
 * Header Home — minimal, hanya greeting Jepang dinamis. Tidak ada
 * eyebrow "Daily Dashboard" dan tidak ada nama brand `ifNote` lagi.
 *
 * Server render pakai fallback DEFAULT_GREETING_SUBTITLE supaya tidak
 * ada hydration mismatch (jam server bisa beda dari client).
 */
export function HomeHeader() {
  const [text, setText] = useState(DEFAULT_GREETING_SUBTITLE);

  useEffect(() => {
    const update = () => setText(getJapaneseGreeting().subtitle);
    update();
    // Re-evaluate setiap jam untuk transisi pagi → siang → malam.
    const interval = setInterval(update, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="pt-1">
      <p className="font-jp text-base text-ink-700 dark:text-paper-50 sm:text-lg">
        {text}
      </p>
    </header>
  );
}
