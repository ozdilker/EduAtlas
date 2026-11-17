import type { SeoSnapshot } from "./seo-snapshot";

/**
 * Persistence port for the latest GSC SEO snapshot document.
 */
export interface SeoSnapshotRepository {
  /** Returns `seo_snapshots/latest`, or null when missing. */
  getLatest(): Promise<SeoSnapshot | null>;

  /** Upserts `seo_snapshots/latest` (CLI / controlled writers only). */
  saveLatest(snapshot: SeoSnapshot): Promise<SeoSnapshot>;
}
