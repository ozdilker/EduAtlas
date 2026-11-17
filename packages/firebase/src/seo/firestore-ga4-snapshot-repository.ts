import type { Ga4Snapshot, Ga4SnapshotRepository, Ga4InstitutionViewRow } from "@eduatlas/application";
import { createGa4Snapshot } from "@eduatlas/application";
import type { Firestore } from "firebase-admin/firestore";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

export const GA4_SNAPSHOTS_COLLECTION = "ga4_snapshots";
export const GA4_SNAPSHOT_LATEST_DOC_ID = "latest";

type FirestoreGa4SnapshotDocument = {
  updatedAt?: string;
  dateRange?: { startDate?: string; endDate?: string };
  summary?: {
    totalInstitutionViews?: number;
    distinctInstitutionIds?: number;
  };
  topInstitutionViews?: Array<{
    institutionId?: string;
    eventCount?: number;
  }>;
};

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseRows(
  rows: FirestoreGa4SnapshotDocument["topInstitutionViews"] | undefined,
): Ga4InstitutionViewRow[] {
  if (!rows) return [];
  return rows
    .map((row) => {
      const institutionId =
        typeof row?.institutionId === "string" ? row.institutionId.trim() : "";
      if (!institutionId) return null;
      return Object.freeze({
        institutionId,
        eventCount: asNumber(row?.eventCount),
      });
    })
    .filter((row): row is Ga4InstitutionViewRow => row != null);
}

function fromDocument(data: FirestoreGa4SnapshotDocument | undefined): Ga4Snapshot | null {
  if (!data?.updatedAt || !data.dateRange?.startDate || !data.dateRange?.endDate) {
    return null;
  }
  return createGa4Snapshot({
    updatedAt: data.updatedAt,
    dateRange: {
      startDate: data.dateRange.startDate,
      endDate: data.dateRange.endDate,
    },
    institutionViews: parseRows(data.topInstitutionViews),
  });
}

function toDocument(snapshot: Ga4Snapshot): FirestoreGa4SnapshotDocument {
  return {
    updatedAt: snapshot.updatedAt,
    dateRange: {
      startDate: snapshot.dateRange.startDate,
      endDate: snapshot.dateRange.endDate,
    },
    summary: { ...snapshot.summary },
    topInstitutionViews: snapshot.topInstitutionViews.map((row) => ({ ...row })),
  };
}

export class FirestoreGa4SnapshotRepository implements Ga4SnapshotRepository {
  constructor(private readonly db: Firestore) {}

  private docRef() {
    return this.db.collection(GA4_SNAPSHOTS_COLLECTION).doc(GA4_SNAPSHOT_LATEST_DOC_ID);
  }

  async getLatest(): Promise<Ga4Snapshot | null> {
    countFirestoreRead();
    const snap = await this.docRef().get();
    if (!snap.exists) return null;
    return fromDocument(snap.data() as FirestoreGa4SnapshotDocument);
  }

  async saveLatest(snapshot: Ga4Snapshot): Promise<Ga4Snapshot> {
    countFirestoreWrite();
    await this.docRef().set(toDocument(snapshot), { merge: false });
    return snapshot;
  }
}

export function createFirestoreGa4SnapshotRepository(
  db: Firestore,
): FirestoreGa4SnapshotRepository {
  return new FirestoreGa4SnapshotRepository(db);
}

export class InMemoryGa4SnapshotRepository implements Ga4SnapshotRepository {
  private latest: Ga4Snapshot | null = null;

  async getLatest(): Promise<Ga4Snapshot | null> {
    return this.latest;
  }

  async saveLatest(snapshot: Ga4Snapshot): Promise<Ga4Snapshot> {
    this.latest = snapshot;
    return snapshot;
  }
}

export function createInMemoryGa4SnapshotRepository(): InMemoryGa4SnapshotRepository {
  return new InMemoryGa4SnapshotRepository();
}
