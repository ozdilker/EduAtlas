/**
 * Builds an absolute canonical URL from site origin + path.
 * Strips query strings and hash fragments from the path.
 */
export function buildCanonical(siteUrl: string, path = "/"): string {
  const origin = normalizeOrigin(siteUrl);
  const pathname = normalizePath(path);
  return `${origin}${pathname}`;
}

function normalizeOrigin(siteUrl: string): string {
  const trimmed = siteUrl.trim().replace(/\/+$/, "");

  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    throw new Error(`Invalid siteUrl for canonical: ${siteUrl}`);
  }
}

function normalizePath(path: string): string {
  const withoutQuery = path.split("?")[0]?.split("#")[0] ?? "/";
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;

  if (withLeadingSlash === "/") {
    return "/";
  }

  return withLeadingSlash.replace(/\/+$/, "");
}
