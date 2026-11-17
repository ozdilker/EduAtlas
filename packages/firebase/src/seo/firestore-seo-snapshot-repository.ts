import type { SeoSnapshot, SeoSnapshotRepository } from "@eduatlas/application";
import {
  createSeoSnapshot,
  type SeoSnapshotPageRow,
  type SeoSnapshotQueryRow,
} from "@eduatlas/application";
import type { Firestore } from "firebase-admin/firestore";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

export const SEO_SNAPSHOTS_COLLECTION = "seo_snapshots";
export const SEO_SNAPSHOT_LATEST_DOC_ID = "latest";

type FirestoreSeoSnapshotDocument = {
  updatedAt?: string;
  dateRange?: { startDate?: string; endDate?: string };
  summary?: {
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  };
  topPages?: Array<{
    url?: string;
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
  topQueries?: Array<{
    query?: string;
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
  opportunities?: {
    lowCtrPages?: FirestoreSeoSnapshotDocument["topPages"];
    midPositionQueries?: FirestoreSeoSnapshotDocument["topQueries"];
    unmatchedInstitutionPages?: FirestoreSeoSnapshotDocument["topPages"];
  };
};

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parsePages(
  rows: FirestoreSeoSnapshotDocument["topPages"] | undefined,
): SeoSnapshotPageRow[] {
  if (!rows) return [];
  return rows
    .map((row) => {
      const url = typeof row?.url === "string" ? row.url.trim() : "";
      if (!url) return null;
      return Object.freeze({
        url,
        clicks: asNumber(row?.clicks),
        impressions: asNumber(row?.impressions),
        ctr: asNumber(row?.ctr),
        position: asNumber(row?.position),
      });
    })
    .filter((row): row is SeoSnapshotPageRow => row != null);
}

function parseQueries(
  rows: FirestoreSeoSnapshotDocument["topQueries"] | undefined,
): SeoSnapshotQueryRow[] {
  if (!rows) return [];
  return rows
    .map((row) => {
      const query = typeof row?.query === "string" ? row.query.trim() : "";
      if (!query) return null;
      return Object.freeze({
        query,
        clicks: asNumber(row?.clicks),
        impressions: asNumber(row?.impressions),
        ctr: asNumber(row?.ctr),
        position: asNumber(row?.position),
      });
    })
    .filter((row): row is SeoSnapshotQueryRow => row != null);
}

function fromDocument(data: FirestoreSeoSnapshotDocument | undefined): SeoSnapshot | null {
  if (!data?.updatedAt || !data.dateRange?.startDate || !data.dateRange?.endDate) {
    return null;
  }
  const pages = parsePages(data.topPages);
  const queries = parseQueries(data.topQueries);
  // Rebuild so opportunities stay consistent with thresholds if older docs omit them.
  return createSeoSnapshot({
    updatedAt: data.updatedAt,
    dateRange: {
      startDate: data.dateRange.startDate,
      endDate: data.dateRange.endDate,
    },
    pages,
    queries,
  });
}

function toDocument(snapshot: SeoSnapshot): FirestoreSeoSnapshotDocument {
  return {
    updatedAt: snapshot.updatedAt,
    dateRange: {
      startDate: snapshot.dateRange.startDate,
      endDate: snapshot.dateRange.endDate,
    },
    summary: { ...snapshot.summary },
    topPages: snapshot.topPages.map((row) => ({ ...row })),
    topQueries: snapshot.topQueries.map((row) => ({ ...row })),
    opportunities: {
      lowCtrPages: snapshot.opportunities.lowCtrPages.map((row) => ({ ...row })),
      midPositionQueries: snapshot.opportunities.midPositionQueries.map((row) => ({
        ...row,
      })),
      unmatchedInstitutionPages: snapshot.opportunities.unmatchedInstitutionPages.map(
        (row) => ({ ...row }),
      ),
    },
  };
}

export class FirestoreSeoSnapshotRepository implements SeoSnapshotRepository {
  constructor(private readonly db: Firestore) {}

  private docRef() {
    return this.db.collection(SEO_SNAPSHOTS_COLLECTION).doc(SEO_SNAPSHOT_LATEST_DOC_ID);
  }

  async getLatest(): Promise<SeoSnapshot | null> {
    countFirestoreRead();
    const snap = await this.docRef().get();
    if (!snap.exists) return null;
    return fromDocument(snap.data() as FirestoreSeoSnapshotDocument);
  }

  async saveLatest(snapshot: SeoSnapshot): Promise<SeoSnapshot> {
    countFirestoreWrite();
    await this.docRef().set(toDocument(snapshot), { merge: false });
    return snapshot;
  }
}

export function createFirestoreSeoSnapshotRepository(
  db: Firestore,
): FirestoreSeoSnapshotRepository {
  return new FirestoreSeoSnapshotRepository(db);
}

export class InMemorySeoSnapshotRepository implements SeoSnapshotRepository {
  private latest: SeoSnapshot | null = null;

  async getLatest(): Promise<SeoSnapshot | null> {
    return this.latest;
  }

  async saveLatest(snapshot: SeoSnapshot): Promise<SeoSnapshot> {
    this.latest = snapshot;
    return snapshot;
  }
}

export function createInMemorySeoSnapshotRepository(): InMemorySeoSnapshotRepository {
  return new InMemorySeoSnapshotRepository();
}
