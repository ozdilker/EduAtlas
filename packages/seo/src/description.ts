const DEFAULT_MAX_LENGTH = 160;

/**
 * Normalizes and optionally truncates a meta description.
 * Ideal length per SEO-ARCHITECTURE: ~140–160 characters.
 */
export function buildDescription(
  description: string,
  options?: {
    maxLength?: number;
  },
): string {
  const normalized = description.replace(/\s+/g, " ").trim();
  const maxLength = options?.maxLength ?? DEFAULT_MAX_LENGTH;

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxLength - 1).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > Math.floor(maxLength * 0.6)) {
    return `${truncated.slice(0, lastSpace)}…`;
  }

  return `${truncated}…`;
}
