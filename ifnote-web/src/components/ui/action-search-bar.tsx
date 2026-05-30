"use client";

/**
 * ActionSearchBar — animated search box dengan dropdown saran live.
 *
 * Versi ini sudah disesuaikan dengan tema ifNote (calm Japanese notebook):
 *   - palet paper / ink / accent (bukan warna neon generik)
 *   - input rounded-full konsisten dengan SearchInput lama
 *   - teks Jepang pakai font-jp
 *   - ikon lucide (Search / Send) + animasi framer-motion
 *
 * Controlled: parent memegang `query` lewat `onQueryChange`, dan menyuplai
 * daftar `actions` (mis. kotoba/bunpou yang sudah dimuat). Komponen
 * memfilter actions secara lokal berdasarkan label/description, lalu
 * memanggil `onSelect` saat user memilih satu saran.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchAction {
  id: string;
  /** Teks utama (mis. kata Jepang / pola). Dirender dengan font-jp. */
  label: string;
  /** Subteks opsional (mis. arti). */
  description?: string;
  /** Badge kanan opsional (mis. level JLPT / tipe). */
  end?: string;
  /** Ikon opsional di kiri label. */
  icon?: React.ReactNode;
}

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  /** Daftar penuh saran; komponen yang memfilter berdasar query. */
  actions: SearchAction[];
  /** Dipanggil saat user memilih satu saran. */
  onSelect?: (action: SearchAction) => void;
  placeholder?: string;
  /** Label kecil di atas input. */
  label?: string;
  className?: string;
  /** Jumlah maksimum saran yang ditampilkan. Default 6. */
  maxResults?: number;
  /** Teks footer kiri. Default "↵ untuk pilih". */
  hint?: string;
}

function useDebounce<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function ActionSearchBar({
  query,
  onQueryChange,
  actions,
  onSelect,
  placeholder = "Cari…",
  label,
  className,
  maxResults = 6,
  hint = "↵ untuk pilih",
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchAction[]>([]);
  const debounced = useDebounce(query, 200);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter saran setiap kali query (debounced) atau daftar berubah.
  useEffect(() => {
    if (!isFocused) {
      setResults([]);
      return;
    }
    const q = debounced.toLowerCase().trim();
    const filtered = (
      q
        ? actions.filter(
            (a) =>
              a.label.toLowerCase().includes(q) ||
              (a.description ?? "").toLowerCase().includes(q),
          )
        : actions
    ).slice(0, maxResults);
    setResults(filtered);
  }, [debounced, isFocused, actions, maxResults]);

  // Tutup dropdown saat klik di luar.
  useEffect(() => {
    if (!isFocused) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isFocused]);

  // Tutup dropdown saat Escape.
  useEffect(() => {
    if (!isFocused) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFocused(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFocused]);

  const containerV = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: { height: { duration: 0.3 }, staggerChildren: 0.05 },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { height: { duration: 0.2 }, opacity: { duration: 0.15 } },
    },
  };
  const itemV = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label ? (
        <label
          htmlFor="action-search"
          className="mb-1 block text-xs font-medium text-ink-400"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
        >
          <Search className="h-4 w-4" />
        </span>
        <input
          id="action-search"
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.currentTarget.value)}
          onFocus={() => setIsFocused(true)}
          className={cn(
            "block w-full rounded-full border bg-white py-2 pl-9 pr-9 text-sm text-ink-800",
            "placeholder:text-ink-400 border-paper-200 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400",
            "dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50",
          )}
        />
        <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2">
          <AnimatePresence mode="popLayout">
            {query.length > 0 ? (
              <motion.button
                type="button"
                key="clear"
                onClick={() => onQueryChange("")}
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                transition={{ duration: 0.18 }}
                aria-label="Hapus pencarian"
                className="grid h-4 w-4 place-items-center text-ink-400 hover:text-ink-700 dark:hover:text-paper-50"
              >
                ✕
              </motion.button>
            ) : (
              <motion.span
                key="hint"
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                transition={{ duration: 0.18 }}
                aria-hidden
                className="text-ink-400"
              >
                <Send className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isFocused && results.length > 0 ? (
          <motion.div
            className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-notebook border border-paper-200 bg-white shadow-notebook-md dark:border-ink-700 dark:bg-ink-800"
            variants={containerV}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <motion.ul className="py-1">
              {results.map((action) => (
                <motion.li
                  key={action.id}
                  variants={itemV}
                  layout
                  onClick={() => {
                    onSelect?.(action);
                    setIsFocused(false);
                  }}
                  className="mx-1 flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 hover:bg-paper-100 dark:hover:bg-ink-700"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {action.icon ? (
                      <span className="shrink-0 text-ink-400">{action.icon}</span>
                    ) : null}
                    <span className="truncate font-jp text-sm font-medium text-ink-800 dark:text-paper-50">
                      {action.label}
                    </span>
                    {action.description ? (
                      <span className="truncate text-xs text-ink-400">
                        {action.description}
                      </span>
                    ) : null}
                  </div>
                  {action.end ? (
                    <span className="shrink-0 rounded-full bg-paper-100 px-2 py-0.5 text-[10px] font-medium text-ink-500 dark:bg-ink-700 dark:text-paper-50/70">
                      {action.end}
                    </span>
                  ) : null}
                </motion.li>
              ))}
            </motion.ul>
            <div className="border-t border-paper-200 px-3 py-2 dark:border-ink-700">
              <div className="flex items-center justify-between text-[11px] text-ink-400">
                <span>{hint}</span>
                <span>ESC untuk tutup</span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
