import {
  type createInstitutionId,
  createLead,
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
  type Lead,
  LeadStatus,
  leadIdAsString,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { LeadRepository } from "../leads/lead-repository";
import { getOwnerDashboard } from "./get-owner-dashboard";
import { buildOwnerLeadSummary } from "./owner-dashboard-model";

class InMemoryLeadRepository implements LeadRepository {
  constructor(private readonly leads: Lead[]) {}

  async getById(id: Parameters<LeadRepository["getById"]>[0]) {
    return this.leads.find((lead) => leadIdAsString(lead.id) === id.value) ?? null;
  }

  async listByInstitutionId(institutionId: string) {
    return this.leads
      .filter((lead) => lead.institutionId.value === institutionId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async save(lead: Lead) {
    this.leads.push(lead);
    return lead;
  }

  async updateStatus(id: Parameters<LeadRepository["updateStatus"]>[0], status: LeadStatus) {
    const existing = await this.getById(id);
    if (!existing) throw new Error("missing");
    const updated = { ...existing, status, updatedAt: new Date().toISOString() } as Lead;
    const index = this.leads.findIndex((lead) => leadIdAsString(lead.id) === id.value);
    if (index >= 0) {
      this.leads[index] = updated;
    }
    return updated;
  }
}

class StubInstitutionRepository implements Pick<InstitutionRepository, "getById"> {
  async getById(id: ReturnType<typeof createInstitutionId>) {
    if (id.value !== "inst_dash_1") return null;
    return createPublishedInstitution({
      id: id.value,
      name: "Dashboard Test Koleji",
      slug: "dashboard-test-koleji",
      primaryType: InstitutionType.PrivateSchool,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_istanbul",
        districtId: "dist_kadikoy",
        address: "Test",
      },
      shortDescription: "Test kurum",
      publishedAt: "2026-07-14T10:00:00.000Z",
      createdAt: "2026-07-14T10:00:00.000Z",
      updatedAt: "2026-07-14T10:00:00.000Z",
    });
  }
}

function lead(id: string, status: LeadStatus, createdAt: string): Lead {
  return createLead({
    id,
    institutionId: "inst_dash_1",
    parentName: `Parent ${id}`,
    phone: "+90 532 100 00 00",
    message: "Test mesajı",
    status,
    consentAcceptedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  });
}

describe("getOwnerDashboard application service", () => {
  it("aggregates lead summary, pending, and recent leads via repositories", async () => {
    const leads = [
      lead("lead_a", LeadStatus.New, "2026-07-14T12:00:00.000Z"),
      lead("lead_b", LeadStatus.New, "2026-07-14T11:00:00.000Z"),
      lead("lead_c", LeadStatus.Read, "2026-07-14T10:00:00.000Z"),
      lead("lead_d", LeadStatus.Contacted, "2026-07-14T09:00:00.000Z"),
      lead("lead_e", LeadStatus.Spam, "2026-07-14T08:00:00.000Z"),
    ];

    const dashboard = await getOwnerDashboard(
      { institutionId: "inst_dash_1", recentLimit: 3, pendingLimit: 2 },
      {
        institutionRepository: new StubInstitutionRepository() as unknown as InstitutionRepository,
        leadRepository: new InMemoryLeadRepository(leads),
      },
    );

    expect(dashboard).not.toBeNull();
    expect(dashboard?.institutionSummary.institution.name).toBe("Dashboard Test Koleji");
    expect(dashboard?.leadSummary.total).toBe(5);
    expect(dashboard?.leadSummary.pending).toBe(2);
    expect(dashboard?.leadSummary.byStatus.new).toBe(2);
    expect(dashboard?.leadSummary.byStatus.spam).toBe(1);
    expect(dashboard?.leadSummary.byPipeline.contacted).toBe(1);
    expect(dashboard?.leadSummary.byPipeline.appointment).toBe(0);
    expect(dashboard?.pendingLeads).toHaveLength(2);
    expect(dashboard?.recentLeads).toHaveLength(3);
    expect(dashboard?.leadTrend.kind).toBe("placeholder");
    expect(dashboard?.recommendations.count).toBeGreaterThan(0);
    expect(dashboard?.recommendations.recommendations.length).toBe(
      dashboard?.recommendations.count,
    );
    expect(dashboard?.profileCompleteness.overallPercentage).toBeGreaterThanOrEqual(0);
    expect(dashboard?.profileCompleteness.nextActionHint.length).toBeGreaterThan(0);
  });

  it("returns null when institution is missing", async () => {
    const dashboard = await getOwnerDashboard(
      { institutionId: "missing" },
      {
        institutionRepository: new StubInstitutionRepository() as unknown as InstitutionRepository,
        leadRepository: new InMemoryLeadRepository([]),
      },
    );
    expect(dashboard).toBeNull();
  });

  it("buildOwnerLeadSummary counts statuses without Firebase", () => {
    const summary = buildOwnerLeadSummary({
      leads: [
        lead("1", LeadStatus.New, "2026-07-14T12:00:00.000Z"),
        lead("2", LeadStatus.Closed, "2026-07-14T11:00:00.000Z"),
      ],
    });
    expect(summary.total).toBe(2);
    expect(summary.pending).toBe(1);
    expect(summary.byStatus.closed).toBe(1);
  });
});
