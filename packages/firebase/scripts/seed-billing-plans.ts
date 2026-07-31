/**
 * Upserts default FREE / PRO / PREMIUM billing plans.
 *
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/seed-billing-plans.ts
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  buildDefaultBillingPlans,
  createFirestoreBillingPlanRepository,
} from "../src/billing";

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

async function main() {
  initAdmin();
  const repo = createFirestoreBillingPlanRepository(getFirestore());
  const plans = buildDefaultBillingPlans();
  for (const plan of plans) {
    await repo.save(plan);
    console.log(`saved ${plan.code} (${plan.monthlyPriceTry}/${plan.yearlyPriceTry} TRY)`);
  }
  console.log(`Done. ${plans.length} plans upserted.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
