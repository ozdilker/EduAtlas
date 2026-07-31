/**
 * Joins title segments with " | " and optionally appends the site brand.
 */
export function buildTitle(
  parts: string[],
  options?: {
    siteName?: string;
    includeSiteName?: boolean;
  },
): string {
  const cleaned = parts.map((part) => part.trim()).filter((part) => part.length > 0);

  if (cleaned.length === 0) {
    return options?.siteName?.trim() || "";
  }

  const includeSiteName = options?.includeSiteName ?? Boolean(options?.siteName);
  const siteName = options?.siteName?.trim();

  if (includeSiteName && siteName && cleaned[cleaned.length - 1] !== siteName) {
    return [...cleaned, siteName].join(" | ");
  }

  return cleaned.join(" | ");
}
