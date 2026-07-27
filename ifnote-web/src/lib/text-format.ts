/**
 * Text formatter helpers for Catatan / Bunpou detail views.
 *
 * Backend & AI provider sometimes return long compound paragraphs
 * (especially `commonMistake` / `usage`) that look ugly when dropped
 * straight into a card. These helpers normalize them into clean
 * lists/paragraphs that the React components can render predictably.
 *
 * Pure functions, no React, easy to unit-test.
 */

/**
 * Strip whitespace and collapse multiple internal spaces.
 */
export function cleanDisplayText(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Split into paragraphs by blank line OR sentence terminators that look
 * like real boundaries (period+space, Japanese 。 followed by space).
 *
 * Returns trimmed, non-empty paragraphs only.
 */
export function splitParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  // Prefer real blank-line separation if author wrote it that way.
  const blankSplit = text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (blankSplit.length > 1) return blankSplit;

  // Fallback: split by sentence-ending punctuation followed by a space.
  // We keep the punctuation attached to the sentence it terminates.
  const sentences = text
    .replace(/\r/g, "")
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences;
}

/**
 * Detect numbered patterns ("1.", "1)", "1)") at start of segments and
 * return the cleaned items in order. If no numbered structure exists,
 * fall back to splitting on newlines or on " ; " separators.
 *
 * Example:
 *   "1. menggunakan subjek berbeda 2. menggunakan bentuk te-form 3. ..."
 *   → ["menggunakan subjek berbeda", "menggunakan bentuk te-form", "..."]
 */
export function splitNumberedList(
  text: string | null | undefined,
): string[] {
  if (!text) return [];
  const trimmed = text.trim();

  // Pattern: digits + dot/paren followed by content, repeated.
  // Anchor at start-of-string OR whitespace to avoid matching "Pasal 1.5".
  const numberedPattern = /(?:^|\s)(\d{1,2})[.)]\s+/g;
  const matches: { index: number; n: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = numberedPattern.exec(trimmed)) !== null) {
    // The match index points at the leading whitespace; advance past
    // the digit+punct+space so we capture only the actual content.
    const headLen = m[0].length;
    matches.push({
      index: m.index + (m.index === 0 ? 0 : 1) + (headLen - (m.index === 0 ? 0 : 1)),
      n: Number.parseInt(m[1], 10),
    });
  }

  if (matches.length >= 2) {
    const items: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index - 1 : trimmed.length;
      const slice = trimmed.slice(start, end).trim();
      if (slice) items.push(stripTrailingNumber(slice));
    }
    return items;
  }

  // Fallback: explicit newlines.
  if (/\n/.test(trimmed)) {
    return trimmed
      .split(/\r?\n+/)
      .map((s) => s.replace(/^\s*[-*•]\s+/, "").trim())
      .filter(Boolean);
  }

  // Fallback: semicolon-separated.
  if (trimmed.includes(";")) {
    return trimmed
      .split(/\s*;\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Single item — caller can decide if it's a list-of-one or paragraph.
  return [trimmed];
}

/**
 * Specialized helper for Bunpou `commonMistake` field. Same as
 * `splitNumberedList` but always returns at least one entry, and
 * cleans up boilerplate prefixes like "SALAH:" / "BENAR:" that the
 * AI tends to inline.
 */
export function formatCommonMistakes(
  text: string | null | undefined,
): string[] {
  const items = splitNumberedList(text);
  return items
    .map((s) => s.replace(/^(SALAH|WRONG|BENAR|RIGHT)\s*[:：]\s*/i, ""))
    .filter(Boolean);
}

/**
 * Some AI outputs trail with a stray digit when the next bullet's
 * leading number bleeds into the previous slice. Strip it.
 */
function stripTrailingNumber(s: string): string {
  return s.replace(/\s+\d{1,2}[.)]?\s*$/, "").trim();
}
