/**
 * Gen2 Pub/Sub → Firestore billing protection circuit breaker.
 *
 * Trigger topic: eduatlas-billing-budget
 * Writes: site_settings/billing_protection
 *
 * Does NOT disable Cloud Billing / project billing.
 */

import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { processBillingBudgetMessage } from "./billing-budget-guard-process";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/** Matches Gen1 lead-counter region; Firestore DB is eur3. */
export const BILLING_BUDGET_GUARD_REGION = "europe-west1";

export const BILLING_BUDGET_TOPIC = "eduatlas-billing-budget";

const EXPECTED_PROJECT_ID = "eduatlas-dev";

/**
 * Cloud Functions Gen2 Pub/Sub trigger.
 * Firebase will create/manage its own Eventarc/Pub/Sub subscription for this function.
 * Existing manual subscription `eduatlas-billing-budget-sub` is left untouched (may be redundant).
 */
export const billingBudgetGuard = onMessagePublished(
  {
    topic: BILLING_BUDGET_TOPIC,
    region: BILLING_BUDGET_GUARD_REGION,
    memory: "256MiB",
    timeoutSeconds: 60,
    maxInstances: 5,
    retry: true,
  },
  async (event) => {
    const message = event.data.message;
    let payload: unknown = null;
    try {
      payload = message.json;
    } catch {
      if (message.data) {
        try {
          payload = JSON.parse(Buffer.from(message.data, "base64").toString("utf8"));
        } catch {
          payload = null;
        }
      }
    }

    if (payload === null || payload === undefined) {
      logger.warn(
        JSON.stringify({
          event: "billing_budget_notification_invalid",
          reason: "missing_or_non_json_payload",
          messageId: message.messageId ?? null,
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }

    const publishTime =
      typeof message.publishTime === "string"
        ? message.publishTime
        : typeof event.time === "string"
          ? event.time
          : null;

    await processBillingBudgetMessage(admin.firestore(), {
      payload,
      messageId: message.messageId ?? null,
      publishTime,
      attributes: message.attributes ?? null,
      projectId: process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? EXPECTED_PROJECT_ID,
    });
  },
);

export {
  BILLING_PROTECTION_DOC_ID,
  processBillingBudgetMessage,
  SITE_SETTINGS_COLLECTION,
} from "./billing-budget-guard-process";
