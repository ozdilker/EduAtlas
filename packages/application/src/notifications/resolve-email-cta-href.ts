/**
 * Builds an absolute app URL for email CTAs. Relative paths need a valid origin —
 * otherwise clients produce broken links like `http:///owner/onboarding`.
 */
export function resolveEmailCtaHref(
  href: string | undefined,
  siteBaseUrl: string | undefined,
  fallbackOrigin = "https://eduatlas.com.tr",
): string | undefined {
  const raw = href?.trim();
  if (!raw) {
    return undefined;
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const absolute = new URL(raw);
      if (absolute.hostname) {
        return absolute.toString();
      }
    } catch {
      // fall through to relative join
    }
  }

  const origin =
    resolveOrigin(siteBaseUrl) ?? resolveOrigin(fallbackOrigin) ?? "https://eduatlas.com.tr";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${origin}${path}`;
}

function resolveOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "") ?? "";
  if (!trimmed || trimmed === "http:" || trimmed === "https:") {
    return null;
  }
  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!url.hostname || url.hostname === "http" || url.hostname === "https") {
      return null;
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}
