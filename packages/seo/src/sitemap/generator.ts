import {
  categoriesSitemapProvider,
  citiesSitemapProvider,
  cityTypesSitemapProvider,
  districtsSitemapProvider,
  institutionsSitemapProvider,
  pagesSitemapProvider,
} from "./providers";
import {
  SITEMAP_KINDS,
  SITEMAP_MAX_URLS_PER_FILE,
  type SitemapBuildResult,
  type SitemapChildRef,
  type SitemapKind,
  type SitemapProvider,
  type SitemapSnapshot,
  type SitemapUrlEntry,
} from "./types";

const DEFAULT_PROVIDERS: readonly SitemapProvider[] = Object.freeze([
  pagesSitemapProvider,
  citiesSitemapProvider,
  districtsSitemapProvider,
  categoriesSitemapProvider,
  cityTypesSitemapProvider,
  institutionsSitemapProvider,
]);

function chunkEntries(
  entries: readonly SitemapUrlEntry[],
  maxPerFile: number,
): readonly (readonly SitemapUrlEntry[])[] {
  if (entries.length === 0) {
    return [Object.freeze([])];
  }

  const chunks: SitemapUrlEntry[][] = [];
  for (let i = 0; i < entries.length; i += maxPerFile) {
    chunks.push(entries.slice(i, i + maxPerFile));
  }
  return Object.freeze(chunks.map((chunk) => Object.freeze(chunk)));
}

function childFileName(kind: SitemapKind, chunkIndex: number, chunkCount: number): string {
  if (kind !== "institutions" || chunkCount === 1) {
    return `${kind}.xml`;
  }
  // First chunk keeps institutions.xml; further chunks are institutions-2.xml, ...
  if (chunkIndex === 0) {
    return "institutions.xml";
  }
  return `institutions-${chunkIndex + 1}.xml`;
}

function maxLastmod(entries: readonly SitemapUrlEntry[], fallback: string): string {
  let max = fallback;
  for (const entry of entries) {
    if (entry.lastmod && entry.lastmod > max) {
      max = entry.lastmod;
    }
  }
  return max;
}

export type BuildSitemapOptions = {
  providers?: readonly SitemapProvider[];
  maxUrlsPerFile?: number;
};

/**
 * Collects provider entries, chunks oversized kinds, and builds index child refs.
 */
export function buildSitemapDocuments(
  snapshot: SitemapSnapshot,
  options: BuildSitemapOptions = {},
): SitemapBuildResult {
  const providers = options.providers ?? DEFAULT_PROVIDERS;
  const maxUrlsPerFile = options.maxUrlsPerFile ?? SITEMAP_MAX_URLS_PER_FILE;

  const byKind = new Map<SitemapKind, readonly SitemapUrlEntry[]>();
  for (const kind of SITEMAP_KINDS) {
    byKind.set(kind, Object.freeze([]));
  }

  for (const provider of providers) {
    byKind.set(provider.id, Object.freeze([...provider.collect(snapshot)]));
  }

  const children: SitemapChildRef[] = [];
  const urlsets = new Map<string, readonly SitemapUrlEntry[]>();

  for (const kind of SITEMAP_KINDS) {
    const entries = byKind.get(kind) ?? [];
    const shouldChunk = kind === "institutions";
    const chunks = shouldChunk ? chunkEntries(entries, maxUrlsPerFile) : [entries];

    // Skip empty non-pages kinds? Spec: still emit empty urlsets for consistency
    // so crawlers find the file. Keep empty children for discoverability of structure.
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i] ?? [];
      // For non-institution empty kinds with zero supply, omit from index (except pages).
      if (kind !== "pages" && kind !== "institutions" && chunk.length === 0) {
        continue;
      }
      // Institutions with zero published: still emit empty institutions.xml so index is stable.
      if (kind === "institutions" && chunk.length === 0 && i > 0) {
        continue;
      }

      const name = childFileName(kind, i, chunks.length);
      const path = `/sitemaps/${name}`;
      const lastmod = maxLastmod(chunk, snapshot.generatedAt);

      children.push(
        Object.freeze({
          name,
          path,
          lastmod,
        }),
      );
      urlsets.set(name, chunk);
    }
  }

  return Object.freeze({
    children: Object.freeze(children),
    urlsets,
  });
}

export function getDefaultSitemapProviders(): readonly SitemapProvider[] {
  return DEFAULT_PROVIDERS;
}
