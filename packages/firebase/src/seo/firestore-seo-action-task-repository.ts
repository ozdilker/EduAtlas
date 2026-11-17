import type { SeoActionTask, SeoActionTaskRepository } from "@eduatlas/application";
import {
  SEO_ACTION_TASK_LIST_LIMIT,
  createSeoActionTask,
  parseSeoActionTaskStatus,
} from "@eduatlas/application";
import type { Firestore } from "firebase-admin/firestore";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

export const SEO_ACTION_TASKS_COLLECTION = "seo_action_tasks";

type FirestoreSeoActionTaskDocument = {
  sourceKey?: string;
  status?: string;
  assigneeUid?: string | null;
  note?: string | null;
  updatedAt?: string;
  updatedBy?: string;
};

function fromDocument(
  fingerprint: string,
  data: FirestoreSeoActionTaskDocument | undefined,
): SeoActionTask | null {
  if (!data?.sourceKey || !data.updatedAt || !data.updatedBy || !data.status) {
    return null;
  }
  try {
    return createSeoActionTask({
      fingerprint,
      sourceKey: data.sourceKey,
      status: parseSeoActionTaskStatus(data.status),
      assigneeUid: data.assigneeUid ?? null,
      note: data.note ?? null,
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy,
    });
  } catch {
    return null;
  }
}

function toDocument(task: SeoActionTask): FirestoreSeoActionTaskDocument {
  return {
    sourceKey: task.sourceKey,
    status: task.status,
    assigneeUid: task.assigneeUid,
    note: task.note,
    updatedAt: task.updatedAt,
    updatedBy: task.updatedBy,
  };
}

export class FirestoreSeoActionTaskRepository implements SeoActionTaskRepository {
  constructor(private readonly db: Firestore) {}

  private collection() {
    return this.db.collection(SEO_ACTION_TASKS_COLLECTION);
  }

  async getByFingerprint(fingerprint: string): Promise<SeoActionTask | null> {
    countFirestoreRead();
    const snap = await this.collection().doc(fingerprint).get();
    if (!snap.exists) return null;
    return fromDocument(fingerprint, snap.data() as FirestoreSeoActionTaskDocument);
  }

  async getByFingerprints(
    fingerprints: readonly string[],
  ): Promise<readonly SeoActionTask[]> {
    const unique = [...new Set(fingerprints.map((value) => value.trim()).filter(Boolean))];
    if (unique.length === 0) return Object.freeze([]);

    const results: SeoActionTask[] = [];
    // Firestore getAll is bounded; chunk by 100.
    for (let i = 0; i < unique.length; i += 100) {
      const chunk = unique.slice(i, i + 100);
      const refs = chunk.map((id) => this.collection().doc(id));
      countFirestoreRead();
      const snaps = await this.db.getAll(...refs);
      for (const snap of snaps) {
        if (!snap.exists) continue;
        const task = fromDocument(
          snap.id,
          snap.data() as FirestoreSeoActionTaskDocument,
        );
        if (task) results.push(task);
      }
    }
    return Object.freeze(results);
  }

  async listAll(limit = SEO_ACTION_TASK_LIST_LIMIT): Promise<readonly SeoActionTask[]> {
    const bounded = Math.min(Math.max(1, Math.floor(limit)), SEO_ACTION_TASK_LIST_LIMIT);
    countFirestoreRead();
    const snap = await this.collection().limit(bounded).get();
    const results: SeoActionTask[] = [];
    for (const doc of snap.docs) {
      const task = fromDocument(doc.id, doc.data() as FirestoreSeoActionTaskDocument);
      if (task) results.push(task);
    }
    return Object.freeze(results);
  }

  async upsert(task: SeoActionTask): Promise<SeoActionTask> {
    countFirestoreWrite();
    await this.collection().doc(task.fingerprint).set(toDocument(task), { merge: false });
    return task;
  }
}

export function createFirestoreSeoActionTaskRepository(
  db: Firestore,
): FirestoreSeoActionTaskRepository {
  return new FirestoreSeoActionTaskRepository(db);
}

export class InMemorySeoActionTaskRepository implements SeoActionTaskRepository {
  private readonly byId = new Map<string, SeoActionTask>();

  async getByFingerprint(fingerprint: string): Promise<SeoActionTask | null> {
    return this.byId.get(fingerprint) ?? null;
  }

  async getByFingerprints(
    fingerprints: readonly string[],
  ): Promise<readonly SeoActionTask[]> {
    return Object.freeze(
      fingerprints
        .map((id) => this.byId.get(id))
        .filter((task): task is SeoActionTask => task != null),
    );
  }

  async listAll(limit = SEO_ACTION_TASK_LIST_LIMIT): Promise<readonly SeoActionTask[]> {
    const bounded = Math.min(Math.max(1, Math.floor(limit)), SEO_ACTION_TASK_LIST_LIMIT);
    return Object.freeze([...this.byId.values()].slice(0, bounded));
  }

  async upsert(task: SeoActionTask): Promise<SeoActionTask> {
    this.byId.set(task.fingerprint, task);
    return task;
  }
}

export function createInMemorySeoActionTaskRepository(): InMemorySeoActionTaskRepository {
  return new InMemorySeoActionTaskRepository();
}
