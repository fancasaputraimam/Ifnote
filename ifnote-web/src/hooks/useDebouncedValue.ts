"use client";

import { useEffect, useState } from "react";

/**
 * Debounce sebuah nilai — dipakai pencarian Catatan dan pengecekan
 * duplikat live di dialog tambah, supaya tidak satu request per ketikan.
 */
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
