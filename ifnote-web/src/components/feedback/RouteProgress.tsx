"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Client-side top progress bar yang muncul saat user klik link
 * di dalam app shell. Hilang otomatis setelah pathname berubah.
 *
 * Strategi:
 *   - Monitor `pathname` dan `searchParams` via Next.js navigation.
 *   - Sebelum target page selesai render, Next memanggil
 *     loading.tsx (kalau ada). Komponen ini melengkapi dengan
 *     bar visual yang konsisten di seluruh transisi.
 *
 * `prefers-reduced-motion`: opacity bar tetap, animasi off (lihat globals.css).
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  // Tampilkan saat target route berubah; sembunyikan setelah
  // browser commit ke layout/page baru (event microtask).
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 380);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-busy="true"
      aria-label="Memuat halaman"
      className="route-progress-bar"
    />
  );
}
