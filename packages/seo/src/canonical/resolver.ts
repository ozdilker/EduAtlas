import { isCanonicalTrackingQueryKey } from "./denylist";

export type CanonicalSearchParams =
  | Readonly<Record<string, string | string[] | undefined>>
  | URLSearchParams;

export type ResolveCanonicalInput = Readonly<{
  readonly siteUrl: string;
  /** Route pathname; incidental `?` / `#` segments are normalized. */
  readonly path?: string;
  /** Optional request query — only considered when `allowQueryKeys` is non-empty. */
  readonly searchParams?: CanonicalSearchParams;
  /**
   * Allowlist of query keys that may appear on the canonical URL.
   * Empty / omitted → strip all query params (current EduAtlas SEO behavior).
   * Tracking keys are always excluded even if listed here.
   */
  readonly allowQueryKeys?: readonly string[];
}>;

/**
 * Builds an absolute canonical URL from site origin + path (+ optional allowlisted query).
 * Does not invent routes, redirects, or slug rewrites.
 */
export function resolveCanonical(input: ResolveCanonicalInput): string {
  const origin = normalizeOrigin(input.siteUrl);
  const { pathname, pathQuery } = splitPath(input.path ?? "/");
  const normalizedPath = normalizePathname(pathname);

  const allowKeys = (input.allowQueryKeys ?? [])
    .map((key) => key.trim().toLowerCase())
    .filter((key) => key.length > 0 && !isCanonicalTrackingQueryKey(key));

  if (allowKeys.length === 0) {
    return `${origin}${normalizedPath}`;
  }

  const merged = new Map<string, string>();
  applySearchParams(merged, pathQuery);
  applySearchParams(merged, input.searchParams);

  const allowSet = new Set(allowKeys);
  const query = new URLSearchParams();
  for (const key of [...merged.keys()].sort()) {
    if (!allowSet.has(key) || isCanonicalTrackingQueryKey(key)) {
      continue;
    }
    const value = merged.get(key);
    if (value === undefined || value === "") {
      continue;
    }
    query.set(key, value);
  }

  const qs = query.toString();
  return qs ? `${origin}${normalizedPath}?${qs}` : `${origin}${normalizedPath}`;
}

/**
 * Facade matching PRD naming — MetadataEngine / buildMetadata should use this layer.
 */
export const CanonicalResolver = {
  resolve: resolveCanonical,
} as const;

function normalizeOrigin(siteUrl: string): string {
  const trimmed = siteUrl.trim().replace(/\/+$/, "");

  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    throw new Error(`Invalid siteUrl for canonical: ${siteUrl}`);
  }
}

function splitPath(path: string): { pathname: string; pathQuery: string | undefined } {
  const withoutHash = path.split("#")[0] ?? "/";
  const qIndex = withoutHash.indexOf("?");
  if (qIndex === -1) {
    return { pathname: withoutHash, pathQuery: undefined };
  }
  return {
    pathname: withoutHash.slice(0, qIndex),
    pathQuery: withoutHash.slice(qIndex + 1),
  };
}

function normalizePathname(path: string): string {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;

  if (withLeadingSlash === "/") {
    return "/";
  }

  return withLeadingSlash.replace(/\/+$/, "");
}

function applySearchParams(
  target: Map<string, string>,
  source: CanonicalSearchParams | string | undefined,
): void {
  if (!source) {
    return;
  }

  if (typeof source === "string") {
    const params = new URLSearchParams(source);
    for (const [key, value] of params.entries()) {
      target.set(key.toLowerCase(), value);
    }
    return;
  }

  if (source instanceof URLSearchParams) {
    for (const [key, value] of source.entries()) {
      target.set(key.toLowerCase(), value);
    }
    return;
  }

  for (const [key, raw] of Object.entries(source)) {
    if (raw === undefined) {
      continue;
    }
    const value = Array.isArray(raw) ? (raw[0] ?? "") : raw;
    if (value === "") {
      continue;
    }
    target.set(key.toLowerCase(), value);
  }
}
