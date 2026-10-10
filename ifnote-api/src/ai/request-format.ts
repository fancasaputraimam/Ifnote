/**
 * Shared AI request-format union plus host-based auto-detection.
 *
 * Kept in its own module so `ai-client.service.ts`, `config/env.ts`, and
 * `settings/dto.ts` all reference one source of truth instead of
 * re-declaring the union.
 */
export type RequestFormat = "openai" | "azure" | "anthropic" | "custom";

const ANTHROPIC_HOST = "api.anthropic.com";

/**
 * Pick the effective request format for a base URL.
 *
 * If the host is Anthropic's, force "anthropic" so an endpoint left with
 * the default "openai" format still gets Anthropic headers and defaults.
 * For every other host (or an unparseable URL) the explicitly chosen
 * format is returned unchanged. Never throws.
 */
export function resolveRequestFormat(
  baseUrl: string | null | undefined,
  format: RequestFormat,
): RequestFormat {
  if (!baseUrl) return format;
  try {
    const host = new URL(baseUrl).hostname.toLowerCase();
    if (host === ANTHROPIC_HOST) return "anthropic";
  } catch {
    // Not a valid absolute URL — respect the chosen format.
  }
  return format;
}
