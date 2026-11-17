import type { Ga4Snapshot } from "./ga4-snapshot";

/**
 * Persistence port for the latest GA4 institution_view snapshot document.
 */
export interface Ga4SnapshotRepository {
  /** Returns `ga4_snapshots/latest`, or null when missing. */
  getLatest(): Promise<Ga4Snapshot | null>;

  /** Upserts `ga4_snapshots/latest` (CLI / controlled writers only). */
  saveLatest(snapshot: Ga4Snapshot): Promise<Ga4Snapshot>;
}
