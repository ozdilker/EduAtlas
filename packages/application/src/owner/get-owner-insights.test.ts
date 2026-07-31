import {
  createLead,
  createPublishedInstitution,
  evaluateInstitutionProfileCompleteness,
  InstitutionType,
  InstitutionVerification,
  LeadStatus,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { LeadRepository } from "../leads/lead-repository";
import { getOwnerInsights } from "./get-owner-insights";
import {
  buildLeadConversionFunnel,
  buildLeadStatusDistribution,
  countLeadsInWindow,
  generateOwnerBusinessInsights,
} from "./owner-insights-model";

const NOW = "2026-07-14T18:00:00.000Z";

function institution() {
  return createPublishedInstitution({
    id: "inst_insights_1",
    name: "Insights Test Koleji",
    slug: "insights-test-koleji",
    primaryType: InstitutionType.PrivateSchool,
    verification: InstitutionVerification.Verified,
    location: {
      cityId: "city_istanbul",
      districtId: "dist_kadikoy",
      address: "Test Cad. No:1",
    },
    contact: { phone: "+90 216 000 00 00", email: "info@test.edu.tr" },
    shortDescription: "Kısa açıklama",
    programsSummary: "Programlar",
    publishedAt: "2026-07-01T10:00:00.000Z",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
  });
}

function lead(id: string, status: LeadStatus, createdAt: string) {
  return createLead({
    id,
    institutionId: "inst_insights_1",
    parentName: `Parent ${id}`,
    phone: "+90 532 100 00 00",
    message: "Test",
    status,
    consentAcceptedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  });
}

class StubInstitutionRepository implements Pick<InstitutionRepository, "getById"> {
  constructor(private readonly value: ReturnType<typeof institution> | null) {}
  async getById() {
    return this.value;
  }
}

class InMemoryLeadRepository implements Pick<LeadRepository, "listByInstitutionId"> {
  constructor(private readonly leads: ReturnType<typeof lead>[]) {}
  async listByInstitutionId() {
    return this.leads;
  }
}

describe("owner insights model", () => {
  it("counts leads in rolling windows", () => {
    const leads = [
      lead("a", LeadStatus.New, "2026-07-10T10:00:00.000Z"),
      lead("b", LeadStatus.New, "2026-06-01T10:00:00.000Z"),
      lead("c", LeadStatus.Contacted, "2026-05-01T10:00:00.000Z"),
    ];
    expect(countLeadsInWindow(leads, NOW, 30, 0)).toBe(1);
    expect(countLeadsInWindow(leads, NOW, 30, 30)).toBe(1);
  });

  it("builds status distribution and funnel percentages", () => {
    const leads = [
      lead("a", LeadStatus.New, NOW),
      lead("b", LeadStatus.New, NOW),
      lead("c", LeadStatus.Contacted, NOW),
      lead("d", LeadStatus.Enrolled, NOW),
    ];
    const distribution = buildLeadStatusDistribution(leads);
    expect(distribution.find((item) => item.status === LeadStatus.New)?.count).toBe(2);
    expect(distribution.find((item) => item.status === LeadStatus.New)?.percentage).toBe(50);

    const funnel = buildLeadConversionFunnel(leads);
    expect(funnel).toHaveLength(5);
    expect(funnel[0]?.status).toBe(LeadStatus.New);
  });

  it("generates rule-based business insights", () => {
    const inst = institution();
    const leads = [
      lead("a", LeadStatus.New, "2026-07-10T10:00:00.000Z"),
      lead("b", LeadStatus.New, "2026-07-05T10:00:00.000Z"),
      lead("c", LeadStatus.New, "2026-06-20T10:00:00.000Z"),
    ];
    const completeness = evaluateInstitutionProfileCompleteness(inst);
    const insights = generateOwnerBusinessInsights({
      institution: inst,
      leads,
      totalLeads: leads.length,
      newLeadsLast30Days: 2,
      previousPeriodLeads: 1,
      profileCompleteness: completeness,
    });

    expect(insights.some((item) => item.message.includes("3 talep"))).toBe(true);
    expect(insights.some((item) => item.message.includes("arttı"))).toBe(true);
    expect(insights.some((item) => item.message.includes("ilk yanıtı bekliyor"))).toBe(true);
    expect(
      insights.some((item) => item.message.includes(`%${completeness.overallPercentage}`)),
    ).toBe(true);
  });
});

describe("getOwnerInsights", () => {
  it("aggregates metrics, placeholders, insights, and recommendations", async () => {
    const leads = [
      lead("a", LeadStatus.New, "2026-07-10T10:00:00.000Z"),
      lead("b", LeadStatus.Contacted, "2026-07-01T10:00:00.000Z"),
      lead("c", LeadStatus.Enrolled, "2026-06-20T10:00:00.000Z"),
      lead("d", LeadStatus.Lost, "2026-05-01T10:00:00.000Z"),
    ];

    const insights = await getOwnerInsights(
      { institutionId: "inst_insights_1", now: NOW },
      {
        institutionRepository: new StubInstitutionRepository(
          institution(),
        ) as unknown as InstitutionRepository,
        leadRepository: new InMemoryLeadRepository(leads) as unknown as LeadRepository,
      },
    );

    expect(insights).not.toBeNull();
    expect(insights?.totalLeads).toBe(4);
    expect(insights?.newLeadsLast30Days).toBe(3);
    expect(insights?.previousPeriodLeads).toBe(0);
    expect(insights?.statusDistribution.length).toBeGreaterThan(0);
    expect(insights?.conversionFunnel).toHaveLength(5);
    expect(insights?.averageResponseTime.kind).toBe("placeholder");
    expect(insights?.topLeadSource.kind).toBe("placeholder");
    expect(insights?.growthTrend.kind).toBe("placeholder");
    expect(insights?.businessInsights.length).toBeGreaterThan(0);
    expect(insights?.profileCompleteness.overallPercentage).toBeGreaterThanOrEqual(0);
  });

  it("returns null for missing institution", async () => {
    const insights = await getOwnerInsights(
      { institutionId: "missing" },
      {
        institutionRepository: new StubInstitutionRepository(
          null,
        ) as unknown as InstitutionRepository,
        leadRepository: new InMemoryLeadRepository([]) as unknown as LeadRepository,
      },
    );
    expect(insights).toBeNull();
  });
});
