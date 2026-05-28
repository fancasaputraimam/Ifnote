/**
 * Dynamic Japanese greeting + day-of-week helper for the Home header.
 *
 * Usage:
 *   const { day, greeting, subtitle } = getJapaneseGreeting();
 *
 * Pure function. Caller passes a Date (defaults to `new Date()`) so this is
 * easy to test and easy to call from a useEffect after mount to avoid SSR
 * hydration mismatch.
 */

const DAY_JP = [
  "にちようび", // Sunday
  "げつようび", // Monday
  "かようび",   // Tuesday
  "すいようび", // Wednesday
  "もくようび", // Thursday
  "きんようび", // Friday
  "どようび",   // Saturday
] as const;

export interface JapaneseGreeting {
  /** Hari dalam Hiragana, mis. "げつようび". */
  day: string;
  /** Sapaan menurut jam lokal. */
  greeting: string;
  /** Gabungan: "きょうは [day] · [greeting]". */
  subtitle: string;
}

/**
 * Greeting rules:
 *   04:00–10:59 → おはようございます
 *   11:00–16:59 → こんにちは
 *   17:00–03:59 → こんばんは
 */
export function getJapaneseGreeting(date: Date = new Date()): JapaneseGreeting {
  const day = DAY_JP[date.getDay()] ?? "";
  const h = date.getHours();
  const greeting =
    h >= 4 && h < 11
      ? "おはようございます"
      : h >= 11 && h < 17
      ? "こんにちは"
      : "こんばんは";
  return {
    day,
    greeting,
    subtitle: `きょうは ${day} · ${greeting}`,
  };
}

/** Default subtitle dipakai server render — diganti setelah mount. */
export const DEFAULT_GREETING_SUBTITLE = "きょうも がんばろう";
