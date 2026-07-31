import { getOwnerDashboard, getOwnerLeadPipeline, updateLeadStatus } from "@eduatlas/application";
import { createInstitutionId, createLeadId, LeadStatus, leadIdAsString } from "@eduatlas/domain";
import {
  createSeededInstitutionRepository,
  FirestoreLeadRepository,
  InMemoryLeadDocumentStore,
} from "@eduatlas/firebase/server";
import { describe, expect, it } from "vitest";
import { getOwnerLeadPipelineView, getOwnerPortalSnapshot } from "./get-owner-portal";
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

describe("owner lead pipeline", () => {
  it("dashboard summary reflects pipeline stage counts", async () => {
    const repos = await createTestRepos();
    const snapshot = await getOwnerPortalSnapshot(repos);

    expect(snapshot?.data.leadSummary.newCount).toBeGreaterThanOrEqual(1);
    expect(snapshot?.data.leadSummary.contactedCount).toBeGreaterThanOrEqual(1);
    expect(snapshot?.data.leadSummary.appointmentCount).toBeGreaterThanOrEqual(1);
    expect(snapshot?.data.leadSummary.enrolledCount).toBeGreaterThanOrEqual(1);
    expect(snapshot?.data.leadSummary.lostCount).toBeGreaterThanOrEqual(1);
  });

  it("maps live rule-based recommendations onto the portal view", async () => {
    const repos = await createTestRepos();
    const snapshot = await getOwnerPortalSnapshot(repos);

    expect(snapshot?.data.recommendations.count).toBeGreaterThan(0);
    expect(snapshot?.data.recommendations.items).toHaveLength(
      snapshot?.data.recommendations.count ?? 0,
    );
    expect(
      snapshot?.data.recommendations.items.every((item) => item.ruleId.startsWith("rule_")),
    ).toBe(true);
  });

  it("maps profile completeness card onto the portal view", async () => {
    const repos = await createTestRepos();
    const snapshot = await getOwnerPortalSnapshot(repos);

    expect(snapshot?.data.profileCompleteness.overallPercentage).toBeGreaterThanOrEqual(0);
    expect(snapshot?.data.profileCompleteness.overallPercentage).toBeLessThanOrEqual(100);
    expect(snapshot?.data.profileCompleteness.nextActionHint.length).toBeGreaterThan(0);
    expect(snapshot?.data.profileCompleteness.missingCount).toBe(
      snapshot?.data.profileCompleteness.missingSectionLabels.length,
    );
  });

  it("pipeline board groups leads by stage", async () => {
    const repos = await createTestRepos();
    const view = await getOwnerLeadPipelineView(repos);

    expect(view).not.toBeNull();
    expect(view?.columns).toHaveLength(5);
    expect(view?.columns.map((column) => column.status)).toEqual([
      "new",
      "contacted",
      "appointment",
      "enrolled",
      "lost",
    ]);
    expect(view?.totalInPipeline).toBeGreaterThan(0);
  });

  it("updateLeadStatus moves a lead and updates aggregation", async () => {
    const repos = await createTestRepos();
    const before = await getOwnerDashboard({ institutionId: OWNER_DEMO_INSTITUTION_ID }, repos);
    const target = before?.pendingLeads[0] ?? before?.recentLeads[0];
    expect(target).toBeDefined();
    if (!target) {
      return;
    }

    await updateLeadStatus(
      {
        leadId: leadIdAsString(target.id),
        status: LeadStatus.Enrolled,
        institutionId: OWNER_DEMO_INSTITUTION_ID,
      },
      { leadRepository: repos.leadRepository },
    );

    const after = await getOwnerDashboard({ institutionId: OWNER_DEMO_INSTITUTION_ID }, repos);
    const pipeline = await getOwnerLeadPipeline(
      { institutionId: OWNER_DEMO_INSTITUTION_ID },
      { leadRepository: repos.leadRepository },
    );
    const enrolledColumn = pipeline.columns.find((column) => column.status === LeadStatus.Enrolled);

    expect(after?.leadSummary.byPipeline.enrolled).toBe(
      (before?.leadSummary.byPipeline.enrolled ?? 0) +
        (target.status === LeadStatus.Enrolled ? 0 : 1),
    );
    expect(
      enrolledColumn?.leads.some((lead) => leadIdAsString(lead.id) === leadIdAsString(target.id)),
    ).toBe(true);

    const institution = await repos.institutionRepository.getById(
      createInstitutionId(OWNER_DEMO_INSTITUTION_ID),
    );
    expect(institution?.name).toBe("Kadıköy Marmara Koleji");
    expect(
      await repos.leadRepository.getById(createLeadId(leadIdAsString(target.id))),
    ).not.toBeNull();
  });
});
