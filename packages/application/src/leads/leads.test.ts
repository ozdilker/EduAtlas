import {
  type createInstitutionId,
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
  type Lead,
  LeadStatus,
  leadIdAsString,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { isLeadSpamRejectedError, isLeadValidationError, LeadSpamRejectedError } from "./errors";
import type { LeadRepository } from "./lead-repository";
import { submitLead } from "./submit-lead";

class InMemoryLeadRepository implements LeadRepository {
  private readonly byId = new Map<string, Lead>();

  async getById(id: Parameters<LeadRepository["getById"]>[0]) {
    return this.byId.get(leadIdAsString(id)) ?? null;
  }

  async listByInstitutionId(institutionId: string) {
    return [...this.byId.values()].filter((lead) => lead.institutionId.value === institutionId);
  }

  async save(lead: Lead) {
    this.byId.set(leadIdAsString(lead.id), lead);
    return lead;
  }

  async updateStatus(id: Parameters<LeadRepository["updateStatus"]>[0], status: LeadStatus) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("missing");
    }
    const updated = { ...existing, status, updatedAt: new Date().toISOString() } as Lead;
    this.byId.set(leadIdAsString(id), updated);
    return updated;
  }
}

class StubInstitutionRepository implements Pick<InstitutionRepository, "getById"> {
  constructor(private readonly exists: boolean) {}

  async getById(id: ReturnType<typeof createInstitutionId>) {
    if (!this.exists) return null;
    return createPublishedInstitution({
      id: id.value,
      name: "Test Kurum",
      slug: "test-kurum",
      primaryType: InstitutionType.Kindergarten,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_istanbul",
        districtId: "dist_kadikoy",
        address: "Test",
      },
      shortDescription: "Test açıklama",
      publishedAt: "2026-07-14T10:00:00.000Z",
      createdAt: "2026-07-14T10:00:00.000Z",
      updatedAt: "2026-07-14T10:00:00.000Z",
    });
  }
}

describe("submitLead application service", () => {
  it("stores a valid lead through the repository", async () => {
    const leadRepository = new InMemoryLeadRepository();
    const result = await submitLead(
      {
        institutionId: "inst_1",
        parentName: "Ayşe Yılmaz",
        phone: "+90 532 111 22 33",
        message: "Kontenjan var mı?",
        consentAccepted: true,
        leadId: "lead_test_1",
        now: "2026-07-14T15:00:00.000Z",
      },
      {
        leadRepository,
        institutionRepository: new StubInstitutionRepository(
          true,
        ) as unknown as InstitutionRepository,
      },
    );

    expect(result.lead.status).toBe(LeadStatus.New);
    expect(await leadRepository.getById(result.lead.id)).not.toBeNull();
  });

  it("updates lead pipeline status through the repository", async () => {
    const { updateLeadStatus } = await import("./update-lead-status");
    const leadRepository = new InMemoryLeadRepository();
    const created = await submitLead(
      {
        institutionId: "inst_1",
        parentName: "Ayşe Yılmaz",
        phone: "+90 532 111 22 33",
        message: "Kontenjan var mı?",
        consentAccepted: true,
        leadId: "lead_pipeline_1",
        now: "2026-07-14T15:00:00.000Z",
      },
      {
        leadRepository,
        institutionRepository: new StubInstitutionRepository(
          true,
        ) as unknown as InstitutionRepository,
      },
    );

    const updated = await updateLeadStatus(
      {
        leadId: leadIdAsString(created.lead.id),
        status: LeadStatus.Appointment,
        institutionId: "inst_1",
      },
      { leadRepository },
    );

    expect(updated.lead.status).toBe(LeadStatus.Appointment);
  });

  it("rejects honeypot spam and missing consent", async () => {
    const deps = {
      leadRepository: new InMemoryLeadRepository(),
      institutionRepository: new StubInstitutionRepository(
        true,
      ) as unknown as InstitutionRepository,
    };

    await expect(
      submitLead(
        {
          institutionId: "inst_1",
          parentName: "Bot",
          phone: "+90 532 111 22 33",
          message: "spam",
          consentAccepted: true,
          honeypot: "http://spam.example",
        },
        deps,
      ),
    ).rejects.toBeInstanceOf(LeadSpamRejectedError);

    await expect(
      submitLead(
        {
          institutionId: "inst_1",
          parentName: "Ayşe",
          phone: "+90 532 111 22 33",
          message: "Merhaba",
          consentAccepted: false,
        },
        deps,
      ),
    ).rejects.toSatisfy(isLeadValidationError);
  });

  it("rejects unknown institutions", async () => {
    await expect(
      submitLead(
        {
          institutionId: "missing",
          parentName: "Ayşe",
          phone: "+90 532 111 22 33",
          message: "Merhaba",
          consentAccepted: true,
        },
        {
          leadRepository: new InMemoryLeadRepository(),
          institutionRepository: new StubInstitutionRepository(
            false,
          ) as unknown as InstitutionRepository,
        },
      ),
    ).rejects.toSatisfy((error) => !isLeadSpamRejectedError(error));
  });
});
