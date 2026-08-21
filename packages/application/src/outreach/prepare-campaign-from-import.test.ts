import { describe, expect, it } from "vitest";
import {
  CampaignChannel,
  CampaignStatus,
  createCampaign,
  createCampaignSegment,
  createCampaignTemplate,
  type Institution,
} from "@eduatlas/domain";
import type { OutreachDeliveryConfig } from "../delivery/delivery-config";
import { createInMemoryDeliveryJobRepository } from "../delivery/in-memory-delivery-job-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import { prepareCampaignFromImport } from "./import-campaign-recipients";

const config: OutreachDeliveryConfig = Object.freeze({
  warmupBatchSize: 20,
  ratePerMinute: 10,
  dailySendLimit: 100,
  retryDelayMs: 1000,
  maxAttempts: 3,
  workerInstanceId: "test-worker",
  lockTtlMs: 60_000,
});

const stubInstitutionRepository = {
  getById: async () => null,
  getBySlug: async () => null,
  save: async (institution: Institution) => institution,
  update: async (institution: Institution) => institution,
  delete: async () => undefined,
  list: async () =>
    Object.freeze({
      items: [] as Institution[],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
    }),
} satisfies InstitutionRepository;

describe("prepareCampaignFromImport", () => {
  it("enqueues queued recipients and pending jobs without leaving draft", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const now = "2026-08-21T12:00:00.000Z";

    await stores.templateRepository.save(
      createCampaignTemplate({
        id: "tpl_1",
        name: "Invite",
        subject: "Hi",
        preview: "Preview",
        bodyLines: ["Body"],
        createdAt: now,
        updatedAt: now,
      }),
    );
    await stores.segmentRepository.save(
      createCampaignSegment({
        id: "seg_1",
        name: "Default",
        filters: {},
        createdAt: now,
        updatedAt: now,
      }),
    );
    await stores.campaignRepository.save(
      createCampaign({
        id: "camp_imp",
        name: "Import",
        status: CampaignStatus.Draft,
        channel: CampaignChannel.Email,
        templateId: "tpl_1",
        segmentId: "seg_1",
        createdAt: now,
        createdBy: "admin",
      }),
    );

    const csv = new TextEncoder().encode(
      "institutionName,email\nOkul Bir,bir@example.com\nOkul Iki,iki@example.com\n",
    );

    let seq = 0;
    const result = await prepareCampaignFromImport(
      {
        campaignId: "camp_imp",
        fileName: "liste.csv",
        content: csv,
        now,
      },
      {
        campaignRepository: stores.campaignRepository,
        segmentRepository: stores.segmentRepository,
        recipientRepository: stores.recipientRepository,
        deliveryJobRepository: jobs,
        institutionRepository: stubInstitutionRepository,
        config,
        targetLimit: 20,
        nextRecipientId: () => `crec_${++seq}`,
        nextJobId: () => `djob_${seq}`,
      },
    );

    expect(result.recipientCount).toBe(2);
    expect(result.parse.accepted).toHaveLength(2);

    const campaign = await stores.campaignRepository.getById("camp_imp");
    expect(campaign?.status).toBe(CampaignStatus.Draft);
    expect(campaign?.recipientSource).toBe("external_import");
    expect(campaign?.execution?.preparedAt).toBe(now);

    const recipients = await stores.recipientRepository.listByCampaignId("camp_imp");
    expect(recipients).toHaveLength(2);
    expect(recipients[0]?.displayName).toBeTruthy();
    expect(recipients[0]?.institutionId.startsWith("ext:")).toBe(true);

    const pendingJobs = await jobs.listByCampaignId("camp_imp");
    expect(pendingJobs).toHaveLength(2);
  });
});
