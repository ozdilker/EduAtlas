import {
  CampaignStatus,
  createCampaignSegment,
  createCampaignTemplate,
  createInstitution,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { loadOutreachDeliveryConfig } from "../delivery/delivery-config";
import { createInMemoryDeliveryJobRepository } from "../delivery/in-memory-delivery-job-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { createInMemoryOutreachQueue } from "./outreach-queue";
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import { createOutreachService } from "./outreach-service";
import {
  CLAIM_INVITATION_TEMPLATE_ID,
  ensureOutreachSeeds,
  ISTANBUL_UNCLAIMED_SEGMENT_ID,
} from "./outreach-seeds";

const NOW = "2026-08-02T19:00:00.000Z";

function memoryInstitutionRepo(
  institutions: ReturnType<typeof createInstitution>[],
): InstitutionRepository {
  return {
    async getById() {
      return null;
    },
    async getBySlug() {
      return null;
    },
    async list() {
      return {
        items: Object.freeze(institutions),
        page: 1,
        pageSize: Math.max(institutions.length, 1),
        totalItems: institutions.length,
        totalPages: institutions.length === 0 ? 0 : 1,
      };
    },
    async save(i) {
      return i;
    },
    async update(i) {
      return i;
    },
    async delete() {
      return;
    },
  };
}

describe("OutreachService prepare/approve/run", () => {
  it("prepares warm-up batch, approves, and enforces single running", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const queue = createInMemoryOutreachQueue();
    const institutions = [1, 2, 3].map((n) =>
      createInstitution({
        id: `inst_${n}`,
        name: `Okul ${n}`,
        slug: `okul-${n}`,
        primaryType: InstitutionType.Kindergarten,
        status: InstitutionStatus.Published,
        verification: InstitutionVerification.Unclaimed,
        location: { cityId: "istanbul", districtId: "kadikoy", address: "a" },
        contact: { email: `okul${n}@example.com` },
        socialLinks: {},
        shortDescription: "d",
        createdAt: NOW,
        updatedAt: NOW,
        publishedAt: NOW,
      }),
    );

    const service = createOutreachService({
      ...stores,
      queue,
      deliveryJobRepository: jobs,
      institutionRepository: memoryInstitutionRepo(institutions),
      deliveryConfig: loadOutreachDeliveryConfig({
        OUTREACH_WARMUP_BATCH_SIZE: "2",
      }),
    });

    await ensureOutreachSeeds({
      templateRepository: stores.templateRepository,
      segmentRepository: stores.segmentRepository,
      now: NOW,
    });

    // Override segment city to istanbul (seed already uses istanbul)
    await stores.segmentRepository.update(
      createCampaignSegment({
        id: ISTANBUL_UNCLAIMED_SEGMENT_ID,
        name: "Istanbul",
        filters: { cityId: "istanbul", verification: "unclaimed", hasEmail: true },
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    await service.createCampaign({
      id: "camp_p1",
      name: "Prepare me",
      templateId: CLAIM_INVITATION_TEMPLATE_ID,
      segmentId: ISTANBUL_UNCLAIMED_SEGMENT_ID,
      subjectOverride: "Subj",
      preheader: "Pre",
      createdAt: NOW,
      createdBy: "admin",
    });

    const prepared = await service.prepareCampaign("camp_p1", NOW);
    expect(prepared.recipientCount).toBe(2);

    const progress = await service.getProgress("camp_p1");
    expect(progress.total).toBe(2);
    expect(progress.queued).toBe(2);

    await expect(service.start("camp_p1", NOW)).rejects.toThrow(/ready/i);

    const approved = await service.approveCampaign("camp_p1", NOW);
    expect(approved.status).toBe(CampaignStatus.Ready);

    const running = await service.start("camp_p1", NOW);
    expect(running.status).toBe(CampaignStatus.Running);

    await service.createCampaign({
      id: "camp_p2",
      name: "Other",
      templateId: CLAIM_INVITATION_TEMPLATE_ID,
      segmentId: ISTANBUL_UNCLAIMED_SEGMENT_ID,
      subjectOverride: "S",
      preheader: "P",
      createdAt: NOW,
      createdBy: "admin",
    });
    // second campaign prepare+approve
    await service.prepareCampaign("camp_p2", NOW);
    await service.approveCampaign("camp_p2", NOW);
    await expect(service.start("camp_p2", NOW)).rejects.toThrow(/already running/i);

    const paused = await service.pause("camp_p1", NOW);
    expect(paused.status).toBe(CampaignStatus.Paused);
    const resumed = await service.resume("camp_p1", NOW);
    expect(resumed.status).toBe(CampaignStatus.Running);
  });

  it("rejects approve without prepare", async () => {
    const stores = createInMemoryOutreachStores();
    const queue = createInMemoryOutreachQueue();
    const service = createOutreachService({ ...stores, queue });
    await stores.templateRepository.save(
      createCampaignTemplate({
        id: "tpl_a",
        name: "T",
        subject: "S",
        preview: "P",
        bodyLines: ["B"],
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.segmentRepository.save(
      createCampaignSegment({
        id: "seg_a",
        name: "S",
        filters: {},
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await service.createCampaign({
      id: "camp_a",
      name: "A",
      templateId: "tpl_a",
      segmentId: "seg_a",
      createdAt: NOW,
      createdBy: "admin",
    });
    await expect(service.approveCampaign("camp_a", NOW)).rejects.toThrow(/prepared/i);
  });
});
