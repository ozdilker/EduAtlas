import { createHash } from "node:crypto";

/**
 * Stable task identity for SEO actions.
 * Fingerprint must NOT include kind, priority, or recommendation text.
 */

export function normalizeSeoActionUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.startsWith("/")) {
      const pathOnly = (trimmed.split("?")[0] ?? "/").replace(/\/{2,}/g, "/");
      if (pathOnly === "/" || pathOnly === "") return "/";
      return pathOnly.replace(/\/+$/, "") || "/";
    }
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    let path = parsed.pathname.replace(/\/{2,}/g, "/");
    if (path !== "/" ) {
      path = path.replace(/\/+$/, "") || "/";
    }
    return `${parsed.protocol}//${host}${path}`;
  } catch {
    return trimmed.toLocaleLowerCase("tr-TR");
  }
}

export function normalizeSeoActionQuery(rawQuery: string): string {
  return rawQuery.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

export function seoActionSourceKeyForUrl(rawUrl: string): string {
  return `url:${normalizeSeoActionUrl(rawUrl)}`;
}

export function seoActionSourceKeyForQuery(rawQuery: string): string {
  return `query:${normalizeSeoActionQuery(rawQuery)}`;
}

/** Firestore document id — stable SHA-256 of sourceKey. */
export function seoActionFingerprintFromSourceKey(sourceKey: string): string {
  return createHash("sha256").update(sourceKey, "utf8").digest("hex");
}

export function seoActionFingerprintForUrl(rawUrl: string): string {
  return seoActionFingerprintFromSourceKey(seoActionSourceKeyForUrl(rawUrl));
}

export function seoActionFingerprintForQuery(rawQuery: string): string {
  return seoActionFingerprintFromSourceKey(seoActionSourceKeyForQuery(rawQuery));
}
