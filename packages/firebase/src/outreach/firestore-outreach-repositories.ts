import type {
  CampaignLogRepository,
  CampaignRecipientRepository,
  CampaignRepository,
  CampaignSegmentRepository,
  CampaignTemplateRepository,
  DeliveryJobRepository,
  DeliverySendBudget,
} from "@eduatlas/application";
import {
  campaignIdAsString,
  createCampaign,
  createCampaignLog,
  createCampaignRecipient,
  createCampaignSegment,
  createCampaignTemplate,
  createDeliveryJob,
  DeliveryJobStatus,
  type Campaign,
  type CampaignLog,
  type CampaignRecipient,
  type CampaignSegment,
  type CampaignTemplate,
  type DeliveryJob,
} from "@eduatlas/domain";
import { FieldValue, type Firestore, type QuerySnapshot } from "firebase-admin/firestore";

export const OUTREACH_CAMPAIGNS = "outreach_campaigns";
export const OUTREACH_RECIPIENTS = "outreach_recipients";
export const OUTREACH_TEMPLATES = "outreach_templates";
export const OUTREACH_SEGMENTS = "outreach_segments";
export const OUTREACH_LOGS = "outreach_campaign_logs";
export const OUTREACH_JOBS = "outreach_delivery_jobs";
export const OUTREACH_BUDGET = "outreach_delivery_budget";

/** Firestore-safe document id from idempotency key. */
export function deliveryJobDocId(idempotencyKey: string): string {
  return idempotencyKey.trim().replace(/[/\\]/g, "_");
}

function dayKey(now: string): string {
  return new Date(now).toISOString().slice(0, 10);
}

function minuteKey(now: string): string {
  return new Date(now).toISOString().slice(0, 16);
}

export class FirestoreCampaignRepository implements CampaignRepository {
  constructor(private readonly db: Firestore) {}

  async getById(id: string): Promise<Campaign | null> {
    const snap = await this.db.collection(OUTREACH_CAMPAIGNS).doc(id.trim()).get();
    if (!snap.exists) return null;
    const data = { ...(snap.data() as Record<string, unknown>) };
    delete data.id;
    return createCampaign({ id: snap.id, ...(data as Omit<Parameters<typeof createCampaign>[0], "id">) });
  }

  async save(campaign: Campaign): Promise<Campaign> {
    const id = campaignIdAsString(campaign.id);
    await this.db.collection(OUTREACH_CAMPAIGNS).doc(id).set(toCampaignDoc(campaign), {
      merge: false,
    });
    return campaign;
  }

  async update(campaign: Campaign): Promise<Campaign> {
    const id = campaignIdAsString(campaign.id);
    const doc = toCampaignDoc(campaign);
    if (!campaign.recipientMatchScope) {
      doc.recipientMatchScope = FieldValue.delete();
    }
    await this.db.collection(OUTREACH_CAMPAIGNS).doc(id).set(doc, {
      merge: true,
    });
    return campaign;
  }

  async list(): Promise<readonly Campaign[]> {
    const snap = await this.db.collection(OUTREACH_CAMPAIGNS).get();
    return Object.freeze(
      snap.docs.map((doc) => {
        const data = { ...(doc.data() as Record<string, unknown>) };
        delete data.id;
        return createCampaign({
          id: doc.id,
          ...(data as Omit<Parameters<typeof createCampaign>[0], "id">),
        });
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.collection(OUTREACH_CAMPAIGNS).doc(id.trim()).delete();
  }
}

/**
 * CampaignRecipient document path is the primary key.
 * Payload `id` (if present) must not override the Firestore document id.
 */
export function mapCampaignRecipientDocument(
  docId: string,
  data: Record<string, unknown> | undefined,
): CampaignRecipient {
  const payload = { ...(data ?? {}) };
  delete payload.id;
  return createCampaignRecipient({
    ...(payload as Omit<Parameters<typeof createCampaignRecipient>[0], "id">),
    id: docId,
  });
}

export class FirestoreCampaignRecipientRepository implements CampaignRecipientRepository {
  constructor(private readonly db: Firestore) {}

  async getById(id: string): Promise<CampaignRecipient | null> {
    const snap = await this.db.collection(OUTREACH_RECIPIENTS).doc(id.trim()).get();
    if (!snap.exists) return null;
    return mapCampaignRecipientDocument(snap.id, snap.data() as Record<string, unknown>);
  }

  async save(recipient: CampaignRecipient): Promise<CampaignRecipient> {
    await this.db
      .collection(OUTREACH_RECIPIENTS)
      .doc(recipient.id)
      .set({ ...recipient }, { merge: false });
    return recipient;
  }

  async update(recipient: CampaignRecipient): Promise<CampaignRecipient> {
    const payload: Record<string, unknown> = { ...recipient };
    if (!recipient.matchCandidateIds?.length) {
      payload.matchCandidateIds = FieldValue.delete();
    }
    await this.db
      .collection(OUTREACH_RECIPIENTS)
      .doc(recipient.id)
      .set(payload, { merge: true });
    return recipient;
  }

  async listByCampaignId(campaignId: string): Promise<readonly CampaignRecipient[]> {
    const snap = await this.db
      .collection(OUTREACH_RECIPIENTS)
      .where("campaignId", "==", campaignId.trim())
      .get();
    return Object.freeze(
      snap.docs.map((doc) =>
        mapCampaignRecipientDocument(doc.id, doc.data() as Record<string, unknown>),
      ),
    );
  }

  async listByInstitutionId(institutionId: string): Promise<readonly CampaignRecipient[]> {
    const snap = await this.db
      .collection(OUTREACH_RECIPIENTS)
      .where("institutionId", "==", institutionId.trim())
      .get();
    return Object.freeze(
      snap.docs.map((doc) =>
        mapCampaignRecipientDocument(doc.id, doc.data() as Record<string, unknown>),
      ),
    );
  }

  async deleteByCampaignId(campaignId: string): Promise<number> {
    const snap = await this.db
      .collection(OUTREACH_RECIPIENTS)
      .where("campaignId", "==", campaignId.trim())
      .get();
    await deleteQuerySnapshot(this.db, snap);
    return snap.size;
  }
}

export class FirestoreCampaignTemplateRepository implements CampaignTemplateRepository {
  constructor(private readonly db: Firestore) {}

  async getById(id: string): Promise<CampaignTemplate | null> {
    const snap = await this.db.collection(OUTREACH_TEMPLATES).doc(id.trim()).get();
    if (!snap.exists) return null;
    return createCampaignTemplate({
      id: snap.id,
      ...(snap.data() as Omit<CampaignTemplate, "id">),
    });
  }

  async save(template: CampaignTemplate): Promise<CampaignTemplate> {
    await this.db.collection(OUTREACH_TEMPLATES).doc(template.id).set({ ...template });
    return template;
  }

  async update(template: CampaignTemplate): Promise<CampaignTemplate> {
    await this.db.collection(OUTREACH_TEMPLATES).doc(template.id).set({ ...template });
    return template;
  }

  async list(): Promise<readonly CampaignTemplate[]> {
    const snap = await this.db.collection(OUTREACH_TEMPLATES).get();
    return Object.freeze(
      snap.docs.map((doc) =>
        createCampaignTemplate({
          id: doc.id,
          ...(doc.data() as Omit<CampaignTemplate, "id">),
        }),
      ),
    );
  }
}

export class FirestoreCampaignSegmentRepository implements CampaignSegmentRepository {
  constructor(private readonly db: Firestore) {}

  async getById(id: string): Promise<CampaignSegment | null> {
    const snap = await this.db.collection(OUTREACH_SEGMENTS).doc(id.trim()).get();
    if (!snap.exists) return null;
    return createCampaignSegment({
      id: snap.id,
      ...(snap.data() as Omit<CampaignSegment, "id">),
    });
  }

  async save(segment: CampaignSegment): Promise<CampaignSegment> {
    await this.db.collection(OUTREACH_SEGMENTS).doc(segment.id).set({ ...segment });
    return segment;
  }

  async update(segment: CampaignSegment): Promise<CampaignSegment> {
    await this.db.collection(OUTREACH_SEGMENTS).doc(segment.id).set({ ...segment });
    return segment;
  }

  async list(): Promise<readonly CampaignSegment[]> {
    const snap = await this.db.collection(OUTREACH_SEGMENTS).get();
    return Object.freeze(
      snap.docs.map((doc) =>
        createCampaignSegment({
          id: doc.id,
          ...(doc.data() as Omit<CampaignSegment, "id">),
        }),
      ),
    );
  }
}

export class FirestoreCampaignLogRepository implements CampaignLogRepository {
  constructor(private readonly db: Firestore) {}

  async save(log: CampaignLog): Promise<CampaignLog> {
    await this.db.collection(OUTREACH_LOGS).doc(log.id).set({ ...log });
    return log;
  }

  async listByCampaignId(campaignId: string): Promise<readonly CampaignLog[]> {
    const snap = await this.db
      .collection(OUTREACH_LOGS)
      .where("campaignId", "==", campaignId.trim())
      .get();
    return Object.freeze(
      snap.docs.map((doc) =>
        createCampaignLog({ id: doc.id, ...(doc.data() as Omit<CampaignLog, "id">) }),
      ),
    );
  }

  async deleteByCampaignId(campaignId: string): Promise<number> {
    const snap = await this.db
      .collection(OUTREACH_LOGS)
      .where("campaignId", "==", campaignId.trim())
      .get();
    await deleteQuerySnapshot(this.db, snap);
    return snap.size;
  }
}

export class FirestoreDeliveryJobRepository implements DeliveryJobRepository {
  constructor(private readonly db: Firestore) {}

  async getById(id: string): Promise<DeliveryJob | null> {
    const snap = await this.db
      .collection(OUTREACH_JOBS)
      .where("id", "==", id.trim())
      .limit(1)
      .get();
    const doc = snap.docs[0];
    if (!doc) return null;
    return fromJobDoc(doc.data() as Record<string, unknown>);
  }

  async getByIdempotencyKey(key: string): Promise<DeliveryJob | null> {
    const snap = await this.db.collection(OUTREACH_JOBS).doc(deliveryJobDocId(key)).get();
    if (!snap.exists) return null;
    return fromJobDoc(snap.data() as Record<string, unknown>);
  }

  async save(job: DeliveryJob): Promise<DeliveryJob> {
    const ref = this.db.collection(OUTREACH_JOBS).doc(deliveryJobDocId(job.idempotencyKey));
    const existing = await ref.get();
    if (existing.exists) {
      throw new Error(`DeliveryJob idempotency conflict: ${job.idempotencyKey}`);
    }
    await ref.set({ ...job });
    return job;
  }

  async update(job: DeliveryJob): Promise<DeliveryJob> {
    await this.db
      .collection(OUTREACH_JOBS)
      .doc(deliveryJobDocId(job.idempotencyKey))
      .set({ ...job }, { merge: true });
    return job;
  }

  async listByCampaignId(campaignId: string): Promise<readonly DeliveryJob[]> {
    const snap = await this.db
      .collection(OUTREACH_JOBS)
      .where("campaignId", "==", campaignId.trim())
      .get();
    return Object.freeze(snap.docs.map((doc) => fromJobDoc(doc.data() as Record<string, unknown>)));
  }

  async deleteByCampaignId(campaignId: string): Promise<number> {
    const snap = await this.db
      .collection(OUTREACH_JOBS)
      .where("campaignId", "==", campaignId.trim())
      .get();
    await deleteQuerySnapshot(this.db, snap);
    return snap.size;
  }

  async claimNext(input: {
    now: string;
    lockedBy: string;
    lockTtlMs: number;
    campaignId: string;
  }): Promise<DeliveryJob | null> {
    const snap = await this.db
      .collection(OUTREACH_JOBS)
      .where("campaignId", "==", input.campaignId.trim())
      .get();
    const nowMs = Date.parse(input.now);
    const candidates = snap.docs
      .map((doc) => ({ ref: doc.ref, job: fromJobDoc(doc.data() as Record<string, unknown>) }))
      .filter(({ job }) => {
        const available = Date.parse(job.availableAt) <= nowMs;
        if (job.status === DeliveryJobStatus.Pending && available) return true;
        if (job.status === DeliveryJobStatus.Locked && job.lockedAt && available) {
          return nowMs - Date.parse(job.lockedAt) >= input.lockTtlMs;
        }
        return false;
      })
      .sort((a, b) => Date.parse(a.job.availableAt) - Date.parse(b.job.availableAt));

    const first = candidates[0];
    if (!first) return null;

    return this.db.runTransaction(async (tx) => {
      const fresh = await tx.get(first.ref);
      if (!fresh.exists) return null;
      const job = fromJobDoc(fresh.data() as Record<string, unknown>);
      const available = Date.parse(job.availableAt) <= nowMs;
      const reclaimable =
        job.status === DeliveryJobStatus.Locked &&
        job.lockedAt &&
        nowMs - Date.parse(job.lockedAt) >= input.lockTtlMs;
      if (
        !(
          (job.status === DeliveryJobStatus.Pending && available) ||
          (reclaimable && available)
        )
      ) {
        return null;
      }
      const locked = createDeliveryJob({
        ...job,
        status: DeliveryJobStatus.Locked,
        lockedAt: input.now,
        lockedBy: input.lockedBy,
        updatedAt: input.now,
      });
      tx.set(first.ref, { ...locked }, { merge: true });
      return locked;
    });
  }
}

export class FirestoreDeliverySendBudget implements DeliverySendBudget {
  constructor(private readonly db: Firestore) {}

  async getSentInCurrentMinute(now: string): Promise<number> {
    const snap = await this.db.collection(OUTREACH_BUDGET).doc(dayKey(now)).get();
    const data = snap.data() as { minutes?: Record<string, number> } | undefined;
    return data?.minutes?.[minuteKey(now)] ?? 0;
  }

  async getSentToday(now: string): Promise<number> {
    const snap = await this.db.collection(OUTREACH_BUDGET).doc(dayKey(now)).get();
    const data = snap.data() as { total?: number } | undefined;
    return data?.total ?? 0;
  }

  async recordAcceptedSend(now: string): Promise<void> {
    const ref = this.db.collection(OUTREACH_BUDGET).doc(dayKey(now));
    const mk = minuteKey(now);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = (snap.data() as { total?: number; minutes?: Record<string, number> } | undefined) ?? {};
      const minutes = { ...(data.minutes ?? {}) };
      minutes[mk] = (minutes[mk] ?? 0) + 1;
      tx.set(
        ref,
        {
          total: (data.total ?? 0) + 1,
          minutes,
          updatedAt: now,
        },
        { merge: true },
      );
    });
  }
}

async function deleteQuerySnapshot(db: Firestore, snap: QuerySnapshot): Promise<void> {
  const batchSize = 400;
  for (let i = 0; i < snap.docs.length; i += batchSize) {
    const batch = db.batch();
    for (const doc of snap.docs.slice(i, i + batchSize)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}

function toCampaignDoc(campaign: Campaign): Record<string, unknown> {
  const { id: _id, ...rest } = campaign;
  return {
    ...rest,
    id: campaignIdAsString(campaign.id),
  };
}

function fromJobDoc(data: Record<string, unknown>): DeliveryJob {
  return createDeliveryJob(data as Parameters<typeof createDeliveryJob>[0]);
}

export function createFirestoreOutreachRepositories(db: Firestore): Readonly<{
  campaignRepository: FirestoreCampaignRepository;
  recipientRepository: FirestoreCampaignRecipientRepository;
  templateRepository: FirestoreCampaignTemplateRepository;
  segmentRepository: FirestoreCampaignSegmentRepository;
  logRepository: FirestoreCampaignLogRepository;
  deliveryJobRepository: FirestoreDeliveryJobRepository;
  deliveryBudget: FirestoreDeliverySendBudget;
}> {
  return Object.freeze({
    campaignRepository: new FirestoreCampaignRepository(db),
    recipientRepository: new FirestoreCampaignRecipientRepository(db),
    templateRepository: new FirestoreCampaignTemplateRepository(db),
    segmentRepository: new FirestoreCampaignSegmentRepository(db),
    logRepository: new FirestoreCampaignLogRepository(db),
    deliveryJobRepository: new FirestoreDeliveryJobRepository(db),
    deliveryBudget: new FirestoreDeliverySendBudget(db),
  });
}
