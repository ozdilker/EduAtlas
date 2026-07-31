/**
 * Verifies Owner Insights aggregations against Firestore development seed data.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getOwnerInsights } from "@eduatlas/application";
import {
  createFirestoreInstitutionRepository,
  createFirestoreLeadRepository,
  getAdminFirestore,
} from "../src/server/index";

const OWNER_DEMO_INSTITUTION_ID = "seed_inst_ist_kolej_1";

const envPath = resolve("apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) continue;
  const key = trimmed.slice(0, eq);
  let value = trimmed.slice(eq + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

const firestore = getAdminFirestore();
const institutionRepository = createFirestoreInstitutionRepository(firestore);
const leadRepository = createFirestoreLeadRepository(firestore);

const listed = await leadRepository.listByInstitutionId(OWNER_DEMO_INSTITUTION_ID);
const insights = await getOwnerInsights(
  { institutionId: OWNER_DEMO_INSTITUTION_ID },
  { institutionRepository, leadRepository },
);

if (!insights) {
  throw new Error("getOwnerInsights returned null for development seed institution.");
}

const mismatches: string[] = [];

if (insights.totalLeads !== listed.length) {
  mismatches.push(`totalLeads ${insights.totalLeads} !== listed ${listed.length}`);
}

const distributionTotal = insights.statusDistribution.reduce((sum, item) => sum + item.count, 0);
if (distributionTotal !== listed.length) {
  mismatches.push(`statusDistribution total ${distributionTotal} !== ${listed.length}`);
}

const funnelTotal = insights.conversionFunnel.reduce((sum, step) => sum + step.count, 0);
if (funnelTotal > listed.length) {
  mismatches.push(`funnel total ${funnelTotal} > listed ${listed.length}`);
}

if (insights.conversionFunnel.length !== 5) {
  mismatches.push(`funnel steps ${insights.conversionFunnel.length} !== 5`);
}

if (insights.businessInsights.length < 1) {
  mismatches.push("expected business insights");
}

if (insights.averageResponseTime.kind !== "placeholder") {
  mismatches.push("averageResponseTime should be placeholder");
}
if (insights.topLeadSource.kind !== "placeholder") {
  mismatches.push("topLeadSource should be placeholder");
}
if (insights.growthTrend.kind !== "placeholder") {
  mismatches.push("growthTrend should be placeholder");
}

console.log(
  JSON.stringify(
    {
      institutionId: insights.institutionId,
      institutionName: insights.institutionName,
      totalLeads: insights.totalLeads,
      newLeadsLast30Days: insights.newLeadsLast30Days,
      previousPeriodLeads: insights.previousPeriodLeads,
      statusDistribution: insights.statusDistribution,
      conversionFunnel: insights.conversionFunnel,
      profileCompleteness: insights.profileCompleteness.overallPercentage,
      businessInsights: insights.businessInsights.map((item) => item.message),
      recommendationCount: insights.recommendations.length,
      mismatches,
    },
    null,
    2,
  ),
);

if (listed.length < 1) {
  throw new Error("Expected development seed leads for owner insights.");
}
if (mismatches.length > 0) {
  throw new Error(`Owner insights verification failed: ${mismatches.join(" | ")}`);
}
