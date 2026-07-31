/**
 * Gen2 (Firebase Functions v2) version of the lead counters denormalization.
 * This is the recommended deployment path for Firestore "eur3" databases.
 */

import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

type LeadStatus =
  | "new"
  | "read"
  | "contacted"
  | "appointment"
  | "enrolled"
  | "lost"
  | "closed"
  | "spam";

const BY_STATUS_KEYS: readonly LeadStatus[] = [
  "new",
  "read",
  "contacted",
  "appointment",
  "enrolled",
  "lost",
  "closed",
  "spam",
];

type LeadPipelineKey = "new" | "contacted" | "appointment" | "enrolled" | "lost";

function pipelineKeyFromStatus(status: LeadStatus): LeadPipelineKey | null {
  switch (status) {
    case "new":
      return "new";
    case "contacted":
      return "contacted";
    case "appointment":
      return "appointment";
    case "enrolled":
      return "enrolled";
    case "lost":
      return "lost";
    default:
      return null;
  }
}

function defaultLeadCounters() {
  return {
    total: 0,
    pending: 0,
    byStatus: {
      new: 0,
      read: 0,
      contacted: 0,
      appointment: 0,
      enrolled: 0,
      lost: 0,
      closed: 0,
      spam: 0,
    },
    byPipeline: {
      new: 0,
      contacted: 0,
      appointment: 0,
      enrolled: 0,
      lost: 0,
    },
  };
}

function clampNonNegative(n: number): number {
  return n < 0 ? 0 : n;
}

async function updateInstitutionLeadCounters(input: {
  institutionId: string;
  statusDelta: Partial<Record<LeadStatus, number>>;
  pipelineDelta: Partial<Record<LeadPipelineKey, number>>;
  totalDelta: number;
  pendingDelta: number;
}) {
  const db = admin.firestore();
  const instRef = db.collection("institutions").doc(input.institutionId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(instRef);
    if (!snap.exists) {
      return;
    }

    const data = snap.data() as { leadCounters?: ReturnType<typeof defaultLeadCounters> } | undefined;
    const current = data?.leadCounters ?? defaultLeadCounters();

    const next = {
      total: clampNonNegative(current.total + input.totalDelta),
      pending: clampNonNegative(current.pending + input.pendingDelta),
      byStatus: Object.fromEntries(
        BY_STATUS_KEYS.map((k) => [k, clampNonNegative(current.byStatus[k] + (input.statusDelta[k] ?? 0))]),
      ),
      byPipeline: Object.fromEntries(
        (Object.keys(current.byPipeline) as LeadPipelineKey[]).map((k) => [
          k,
          clampNonNegative(current.byPipeline[k] + (input.pipelineDelta[k] ?? 0)),
        ]),
      ),
    };

    tx.update(instRef, { leadCounters: next });
  });
}

function getLeadStatus(data: unknown): LeadStatus | null {
  const raw = (data as { status?: unknown } | undefined)?.status;
  if (typeof raw !== "string") return null;
  const normalized = raw.trim();
  if (!BY_STATUS_KEYS.includes(normalized as LeadStatus)) return null;
  return normalized as LeadStatus;
}

export const updateLeadCountersOnCreate = onDocumentCreated("leads", async (event) => {
  const dbData = event.data.data() as { institutionId?: unknown; status?: unknown } | undefined;
  const institutionId = typeof dbData?.institutionId === "string" ? dbData.institutionId : null;
  const status = getLeadStatus(dbData);
  if (!institutionId || !status) return;

  const pipelineKey = pipelineKeyFromStatus(status);
  await updateInstitutionLeadCounters({
    institutionId,
    totalDelta: 1,
    pendingDelta: status === "new" ? 1 : 0,
    statusDelta: { [status]: 1 },
    pipelineDelta: pipelineKey ? { [pipelineKey]: 1 } : {},
  });
});

export const updateLeadCountersOnDelete = onDocumentDeleted("leads", async (event) => {
  const before = event.data.data() as { institutionId?: unknown; status?: unknown } | undefined;
  const institutionId = typeof before?.institutionId === "string" ? before.institutionId : null;
  const status = getLeadStatus(before);
  if (!institutionId || !status) return;

  const pipelineKey = pipelineKeyFromStatus(status);
  await updateInstitutionLeadCounters({
    institutionId,
    totalDelta: -1,
    pendingDelta: status === "new" ? -1 : 0,
    statusDelta: { [status]: -1 },
    pipelineDelta: pipelineKey ? { [pipelineKey]: -1 } : {},
  });
});

export const updateLeadCountersOnUpdate = onDocumentUpdated("leads", async (event) => {
  const after = event.data.after.data() as { institutionId?: unknown; status?: unknown } | undefined;
  const before = event.data.before.data() as { institutionId?: unknown; status?: unknown } | undefined;

  const beforeInstitutionId = typeof before?.institutionId === "string" ? before.institutionId : null;
  const afterInstitutionId = typeof after?.institutionId === "string" ? after.institutionId : null;
  const beforeStatus = getLeadStatus(before);
  const afterStatus = getLeadStatus(after);

  if (!beforeInstitutionId || !afterInstitutionId || !beforeStatus || !afterStatus) return;

  if (beforeInstitutionId !== afterInstitutionId) {
    const beforePipelineKey = pipelineKeyFromStatus(beforeStatus);
    const afterPipelineKey = pipelineKeyFromStatus(afterStatus);

    await updateInstitutionLeadCounters({
      institutionId: beforeInstitutionId,
      totalDelta: -1,
      pendingDelta: beforeStatus === "new" ? -1 : 0,
      statusDelta: { [beforeStatus]: -1 },
      pipelineDelta: beforePipelineKey ? { [beforePipelineKey]: -1 } : {},
    });

    await updateInstitutionLeadCounters({
      institutionId: afterInstitutionId,
      totalDelta: 1,
      pendingDelta: afterStatus === "new" ? 1 : 0,
      statusDelta: { [afterStatus]: 1 },
      pipelineDelta: afterPipelineKey ? { [afterPipelineKey]: 1 } : {},
    });

    return;
  }

  if (beforeStatus === afterStatus) {
    return;
  }

  const beforePipelineKey = pipelineKeyFromStatus(beforeStatus);
  const afterPipelineKey = pipelineKeyFromStatus(afterStatus);

  await updateInstitutionLeadCounters({
    institutionId: afterInstitutionId,
    totalDelta: 0,
    pendingDelta:
      (afterStatus === "new" ? 1 : 0) - (beforeStatus === "new" ? 1 : 0),
    statusDelta: { [beforeStatus]: -1, [afterStatus]: 1 },
    pipelineDelta: {
      ...(beforePipelineKey ? { [beforePipelineKey]: -1 } : {}),
      ...(afterPipelineKey ? { [afterPipelineKey]: 1 } : {}),
    },
  });
});

