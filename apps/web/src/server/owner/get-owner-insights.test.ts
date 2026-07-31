import { getOwnerInsights } from "@eduatlas/application";
import {
  createSeededInstitutionRepository,
  FirestoreLeadRepository,
  InMemoryLeadDocumentStore,
} from "@eduatlas/firebase/server";
import { describe, expect, it } from "vitest";
import { getOwnerInsightsView } from "./get-owner-insights";
import { OWNER_DEMO_INSTITUTION_ID } from "./owner-demo-context";
import { createOwnerDemoLeadDocuments } from "./owner-demo-leads";

async function createTestRepos() {
  const store = new InMemoryLeadDocumentStore();
  for (const doc of createOwnerDemoLeadDocuments(OWNER_DEMO_INSTITUTION_ID)) {
    await store.create(doc.id, doc.data);
  }

  return {
    institutionRepository: await createSeededInstitutionRepository(),
    leadRepository: new FirestoreLeadRepository({ store }),
  };
}

describe("owner insights view", () => {
  it("maps getOwnerInsights into view data with widgets and insights", async () => {
    const repos = await createTestRepos();
    const view = await getOwnerInsightsView(repos);

    expect(view).not.toBeNull();
    expect(view?.institutionId).toBe(OWNER_DEMO_INSTITUTION_ID);
    expect(view?.totalLeads).toBeGreaterThan(0);
    expect(view?.statusDistribution.length).toBeGreaterThan(0);
    expect(view?.conversionFunnel).toHaveLength(5);
    expect(view?.averageResponseTime.kind).toBe("placeholder");
    expect(view?.topLeadSource.kind).toBe("placeholder");
    expect(view?.growthTrend.kind).toBe("placeholder");
    expect(view?.businessInsights.length).toBeGreaterThan(0);
    expect(view?.profileCompleteness.overallPercentage).toBeGreaterThanOrEqual(0);
  });

  it("aggregates insights via application service", async () => {
    const repos = await createTestRepos();
    const insights = await getOwnerInsights({ institutionId: OWNER_DEMO_INSTITUTION_ID }, repos);

    expect(insights?.totalLeads).toBeGreaterThan(0);
    expect(insights?.conversionFunnel.reduce((sum, step) => sum + step.count, 0)).toBe(
      insights?.statusDistribution
        .filter((item) =>
          ["new", "contacted", "appointment", "enrolled", "lost"].includes(item.status),
        )
        .reduce((sum, item) => sum + item.count, 0),
    );
  });
});
