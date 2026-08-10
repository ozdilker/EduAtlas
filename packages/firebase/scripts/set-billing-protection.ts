/**
 * DEVELOPMENT / TESTING ONLY — manually set billing circuit-breaker state.
 *
 * Does NOT create a public endpoint. Does NOT change Cloud Billing.
 * Does NOT deploy Pub/Sub consumers.
 *
 * Usage:
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/set-billing-protection.ts NORMAL
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/set-billing-protection.ts WARNING
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/set-billing-protection.ts PROTECTION
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/set-billing-protection.ts EMERGENCY
 *
 * Optional reason:
 *   ... PROTECTION --reason "phase1_manual_test"
 */
import { setBillingProtection } from "@eduatlas/application";
import { type BillingProtectionState, isBillingProtectionState } from "@eduatlas/domain";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createFirestoreBillingProtectionRepository } from "../src/site/firestore-billing-protection-repository";

function initAdmin() {
  if (getApps().length > 0) return;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replaceAll("\\n", "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials");
  }
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

function parseArgs(argv: readonly string[]): {
  state: BillingProtectionState;
  reason: string;
} {
  const stateArg = argv[0];
  if (!isBillingProtectionState(stateArg)) {
    throw new Error(
      `Invalid state "${String(stateArg)}". Use NORMAL | WARNING | PROTECTION | EMERGENCY`,
    );
  }
  let reason = "manual_dev_script";
  const reasonIdx = argv.indexOf("--reason");
  if (reasonIdx >= 0) {
    const value = argv[reasonIdx + 1];
    if (value) reason = value;
  }
  return { state: stateArg, reason };
}

async function main() {
  const { state, reason } = parseArgs(process.argv.slice(2));
  initAdmin();
  const repo = createFirestoreBillingProtectionRepository(getFirestore());
  const saved = await setBillingProtection(
    {
      state,
      source: "manual",
      reason,
      overrideBy: "set-billing-protection.ts",
    },
    { billingProtectionRepository: repo },
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        path: "site_settings/billing_protection",
        state: saved.state,
        previousState: saved.previousState ?? null,
        source: saved.source,
        reason: saved.reason ?? null,
        updatedAt: saved.updatedAt,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
