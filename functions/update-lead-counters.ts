/**
 * Cloud Function: Denormalize lead summary counters onto the owning institution document.
 *
 * Counters written to:
 *   institutions/{institutionId}.leadCounters
 *
 * leadCounters shape:
 * - total
 * - pending (LeadStatus.New)
 * - byStatus (new/read/contacted/appointment/enrolled/lost/closed/spam)
 * - byPipeline (new/contacted/appointment/enrolled/lost)
 *
 * NOTE:
 * - This is written as scaffolding; actual deployment requires:
 *   - firebase-functions / firebase-admin deps in the functions runtime
 *   - functions entrypoint wiring
 *   - Firebase project configuration
 */

import * as functions from "firebase-functions";
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

// Firestore "eur3" => "eur3-europe-west1".
// Cloud deploy tarafında gen1 desteği problemli olduğu için emülatörde kullanılacak şekilde
// gen1 trigger bölgesini "europe-west1" olarak bırakıyoruz.
const TRIGGER_REGION = "europe-west1";

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

function applyDeltas(current: ReturnType<typeof defaultLeadCounters>, delta: Partial<ReturnType<typeof defaultLeadCounters>>) {
  // Shallow update for top-level and nested maps.
  return {
    ...current,
    ...delta,
    byStatus: {
      ...current.byStatus,
      ...(delta.byStatus ?? {}),
    },
    byPipeline: {
      ...current.byPipeline,
      ...(delta.byPipeline ?? {}),
    },
  };
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

    const next = applyDeltas(current, {
      total: clampNonNegative(current.total + input.totalDelta),
      pending: clampNonNegative(current.pending + input.pendingDelta),
      byStatus: Object.fromEntries(
        BY_STATUS_KEYS.map((k) => [k, clampNonNegative(current.byStatus[k] + (input.statusDelta[k] ?? 0))]),
      ) as ReturnType<typeof defaultLeadCounters>["byStatus"],
      byPipeline: Object.fromEntries(
        (Object.keys(current.byPipeline) as LeadPipelineKey[]).map((k) => [
          k,
          clampNonNegative(current.byPipeline[k] + (input.pipelineDelta[k] ?? 0)),
        ]),
      ) as ReturnType<typeof defaultLeadCounters>["byPipeline"],
    });

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

export const updateLeadCountersOnCreate = functions
  .region(TRIGGER_REGION)
  .firestore
  .document("leads/{leadId}")
  .onCreate(async (snap) => {
    const dbData = snap.data() as { institutionId?: unknown; status?: unknown } | undefined;
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

export const updateLeadCountersOnDelete = functions
  .region(TRIGGER_REGION)
  .firestore
  .document("leads/{leadId}")
  .onDelete(async (snap) => {
    const before = snap.data() as { institutionId?: unknown; status?: unknown } | undefined;
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

export const updateLeadCountersOnUpdate = functions
  .region(TRIGGER_REGION)
  .firestore
  .document("leads/{leadId}")
  .onUpdate(async (change) => {
    const after = change.after.data() as { institutionId?: unknown; status?: unknown } | undefined;
    const before = change.before.data() as { institutionId?: unknown; status?: unknown } | undefined;

    const beforeInstitutionId =
      typeof before?.institutionId === "string" ? before.institutionId : null;
    const afterInstitutionId =
      typeof after?.institutionId === "string" ? after.institutionId : null;
    const beforeStatus = getLeadStatus(before);
    const afterStatus = getLeadStatus(after);

    if (!beforeInstitutionId || !afterInstitutionId || !beforeStatus || !afterStatus) return;

    if (beforeInstitutionId !== afterInstitutionId) {
      // Move between institutions: decrement old + increment new.
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
      return; // No status change => counters unaffected.
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

