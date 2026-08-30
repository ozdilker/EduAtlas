import {
  CampaignChannel,
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaign,
  createCampaignRecipient,
  createCampaignSegment,
  createCampaignTemplate,
  createDeliveryJob,
  DeliveryJobStatus,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import type { OutreachDeliveryConfig } from "../delivery/delivery-config";
import { createInMemoryDeliveryJobRepository } from "../delivery/in-memory-delivery-job-repository";
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import {
  CLAIM_INVITATION_TEMPLATE_ID,
} from "./outreach-seeds";
import { createInMemoryOutreachQueue } from "./outreach-queue";
import { createOutreachService } from "./outreach-service";
import {
  RECIPIENT_REMOVAL_REASON,
  removeCampaignRecipient,
} from "./remove-campaign-recipient";

const NOW = "2026-08-30T18:00:00.000Z";

const config: OutreachDeliveryConfig = Object.freeze({
  warmupBatchSize: 20,
  ratePerMinute: 10,
  dailySendLimit: 100,
  retryDelayMs: 1000,
  maxAttempts: 3,
  workerInstanceId: "test-worker",
  lockTtlMs: 60_000,
});

async function seedClaimCampaign(
  stores: ReturnType<typeof createInMemoryOutreachStores>,
  opts?: { id?: string },
) {
  const id = opts?.id ?? "camp_g9";
  await stores.templateRepository.save(
    createCampaignTemplate({
      id: CLAIM_INVITATION_TEMPLATE_ID,
      name: "Claim",
      subject: "Hi {{institutionName}}",
      preview: "Preview",
      bodyLines: ["Body"],
      createdAt: NOW,
      updatedAt: NOW,
    }),
  );
  await stores.segmentRepository.save(
    createCampaignSegment({
      id: "seg_1",
      name: "Default",
      filters: {},
      createdAt: NOW,
      updatedAt: NOW,
    }),
  );
  await stores.campaignRepository.save(
    createCampaign({
      id,
      name: "Bakırköy İlk 20",
      status: CampaignStatus.Draft,
      channel: CampaignChannel.Email,
      templateId: CLAIM_INVITATION_TEMPLATE_ID,
      segmentId: "seg_1",
      recipientSource: "external_import",
      createdAt: NOW,
      createdBy: "admin",
      execution: { preparedAt: NOW },
    }),
  );
  return id;
}

describe("GROWTH-009 remove campaign recipients", () => {
  it("removes Pending unmatched recipient and writes audit log", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedClaimCampaign(stores);
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_kavram",
        campaignId,
        institutionId: "ext:kavram",
        displayName: "Bakırköy Kavram Özel Öğretim Kursu",
        institutionMatch: "unmatched",
        source: "external_import",
        email: "bakirkoy.kurs@kavram.com.tr",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_keep",
        campaignId,
        institutionId: "inst_keep",
        displayName: "Keep",
        institutionMatch: "matched",
        source: "external_import",
        email: "keep@example.com",
        status: CampaignRecipientStatus.Queued,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const result = await removeCampaignRecipient(
      {
        campaignId,
        recipientId: "crec_kavram",
        reason: RECIPIENT_REMOVAL_REASON.ClosedInstitution,
        now: NOW,
      },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        logRepository: stores.logRepository,
        deliveryJobRepository: jobs,
      },
    );

    expect(result.recipientId).toBe("crec_kavram");
    expect(result.email).toBe("bakirkoy.kurs@kavram.com.tr");
    expect(await stores.recipientRepository.getById("crec_kavram")).toBeNull();
    expect(await stores.recipientRepository.getById("crec_keep")).not.toBeNull();
    const logs = await stores.logRepository.listByCampaignId(campaignId);
    expect(logs.some((l) => /recipient removed from campaign/i.test(l.message))).toBe(
      true,
    );
    expect(logs.some((l) => l.meta?.reason === "closed institution")).toBe(true);
    expect(logs.some((l) => l.meta?.email === "bakirkoy.kurs@kavram.com.tr")).toBe(true);
  });

  it("refuses to remove Queued recipients (does not touch DeliveryJobs)", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedClaimCampaign(stores);
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_q",
        campaignId,
        institutionId: "inst_q",
        displayName: "Queued",
        institutionMatch: "matched",
        source: "external_import",
        email: "q@example.com",
        status: CampaignRecipientStatus.Queued,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await jobs.save(
      createDeliveryJob({
        id: "djob_q",
        channel: CampaignChannel.Email,
        campaignId,
        recipientId: "crec_q",
        institutionId: "inst_q",
        status: DeliveryJobStatus.Pending,
        idempotencyKey: `${campaignId}:inst_q:email`,
        attemptCount: 0,
        maxAttempts: 3,
        availableAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    await expect(
      removeCampaignRecipient(
        {
          campaignId,
          recipientId: "crec_q",
          reason: RECIPIENT_REMOVAL_REASON.UnverifiedInstitution,
          now: NOW,
        },
        {
          campaignRepository: stores.campaignRepository,
          recipientRepository: stores.recipientRepository,
          logRepository: stores.logRepository,
          deliveryJobRepository: jobs,
        },
      ),
    ).rejects.toThrow(/Pending/i);

    expect(await stores.recipientRepository.getById("crec_q")).not.toBeNull();
    expect(await jobs.listByCampaignId(campaignId)).toHaveLength(1);
  });

  it("claim approve is blocked while unmatched recipients remain", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedClaimCampaign(stores);
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_ok",
        campaignId,
        institutionId: "inst_ok",
        displayName: "Ok",
        institutionMatch: "matched",
        source: "external_import",
        email: "ok@example.com",
        status: CampaignRecipientStatus.Queued,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_bad",
        campaignId,
        institutionId: "ext:bad",
        displayName: "Dersflix Bakırköy",
        institutionMatch: "unmatched",
        source: "external_import",
        email: "info@dersflix.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const service = createOutreachService({
      ...stores,
      deliveryJobRepository: jobs,
      deliveryConfig: config,
      queue: createInMemoryOutreachQueue(),
    });

    await expect(service.approveCampaign(campaignId, NOW)).rejects.toThrow(
      /eşleşmemiş|ambiguous/i,
    );

    await removeCampaignRecipient(
      {
        campaignId,
        recipientId: "crec_bad",
        reason: RECIPIENT_REMOVAL_REASON.UnverifiedInstitution,
        now: NOW,
      },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        logRepository: stores.logRepository,
        deliveryJobRepository: jobs,
      },
    );

    const approved = await service.approveCampaign(campaignId, NOW);
    expect(approved.status).toBe(CampaignStatus.Ready);
  });

  it("removes Dersflix-style unverified pending recipient without affecting queued set", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedClaimCampaign(stores);
    for (let i = 1; i <= 16; i += 1) {
      await stores.recipientRepository.save(
        createCampaignRecipient({
          id: `crec_q_${i}`,
          campaignId,
          institutionId: `inst_${i}`,
          displayName: `Q ${i}`,
          institutionMatch: "matched",
          source: "external_import",
          email: `q${i}@example.com`,
          status: CampaignRecipientStatus.Queued,
          createdAt: NOW,
          updatedAt: NOW,
        }),
      );
      await jobs.save(
        createDeliveryJob({
          id: `djob_${i}`,
          channel: CampaignChannel.Email,
          campaignId,
          recipientId: `crec_q_${i}`,
          institutionId: `inst_${i}`,
          status: DeliveryJobStatus.Pending,
          idempotencyKey: `${campaignId}:inst_${i}:email`,
          attemptCount: 0,
          maxAttempts: 3,
          availableAt: NOW,
          createdAt: NOW,
          updatedAt: NOW,
        }),
      );
    }
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_dersflix",
        campaignId,
        institutionId: "ext:dersflix",
        displayName: "Dersflix Bakırköy",
        institutionMatch: "unmatched",
        source: "external_import",
        email: "info@dersflix.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    await removeCampaignRecipient(
      {
        campaignId,
        recipientId: "crec_dersflix",
        reason: RECIPIENT_REMOVAL_REASON.UnverifiedInstitution,
        now: NOW,
      },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        logRepository: stores.logRepository,
        deliveryJobRepository: jobs,
      },
    );

    const recipients = await stores.recipientRepository.listByCampaignId(campaignId);
    expect(recipients).toHaveLength(16);
    expect(recipients.every((r) => r.status === CampaignRecipientStatus.Queued)).toBe(
      true,
    );
    expect(await jobs.listByCampaignId(campaignId)).toHaveLength(16);
  });
});
