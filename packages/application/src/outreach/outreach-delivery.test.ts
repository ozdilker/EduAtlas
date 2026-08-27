import {
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaign,
  createCampaignRecipient,
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
import { createInMemoryOutreachWarmupSettingsRepository } from "./in-memory-warmup-settings-repository";
import { createOutreachService } from "./outreach-service";
import {
  CLAIM_INVITATION_TEMPLATE_ID,
  ensureOutreachSeeds,
  ISTANBUL_UNCLAIMED_SEGMENT_ID,
} from "./outreach-seeds";
import { elevateWarmupSettings } from "./warmup-settings";

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

    await expect(service.start("camp_p1", NOW)).rejects.toThrow(/checklist/i);

    await service.updatePreSendChecklist({
      campaignId: "camp_p1",
      now: NOW,
      patch: {
        subjectOk: true,
        ctaOk: true,
        testMailSent: true,
        recipientsReviewed: true,
        warmupOk: true,
        sendApproved: true,
      },
    });

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
    await service.updatePreSendChecklist({
      campaignId: "camp_p2",
      now: NOW,
      patch: {
        subjectOk: true,
        ctaOk: true,
        testMailSent: true,
        recipientsReviewed: true,
        warmupOk: true,
        sendApproved: true,
      },
    });
    await expect(service.start("camp_p2", NOW)).rejects.toThrow(/already running/i);

    const paused = await service.pause("camp_p1", NOW);
    expect(paused.status).toBe(CampaignStatus.Paused);
    const resumed = await service.resume("camp_p1", NOW);
    expect(resumed.status).toBe(CampaignStatus.Running);
  });

  it("expands draft warm-up up to higher stage limit without leaving draft", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const queue = createInMemoryOutreachQueue();
    const warmup = createInMemoryOutreachWarmupSettingsRepository();
    await warmup.save(
      elevateWarmupSettings(await warmup.get(), {
        now: NOW,
      })!,
    );

    const institutions = [1, 2, 3, 4, 5].map((n) =>
      createInstitution({
        id: `inst_e${n}`,
        name: `Okul ${n}`,
        slug: `okul-e-${n}`,
        primaryType: InstitutionType.Kindergarten,
        status: InstitutionStatus.Published,
        verification: InstitutionVerification.Unclaimed,
        location: { cityId: "istanbul", districtId: "kadikoy", address: "a" },
        contact: { email: `okule${n}@example.com` },
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
      warmupSettingsRepository: warmup,
    });

    await ensureOutreachSeeds({
      templateRepository: stores.templateRepository,
      segmentRepository: stores.segmentRepository,
      now: NOW,
    });
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
      id: "camp_expand",
      name: "Expand me",
      templateId: CLAIM_INVITATION_TEMPLATE_ID,
      segmentId: ISTANBUL_UNCLAIMED_SEGMENT_ID,
      subjectOverride: "Subj",
      preheader: "Pre",
      createdAt: NOW,
      createdBy: "admin",
    });

    // Force stage-1 limit via temporary save then prepare with stage 2 (50) settings
    // Settings already elevated to stage 2 (50); first prepare takes all 5 matched.
    const first = await service.prepareCampaign("camp_expand", NOW);
    expect(first.recipientCount).toBe(5);
    expect(first.totalRecipients).toBe(5);

    const again = await service.expandWarmup("camp_expand", NOW);
    expect(again.recipientCount).toBe(0);
    expect(again.totalRecipients).toBe(5);

    const camp = await stores.campaignRepository.getById("camp_expand");
    expect(camp?.status).toBe(CampaignStatus.Draft);
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

  it("deletes draft campaigns and cascades recipients/logs/jobs", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const queue = createInMemoryOutreachQueue();
    const service = createOutreachService({
      ...stores,
      queue,
      deliveryJobRepository: jobs,
    });
    await stores.templateRepository.save(
      createCampaignTemplate({
        id: "tpl_del",
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
        id: "seg_del",
        name: "S",
        filters: {},
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await service.createCampaign({
      id: "camp_del",
      name: "Silinecek",
      templateId: "tpl_del",
      segmentId: "seg_del",
      createdAt: NOW,
      createdBy: "admin",
    });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_del",
        campaignId: "camp_del",
        institutionId: "inst_1",
        email: "a@example.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    await service.deleteDraft("camp_del");
    expect(await stores.campaignRepository.getById("camp_del")).toBeNull();
    expect(await stores.recipientRepository.listByCampaignId("camp_del")).toHaveLength(0);

    const ready = await service.createCampaign({
      id: "camp_ready",
      name: "Ready",
      templateId: "tpl_del",
      segmentId: "seg_del",
      createdAt: NOW,
      createdBy: "admin",
    });
    await stores.campaignRepository.update(
      createCampaign({
        id: "camp_ready",
        name: ready.name,
        templateId: "tpl_del",
        segmentId: "seg_del",
        status: CampaignStatus.Ready,
        createdAt: NOW,
        createdBy: "admin",
      }),
    );
    await expect(service.deleteDraft("camp_ready")).rejects.toThrow(/draft/i);
  });
});
