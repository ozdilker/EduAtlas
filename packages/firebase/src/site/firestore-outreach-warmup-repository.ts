import type { OutreachWarmupSettingsRepository } from "@eduatlas/application";
import {
  createDefaultWarmupSettings,
  DEFAULT_WARMUP_STAGE_LIMITS,
  parseWarmupStage,
  type OutreachWarmupHistoryEntry,
  type OutreachWarmupSettings,
  type WarmupStage,
} from "@eduatlas/application";
import type { Firestore } from "firebase-admin/firestore";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";
import { SITE_SETTINGS_COLLECTION } from "./firestore-homepage-visuals-repository";

export const OUTREACH_WARMUP_DOC_ID = "outreach_warmup";

type FirestoreWarmupHistory = {
  at: string;
  fromStage: number;
  toStage: number;
  by?: string;
  note?: string;
  recipientCount?: number;
  sent?: number;
  failed?: number;
  bounced?: number;
};

type FirestoreWarmupDocument = {
  stage: number;
  limits?: { 1?: number; 2?: number; 3?: number; 4?: number };
  updatedAt: string;
  updatedBy?: string;
  history?: FirestoreWarmupHistory[];
};

function fromDocument(data: FirestoreWarmupDocument | undefined): OutreachWarmupSettings {
  if (!data) {
    return createDefaultWarmupSettings();
  }
  const stage = parseWarmupStage(data.stage || 1);
  const limits = {
    1: data.limits?.[1] ?? DEFAULT_WARMUP_STAGE_LIMITS[1],
    2: data.limits?.[2] ?? DEFAULT_WARMUP_STAGE_LIMITS[2],
    3: data.limits?.[3] ?? DEFAULT_WARMUP_STAGE_LIMITS[3],
    4: data.limits?.[4] ?? DEFAULT_WARMUP_STAGE_LIMITS[4],
  };
  const history: OutreachWarmupHistoryEntry[] = (data.history ?? []).map((h) =>
    Object.freeze({
      at: h.at,
      fromStage: parseWarmupStage(h.fromStage) as WarmupStage,
      toStage: parseWarmupStage(h.toStage) as WarmupStage,
      ...(h.by ? { by: h.by } : {}),
      ...(h.note ? { note: h.note } : {}),
      ...(typeof h.recipientCount === "number" ? { recipientCount: h.recipientCount } : {}),
      ...(typeof h.sent === "number" ? { sent: h.sent } : {}),
      ...(typeof h.failed === "number" ? { failed: h.failed } : {}),
      ...(typeof h.bounced === "number" ? { bounced: h.bounced } : {}),
    }),
  );
  return Object.freeze({
    stage,
    limits: Object.freeze(limits),
    updatedAt: data.updatedAt || new Date().toISOString(),
    ...(data.updatedBy ? { updatedBy: data.updatedBy } : {}),
    history: Object.freeze(history),
  });
}

function toDocument(settings: OutreachWarmupSettings): FirestoreWarmupDocument {
  return {
    stage: settings.stage,
    limits: {
      1: settings.limits[1],
      2: settings.limits[2],
      3: settings.limits[3],
      4: settings.limits[4],
    },
    updatedAt: settings.updatedAt,
    ...(settings.updatedBy ? { updatedBy: settings.updatedBy } : {}),
    history: settings.history.map((h) => ({
      at: h.at,
      fromStage: h.fromStage,
      toStage: h.toStage,
      ...(h.by ? { by: h.by } : {}),
      ...(h.note ? { note: h.note } : {}),
      ...(typeof h.recipientCount === "number" ? { recipientCount: h.recipientCount } : {}),
      ...(typeof h.sent === "number" ? { sent: h.sent } : {}),
      ...(typeof h.failed === "number" ? { failed: h.failed } : {}),
      ...(typeof h.bounced === "number" ? { bounced: h.bounced } : {}),
    })),
  };
}

export class FirestoreOutreachWarmupSettingsRepository
  implements OutreachWarmupSettingsRepository
{
  constructor(private readonly db: Firestore) {}

  private docRef() {
    return this.db.collection(SITE_SETTINGS_COLLECTION).doc(OUTREACH_WARMUP_DOC_ID);
  }

  async get(): Promise<OutreachWarmupSettings> {
    countFirestoreRead();
    const snap = await this.docRef().get();
    if (!snap.exists) {
      return createDefaultWarmupSettings();
    }
    return fromDocument(snap.data() as FirestoreWarmupDocument);
  }

  async save(settings: OutreachWarmupSettings): Promise<OutreachWarmupSettings> {
    countFirestoreWrite();
    await this.docRef().set(toDocument(settings), { merge: false });
    return settings;
  }
}

export function createFirestoreOutreachWarmupSettingsRepository(
  db: Firestore,
): OutreachWarmupSettingsRepository {
  return new FirestoreOutreachWarmupSettingsRepository(db);
}
