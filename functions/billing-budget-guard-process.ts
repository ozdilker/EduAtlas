/**
 * Testable Firestore update path for billing budget notifications.
 * No Gen2 trigger registration here — keeps unit tests free of Cloud Functions runtime.
 */

import {
  type ApplyBudgetNotificationResult,
  applyBudgetNotification,
  type BudgetObservation,
  type ParsedBudgetNotification,
  parseBudgetNotificationPayload,
} from "./billing-budget-guard-core";

export const SITE_SETTINGS_COLLECTION = "site_settings";
export const BILLING_PROTECTION_DOC_ID = "billing_protection";

const EXPECTED_PROJECT_ID = "eduatlas-dev";

export type BillingBudgetFirestoreLike = {
  collection(name: string): {
    doc(id: string): unknown;
  };
  runTransaction(fn: (tx: BillingBudgetTransactionLike) => Promise<void>): Promise<void>;
};

export type BillingBudgetTransactionLike = {
  get(ref: unknown): Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
  set(ref: unknown, data: Record<string, unknown>, options?: { merge: boolean }): void;
};

type ProcessBillingBudgetMessageInput = Readonly<{
  readonly payload: unknown;
  readonly messageId?: string | null;
  readonly publishTime?: string | null;
  readonly attributes?: Readonly<Record<string, string>> | null;
  readonly projectId?: string;
  readonly nowIso?: string;
}>;

export type ProcessBillingBudgetMessageResult = Readonly<{
  readonly outcome:
    | "processed"
    | "ignored_duplicate"
    | "ignored_stale"
    | "ignored_uninterpretable"
    | "invalid";
  readonly apply?: ApplyBudgetNotificationResult;
  readonly notification?: ParsedBudgetNotification;
}>;

function billingProtectionRef(db: BillingBudgetFirestoreLike) {
  return db.collection(SITE_SETTINGS_COLLECTION).doc(BILLING_PROTECTION_DOC_ID);
}

function fromFirestoreData(data: Record<string, unknown> | undefined): BudgetObservation | null {
  if (!data || typeof data.state !== "string") return null;
  return {
    state: data.state as BudgetObservation["state"],
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
    source: typeof data.source === "string" ? data.source : undefined,
    budgetRatio: typeof data.budgetRatio === "number" ? data.budgetRatio : undefined,
    rawThreshold: typeof data.rawThreshold === "number" ? data.rawThreshold : undefined,
    messageId: typeof data.messageId === "string" ? data.messageId : undefined,
    previousState:
      typeof data.previousState === "string"
        ? (data.previousState as BudgetObservation["previousState"])
        : undefined,
    overrideState:
      typeof data.overrideState === "string"
        ? (data.overrideState as BudgetObservation["overrideState"])
        : undefined,
    overrideUntil: typeof data.overrideUntil === "string" ? data.overrideUntil : undefined,
    overrideBy: typeof data.overrideBy === "string" ? data.overrideBy : undefined,
    reason: typeof data.reason === "string" ? data.reason : undefined,
    billingPeriodStart:
      typeof data.billingPeriodStart === "string" ? data.billingPeriodStart : undefined,
    lastCostAmount: typeof data.lastCostAmount === "number" ? data.lastCostAmount : undefined,
    lastObservedAt: typeof data.lastObservedAt === "string" ? data.lastObservedAt : undefined,
    currencyCode: typeof data.currencyCode === "string" ? data.currencyCode : undefined,
    forecastRatio: typeof data.forecastRatio === "number" ? data.forecastRatio : undefined,
  };
}

function toFirestoreData(observation: BudgetObservation): Record<string, unknown> {
  return {
    state: observation.state,
    updatedAt: observation.updatedAt ?? new Date().toISOString(),
    source: observation.source ?? "budget_pubsub",
    ...(typeof observation.budgetRatio === "number"
      ? { budgetRatio: observation.budgetRatio }
      : {}),
    ...(typeof observation.rawThreshold === "number"
      ? { rawThreshold: observation.rawThreshold }
      : {}),
    ...(observation.messageId ? { messageId: observation.messageId } : {}),
    ...(observation.previousState ? { previousState: observation.previousState } : {}),
    ...(observation.overrideState ? { overrideState: observation.overrideState } : {}),
    ...(observation.overrideUntil ? { overrideUntil: observation.overrideUntil } : {}),
    ...(observation.overrideBy ? { overrideBy: observation.overrideBy } : {}),
    ...(observation.reason ? { reason: observation.reason } : {}),
    ...(observation.billingPeriodStart
      ? { billingPeriodStart: observation.billingPeriodStart }
      : {}),
    ...(typeof observation.lastCostAmount === "number"
      ? { lastCostAmount: observation.lastCostAmount }
      : {}),
    ...(observation.lastObservedAt ? { lastObservedAt: observation.lastObservedAt } : {}),
    ...(observation.currencyCode ? { currencyCode: observation.currencyCode } : {}),
    ...(typeof observation.forecastRatio === "number"
      ? { forecastRatio: observation.forecastRatio }
      : {}),
  };
}

function logJson(level: "info" | "warn", payload: Record<string, unknown>): void {
  const line = JSON.stringify(payload);
  if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

/**
 * Uses a Firestore transaction for atomic updates.
 * Throws on transient Firestore failures so Pub/Sub can retry.
 */
export async function processBillingBudgetMessage(
  db: BillingBudgetFirestoreLike,
  input: ProcessBillingBudgetMessageInput,
): Promise<ProcessBillingBudgetMessageResult> {
  const parsed = parseBudgetNotificationPayload(input.payload);
  if (parsed.ok === false) {
    logJson("warn", {
      event: "billing_budget_notification_invalid",
      reason: parsed.reason,
      projectId: input.projectId ?? null,
      messageId: input.messageId ?? null,
      timestamp: new Date().toISOString(),
    });
    return { outcome: "invalid" };
  }

  const notification = parsed.notification;
  // Trust boundary = Pub/Sub topic. Attributes expose billingAccountId/budgetId only,
  // not Firebase project id — documented limitation.
  const projectId = input.projectId ?? process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT;

  let applyResult: ApplyBudgetNotificationResult | undefined;

  await db.runTransaction(async (tx) => {
    const ref = billingProtectionRef(db);
    const snap = await tx.get(ref);
    const previous = fromFirestoreData(snap.exists ? snap.data() : undefined);
    const apply = applyBudgetNotification({
      previous,
      notification,
      messageId: input.messageId,
      observedAt: input.publishTime,
      nowIso: input.nowIso,
      projectId,
    });
    applyResult = apply;

    if (apply.action === "ignored_duplicate" || apply.action === "ignored_stale") {
      return;
    }
    if (apply.action !== "applied" || !apply.next) {
      return;
    }

    tx.set(ref, toFirestoreData(apply.next), { merge: false });
  });

  if (!applyResult) {
    return { outcome: "ignored_uninterpretable", notification };
  }

  if (applyResult.action === "ignored_duplicate") {
    logJson("info", {
      event: "billing_budget_notification_processed",
      projectId: projectId ?? null,
      budgetDisplayName: notification.budgetDisplayName,
      costAmount: notification.costAmount,
      budgetAmount: notification.budgetAmount,
      ratio: notification.ratio,
      previousState: applyResult.previousState,
      newState: applyResult.newState,
      billingPeriodStart: notification.billingPeriodStart,
      duplicate: true,
    });
    return { outcome: "ignored_duplicate", apply: applyResult, notification };
  }

  if (applyResult.action === "ignored_stale") {
    logJson("info", {
      event: "billing_budget_notification_ignored_stale",
      projectId: projectId ?? null,
      budgetDisplayName: notification.budgetDisplayName,
      costAmount: notification.costAmount,
      budgetAmount: notification.budgetAmount,
      ratio: notification.ratio,
      reason: applyResult.reason,
      billingPeriodStart: notification.billingPeriodStart,
      messageId: input.messageId ?? null,
    });
    return { outcome: "ignored_stale", apply: applyResult, notification };
  }

  logJson("info", {
    event: "billing_budget_notification_processed",
    projectId: projectId ?? EXPECTED_PROJECT_ID,
    budgetDisplayName: notification.budgetDisplayName,
    costAmount: notification.costAmount,
    budgetAmount: notification.budgetAmount,
    ratio: notification.ratio,
    previousState: applyResult.previousState,
    newState: applyResult.newState,
    billingPeriodStart: notification.billingPeriodStart,
    messageId: input.messageId ?? null,
  });

  if (applyResult.previousState !== applyResult.newState) {
    logJson("warn", {
      event: "billing_protection_state_changed",
      projectId: projectId ?? EXPECTED_PROJECT_ID,
      previousState: applyResult.previousState,
      newState: applyResult.newState,
      ratio: notification.ratio,
      billingPeriodStart: notification.billingPeriodStart,
      reason: applyResult.reason,
      timestamp: new Date().toISOString(),
    });
  }

  return { outcome: "processed", apply: applyResult, notification };
}
