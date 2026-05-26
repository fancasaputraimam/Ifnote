"use client";

import { useEffect, useState } from "react";

/**
 * Eyebrow + title + subtitle for the Home dashboard.
 * Subtitle adapts to local hour (greeting in Japanese + Indonesian).
 */
export function HomeHeader() {
  const [greeting, setGreeting] = useState("きょうも がんばろう");

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) setGreeting("おはようございます");
    else if (h >= 11 && h < 15) setGreeting("こんにちは");
    else if (h >= 15 && h < 18) setGreeting("こんにちは");
    else if (h >= 18 && h < 22) setGreeting("こんばんは");
    else setGreeting("おやすみなさい");
  }, []);

  return (
    <header className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-accent-600 dark:text-accent-300">
        🌸 Daily Dashboard
      </div>
      <h1 className="text-2xl font-semibold text-ink-800 dark:text-paper-50 sm:text-3xl">
        ifNote
      </h1>
      <p className="text-sm text-ink-400">
        <span className="font-jp text-ink-700 dark:text-paper-50">{greeting}</span>
        <span className="mx-1.5 text-ink-400/60">·</span>
        Belajar Jepang hari ini
      </p>
    </header>
  );
}
