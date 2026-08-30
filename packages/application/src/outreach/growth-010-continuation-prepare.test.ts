import {
  CampaignChannel,
  CampaignRecipientStatus,
  CampaignStatus,
  createBillingProtection,
  createCampaign,
  createCampaignRecipient,
  createCampaignSegment,
  createCampaignTemplate,
  createDeliveryJob,
  DeliveryJobStatus,
  emptyPreSendChecklist,
  mergePreSendChecklist,
} from "@eduatlas/domain";
import { describe, expect, it, vi } from "vitest";
import {
  assertOperationAllowed,
  isBillingProtectionError,
} from "../billing-protection";
import type { BillingProtectionRepository } from "../billing-protection/billing-protection-repository";
import type { OutreachDeliveryConfig } from "../delivery/delivery-config";
import { createInMemoryDeliveryJobRepository } from "../delivery/in-memory-delivery-job-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { prepareImportedCampaign } from "./import-campaign-recipients";
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import { createInMemoryOutreachQueue } from "./outreach-queue";
import { CLAIM_INVITATION_TEMPLATE_ID } from "./outreach-seeds";
import { createOutreachService } from "./outreach-service";
import { prepareCampaign } from "./prepare-campaign";

const NOW = "2026-08-30T20:00:00.000Z";

const config: OutreachDeliveryConfig = Object.freeze({
  warmupBatchSize: 20,
  ratePerMinute: 10,
  dailySendLimit: 100,
  retryDelayMs: 1000,
  maxAttempts: 3,
  workerInstanceId: "test-worker",
  lockTtlMs: 60_000,
});

function emergencyRepo(): BillingProtectionRepository {
  const protection = createBillingProtection({ state: "EMERGENCY" });
  return {
    async get() {
      return protection;
    },
    async save(next) {
      return next;
    },
  };
}

function catalogSpyRepo(): InstitutionRepository & { list: ReturnType<typeof vi.fn> } {
  const list = vi.fn(async () => {
    throw new Error("institutionRepository.list must not be called");
  });
  return {
    getById: async () => null,
    getBySlug: async () => null,
    save: async (i) => i,
    update: async (i) => i,
    delete: async () => undefined,
    list,
    listAll: vi.fn(async () => {
      throw new Error("listAll must not be called");
    }),
    listPublishedCandidates: vi.fn(async () => {
      throw new Error("listPublishedCandidates must not be called");
    }),
  } as InstitutionRepository & { list: ReturnType<typeof vi.fn> };
}

async function seedExternal(
  stores: ReturnType<typeof createInMemoryOutreachStores>,
  opts?: { status?: CampaignStatus; id?: string },
) {
  const id = opts?.id ?? "camp_g10";
  await stores.templateRepository.save(
    createCampaignTemplate({
      id: CLAIM_INVITATION_TEMPLATE_ID,
      name: "Claim",
      subject: "Hi {{institutionName}}",
      preview: "P",
      bodyLines: ["B"],
      createdAt: NOW,
      updatedAt: NOW,
    }),
  );
  await stores.segmentRepository.save(
    createCampaignSegment({
      id: "seg_1",
      name: "S",
      filters: {},
      createdAt: NOW,
      updatedAt: NOW,
    }),
  );
  await stores.campaignRepository.save(
    createCampaign({
      id,
      name: "External",
      status: opts?.status ?? CampaignStatus.Draft,
      channel: CampaignChannel.Email,
      templateId: CLAIM_INVITATION_TEMPLATE_ID,
      segmentId: "seg_1",
      recipientSource: "external_import",
      createdAt: NOW,
      createdBy: "admin",
      execution: { preparedAt: NOW, approvedAt: NOW },
      preSendChecklist: mergePreSendChecklist(emptyPreSendChecklist(), {
        subjectOk: true,
        ctaOk: true,
        testMailSent: true,
        recipientsReviewed: true,
        warmupOk: true,
        sendApproved: true,
      }),
    }),
  );
  return id;
}

describe("GROWTH-010 external continuation + recipient idempotency", () => {
  it("1) 18 matched / 16 jobs → continuation adds 2 jobs (same institutionId allowed)", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedExternal(stores, { status: CampaignStatus.Ready });
    const sharedFinal = "inst_final_shared";
    const sharedKadro = "inst_kadro_shared";

    for (let i = 1; i <= 16; i += 1) {
      const institutionId =
        i === 1 ? sharedKadro : i === 14 ? sharedFinal : `inst_${i}`;
      const recipientId = `crec_${i}`;
      await stores.recipientRepository.save(
        createCampaignRecipient({
          id: recipientId,
          campaignId,
          institutionId,
          displayName: `R${i}`,
          institutionMatch: "matched",
          source: "external_import",
          email: `r${i}@example.com`,
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
          recipientId,
          institutionId,
          // Legacy institution-scoped keys for existing 16 jobs
          idempotencyKey: `${campaignId}:${institutionId}:email`,
          status: DeliveryJobStatus.Pending,
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
        id: "crec_15_cevizlik",
        campaignId,
        institutionId: sharedFinal,
        displayName: "Cevizlik Final",
        institutionMatch: "matched",
        source: "external_import",
        email: "cevizlik@example.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_20_akadro",
        campaignId,
        institutionId: sharedKadro,
        displayName: "A Kadro",
        institutionMatch: "matched",
        source: "external_import",
        email: "akadro@example.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const institutionRepository = catalogSpyRepo();
    const result = await prepareImportedCampaign(
      { campaignId, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        segmentRepository: stores.segmentRepository,
        recipientRepository: stores.recipientRepository,
        deliveryJobRepository: jobs,
        institutionRepository,
        config,
        targetLimit: 20,
        billingProtectionRepository: emergencyRepo(),
      },
    );

    expect(result.recipientCount).toBe(2);
    expect(await jobs.listByCampaignId(campaignId)).toHaveLength(18);
    const recipients = await stores.recipientRepository.listByCampaignId(campaignId);
    expect(recipients).toHaveLength(18);
    expect(recipients.every((r) => r.status === CampaignRecipientStatus.Queued)).toBe(
      true,
    );
    expect(institutionRepository.list).not.toHaveBeenCalled();

    const cevizlikJob = (await jobs.listByCampaignId(campaignId)).find(
      (j) => j.recipientId === "crec_15_cevizlik",
    );
    const akadroJob = (await jobs.listByCampaignId(campaignId)).find(
      (j) => j.recipientId === "crec_20_akadro",
    );
    expect(cevizlikJob?.idempotencyKey).toBe(`${campaignId}:crec_15_cevizlik:email`);
    expect(akadroJob?.idempotencyKey).toBe(`${campaignId}:crec_20_akadro:email`);
    expect(cevizlikJob?.institutionId).toBe(sharedFinal);
    expect(akadroJob?.institutionId).toBe(sharedKadro);
  });

  it("2+3) same institutionId → two jobs; second continuation is idempotent", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedExternal(stores, { status: CampaignStatus.Ready });
    for (const id of ["crec_a", "crec_b"] as const) {
      await stores.recipientRepository.save(
        createCampaignRecipient({
          id,
          campaignId,
          institutionId: "inst_same",
          displayName: id === "crec_a" ? "Kadro Kurs" : "A Kadro",
          institutionMatch: "matched",
          source: "external_import",
          email: `${id}@example.com`,
          status: CampaignRecipientStatus.Pending,
          createdAt: NOW,
          updatedAt: NOW,
        }),
      );
    }
    const deps = {
      campaignRepository: stores.campaignRepository,
      segmentRepository: stores.segmentRepository,
      recipientRepository: stores.recipientRepository,
      deliveryJobRepository: jobs,
      institutionRepository: catalogSpyRepo(),
      config,
      targetLimit: 20,
      billingProtectionRepository: emergencyRepo(),
    };
    await prepareImportedCampaign({ campaignId, now: NOW }, deps);
    expect(await jobs.listByCampaignId(campaignId)).toHaveLength(2);
    const second = await prepareImportedCampaign(
      { campaignId, now: "2026-08-30T21:00:00.000Z" },
      deps,
    );
    expect(second.recipientCount).toBe(0);
    expect(await jobs.listByCampaignId(campaignId)).toHaveLength(2);
  });

  it("5+6+7) unmatched/ambiguous blocked → no jobs", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedExternal(stores);
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_ok",
        campaignId,
        institutionId: "inst_ok",
        displayName: "Ok",
        institutionMatch: "matched",
        source: "external_import",
        email: "ok@example.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_u",
        campaignId,
        institutionId: "ext:u",
        displayName: "U",
        institutionMatch: "unmatched",
        source: "external_import",
        email: "u@example.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_amb",
        campaignId,
        institutionId: "ext:a",
        displayName: "A",
        institutionMatch: "ambiguous",
        matchCandidateIds: ["inst_1", "inst_2"],
        source: "external_import",
        email: "a@example.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await prepareImportedCampaign(
      { campaignId, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        segmentRepository: stores.segmentRepository,
        recipientRepository: stores.recipientRepository,
        deliveryJobRepository: jobs,
        institutionRepository: catalogSpyRepo(),
        config,
        targetLimit: 20,
      },
    );
    const jobList = await jobs.listByCampaignId(campaignId);
    expect(jobList).toHaveLength(1);
    expect(jobList[0]?.recipientId).toBe("crec_ok");
  });

  it("8+9) ready and paused continuation work; 10) running does not", async () => {
    for (const status of [CampaignStatus.Ready, CampaignStatus.Paused] as const) {
      const stores = createInMemoryOutreachStores();
      const jobs = createInMemoryDeliveryJobRepository();
      const campaignId = await seedExternal(stores, {
        status,
        id: `camp_${status}`,
      });
      await stores.recipientRepository.save(
        createCampaignRecipient({
          id: `crec_${status}`,
          campaignId,
          institutionId: "inst_x",
          displayName: "X",
          institutionMatch: "matched",
          source: "external_import",
          email: `${status}@example.com`,
          status: CampaignRecipientStatus.Pending,
          createdAt: NOW,
          updatedAt: NOW,
        }),
      );
      const result = await prepareImportedCampaign(
        { campaignId, now: NOW },
        {
          campaignRepository: stores.campaignRepository,
          segmentRepository: stores.segmentRepository,
          recipientRepository: stores.recipientRepository,
          deliveryJobRepository: jobs,
          institutionRepository: catalogSpyRepo(),
          config,
          targetLimit: 20,
        },
      );
      expect(result.recipientCount).toBe(1);
    }

    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedExternal(stores, { status: CampaignStatus.Running });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_run",
        campaignId,
        institutionId: "inst_x",
        displayName: "X",
        institutionMatch: "matched",
        source: "external_import",
        email: "run@example.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await expect(
      prepareImportedCampaign(
        { campaignId, now: NOW },
        {
          campaignRepository: stores.campaignRepository,
          segmentRepository: stores.segmentRepository,
          recipientRepository: stores.recipientRepository,
          deliveryJobRepository: jobs,
          institutionRepository: catalogSpyRepo(),
          config,
          targetLimit: 20,
        },
      ),
    ).rejects.toThrow(/draft, ready, or paused|Running/i);
  });

  it("11) segment Prepare still blocked under EMERGENCY", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    await stores.templateRepository.save(
      createCampaignTemplate({
        id: CLAIM_INVITATION_TEMPLATE_ID,
        name: "Claim",
        subject: "S",
        preview: "P",
        bodyLines: ["B"],
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.segmentRepository.save(
      createCampaignSegment({
        id: "seg_1",
        name: "S",
        filters: { cityId: "istanbul" },
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.campaignRepository.save(
      createCampaign({
        id: "camp_seg",
        name: "Seg",
        status: CampaignStatus.Draft,
        channel: CampaignChannel.Email,
        templateId: CLAIM_INVITATION_TEMPLATE_ID,
        segmentId: "seg_1",
        recipientSource: "segment",
        createdAt: NOW,
        createdBy: "admin",
      }),
    );
    const billing = emergencyRepo();
    await expect(
      assertOperationAllowed("OUTREACH_PREPARE", {
        billingProtectionRepository: billing,
      }),
    ).rejects.toSatisfy((e: unknown) => isBillingProtectionError(e));
    await expect(
      prepareCampaign(
        { campaignId: "camp_seg", now: NOW },
        {
          campaignRepository: stores.campaignRepository,
          segmentRepository: stores.segmentRepository,
          recipientRepository: stores.recipientRepository,
          deliveryJobRepository: jobs,
          institutionRepository: catalogSpyRepo(),
          config,
          billingProtectionRepository: billing,
        },
      ),
    ).rejects.toSatisfy((e: unknown) => isBillingProtectionError(e));
  });

  it("15+16) Run locked when queued < matched; unlocked at 18/18 + checklist", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedExternal(stores, { status: CampaignStatus.Ready });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_q",
        campaignId,
        institutionId: "inst_1",
        displayName: "Q",
        institutionMatch: "matched",
        source: "external_import",
        email: "q@example.com",
        status: CampaignRecipientStatus.Queued,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_p",
        campaignId,
        institutionId: "inst_1",
        displayName: "P",
        institutionMatch: "matched",
        source: "external_import",
        email: "p@example.com",
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
    await expect(service.start(campaignId, NOW)).rejects.toThrow(/Run kilitli|Prepare/i);

    await prepareImportedCampaign(
      { campaignId, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        segmentRepository: stores.segmentRepository,
        recipientRepository: stores.recipientRepository,
        deliveryJobRepository: jobs,
        institutionRepository: catalogSpyRepo(),
        config,
        targetLimit: 20,
      },
    );
    const running = await service.start(campaignId, NOW);
    expect(running.status).toBe(CampaignStatus.Running);
  });

  it("17) checklist save → reload fields match Run validator", async () => {
    const stores = createInMemoryOutreachStores();
    const campaignId = await seedExternal(stores, { status: CampaignStatus.Ready });
    const service = createOutreachService({
      ...stores,
      queue: createInMemoryOutreachQueue(),
    });
    await service.updatePreSendChecklist({
      campaignId,
      now: NOW,
      patch: {
        subjectOk: false,
        ctaOk: false,
        testMailSent: true,
        recipientsReviewed: false,
        warmupOk: false,
        sendApproved: false,
      },
    });
    const incomplete = await stores.campaignRepository.getById(campaignId);
    expect(incomplete?.preSendChecklist?.testMailSent).toBe(true);
    expect(incomplete?.preSendChecklist?.subjectOk).toBe(false);

    const saved = await service.updatePreSendChecklist({
      campaignId,
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
    const reloaded = await stores.campaignRepository.getById(campaignId);
    expect(reloaded?.preSendChecklist).toEqual(saved.preSendChecklist);
    expect(reloaded?.preSendChecklist?.subjectOk).toBe(true);
    expect(reloaded?.preSendChecklist?.sendApproved).toBe(true);
  });
});
