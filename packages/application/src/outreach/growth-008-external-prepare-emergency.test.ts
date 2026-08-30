import {
  CampaignChannel,
  CampaignRecipientStatus,
  CampaignStatus,
  createBillingProtection,
  createCampaign,
  createCampaignRecipient,
  createCampaignSegment,
  createCampaignTemplate,
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
  type Institution,
  type InstitutionId,
  institutionIdAsString,
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
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import { prepareImportedCampaign } from "./import-campaign-recipients";
import {
  CLAIM_INVITATION_TEMPLATE_ID,
} from "./outreach-seeds";
import { prepareCampaign } from "./prepare-campaign";
import { previewSegmentInstitutions } from "./preview-segment-institutions";

const NOW = "2026-08-30T12:00:00.000Z";

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

function inst(overrides: {
  id: string;
  name: string;
  email?: string;
}): Institution {
  return createPublishedInstitution({
    id: overrides.id,
    slug: overrides.id.replace(/_/g, "-"),
    name: overrides.name,
    primaryType: InstitutionType.Kindergarten,
    verification: InstitutionVerification.Unclaimed,
    location: {
      cityId: "istanbul",
      districtId: "bakirkoy",
      address: "Adres",
    },
    contact: { email: overrides.email ?? `${overrides.id}@example.com` },
    shortDescription: "Test",
    createdAt: NOW,
    updatedAt: NOW,
    publishedAt: NOW,
  });
}

function catalogSpyRepo(institutions: readonly Institution[] = []): InstitutionRepository & {
  readonly list: ReturnType<typeof vi.fn>;
  readonly listAll: ReturnType<typeof vi.fn>;
  readonly listPublishedCandidates: ReturnType<typeof vi.fn>;
} {
  const list = vi.fn(async () =>
    Object.freeze({
      items: institutions,
      page: 1,
      pageSize: 500,
      totalItems: institutions.length,
      totalPages: 1,
    }),
  );
  const listAll = vi.fn(async () => institutions);
  const listPublishedCandidates = vi.fn(async () => institutions);
  return {
    getById: async (id: InstitutionId) => {
      const needle = institutionIdAsString(id);
      return institutions.find((i) => institutionIdAsString(i.id) === needle) ?? null;
    },
    getBySlug: async () => null,
    save: async (i) => i,
    update: async (i) => i,
    delete: async () => undefined,
    list,
    listAll,
    listPublishedCandidates,
  } as InstitutionRepository & {
    readonly list: ReturnType<typeof vi.fn>;
    readonly listAll: ReturnType<typeof vi.fn>;
    readonly listPublishedCandidates: ReturnType<typeof vi.fn>;
  };
}

async function seedTemplateAndSegment(
  stores: ReturnType<typeof createInMemoryOutreachStores>,
  opts?: { templateId?: string },
): Promise<void> {
  const templateId = opts?.templateId ?? CLAIM_INVITATION_TEMPLATE_ID;
  await stores.templateRepository.save(
    createCampaignTemplate({
      id: templateId,
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
      filters: { cityId: "istanbul" },
      createdAt: NOW,
      updatedAt: NOW,
    }),
  );
}

async function seedExternalCampaign(
  stores: ReturnType<typeof createInMemoryOutreachStores>,
  opts?: {
    id?: string;
    source?: "external_import" | "manual";
    status?: CampaignStatus;
  },
): Promise<string> {
  const id = opts?.id ?? "camp_g8";
  await seedTemplateAndSegment(stores);
  await stores.campaignRepository.save(
    createCampaign({
      id,
      name: "Bakırköy İlk 20",
      status: opts?.status ?? CampaignStatus.Draft,
      channel: CampaignChannel.Email,
      templateId: CLAIM_INVITATION_TEMPLATE_ID,
      segmentId: "seg_1",
      recipientSource: opts?.source ?? "external_import",
      createdAt: NOW,
      createdBy: "admin",
    }),
  );
  return id;
}

async function seedMatchedRecipients(
  stores: ReturnType<typeof createInMemoryOutreachStores>,
  campaignId: string,
  count: number,
  opts?: { startIndex?: number; match?: "matched" | "unmatched" | "ambiguous" },
): Promise<void> {
  const start = opts?.startIndex ?? 1;
  const match = opts?.match ?? "matched";
  for (let i = 0; i < count; i += 1) {
    const n = start + i;
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: `crec_${campaignId}_${n}`,
        campaignId,
        institutionId:
          match === "matched" ? `inst_${n}` : match === "ambiguous" ? "ext:amb" : `ext:u${n}`,
        displayName: `Kurum ${n}`,
        institutionMatch: match,
        ...(match === "ambiguous" ? { matchCandidateIds: ["inst_a", "inst_b"] } : {}),
        source: "external_import",
        email: `kurum${n}@example.com`,
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
  }
}

describe("GROWTH-008 external/manual Prepare vs OUTREACH_PREPARE emergency", () => {
  it("1) external_import + EMERGENCY: Prepare succeeds; 18 matched jobs; 2 blocked = 0 jobs", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const billing = emergencyRepo();
    const campaignId = await seedExternalCampaign(stores, { source: "external_import" });
    await seedMatchedRecipients(stores, campaignId, 18, { match: "matched" });
    await seedMatchedRecipients(stores, campaignId, 1, {
      startIndex: 19,
      match: "unmatched",
    });
    await seedMatchedRecipients(stores, campaignId, 1, {
      startIndex: 20,
      match: "ambiguous",
    });

    await expect(
      assertOperationAllowed("OUTREACH_PREPARE", {
        billingProtectionRepository: billing,
      }),
    ).rejects.toSatisfy((error: unknown) => isBillingProtectionError(error));

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
        billingProtectionRepository: billing,
      },
    );

    expect(result.recipientCount).toBe(18);
    const jobList = await jobs.listByCampaignId(campaignId);
    expect(jobList).toHaveLength(18);
    expect(jobList.every((j) => j.institutionId.startsWith("inst_"))).toBe(true);

    const recipients = await stores.recipientRepository.listByCampaignId(campaignId);
    const blocked = recipients.filter(
      (r) =>
        r.institutionMatch === "unmatched" || r.institutionMatch === "ambiguous",
    );
    expect(blocked).toHaveLength(2);
    expect(blocked.every((r) => r.status === CampaignRecipientStatus.Pending)).toBe(true);
    expect(
      jobList.some((j) => blocked.some((b) => b.institutionId === j.institutionId)),
    ).toBe(false);
  });

  it("2) external_import + EMERGENCY: no catalog list / listAll / listPublishedCandidates / segment preview", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const billing = emergencyRepo();
    const campaignId = await seedExternalCampaign(stores);
    await seedMatchedRecipients(stores, campaignId, 3, { match: "matched" });

    const institutionRepository = catalogSpyRepo([
      inst({ id: "inst_1", name: "Kurum 1" }),
    ]);
    const previewSpy = vi.fn(previewSegmentInstitutions);

    await prepareImportedCampaign(
      { campaignId, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        segmentRepository: stores.segmentRepository,
        recipientRepository: stores.recipientRepository,
        deliveryJobRepository: jobs,
        institutionRepository,
        config,
        targetLimit: 20,
        billingProtectionRepository: billing,
      },
    );

    expect(institutionRepository.list).not.toHaveBeenCalled();
    expect(institutionRepository.listAll).not.toHaveBeenCalled();
    expect(institutionRepository.listPublishedCandidates).not.toHaveBeenCalled();
    expect(previewSpy).not.toHaveBeenCalled();
  });

  it("3) manual + EMERGENCY: bounded Prepare succeeds", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const billing = emergencyRepo();
    const campaignId = await seedExternalCampaign(stores, { source: "manual" });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_manual_1",
        campaignId,
        institutionId: "inst_manual",
        displayName: "Manuel Kurum",
        institutionMatch: "matched",
        source: "manual",
        email: "manual@example.com",
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
        billingProtectionRepository: billing,
      },
    );

    expect(result.recipientCount).toBe(1);
    expect(await jobs.listByCampaignId(campaignId)).toHaveLength(1);
    expect(institutionRepository.list).not.toHaveBeenCalled();
  });

  it("4) segment campaign + EMERGENCY: OUTREACH_PREPARE still blocks Prepare", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const billing = emergencyRepo();
    await seedTemplateAndSegment(stores);
    await stores.campaignRepository.save(
      createCampaign({
        id: "camp_seg",
        name: "Segment kampanya",
        status: CampaignStatus.Draft,
        channel: CampaignChannel.Email,
        templateId: CLAIM_INVITATION_TEMPLATE_ID,
        segmentId: "seg_1",
        recipientSource: "segment",
        createdAt: NOW,
        createdBy: "admin",
      }),
    );

    const institutionRepository = catalogSpyRepo([
      inst({ id: "inst_seg", name: "Seg Kurum", email: "seg@example.com" }),
    ]);

    await expect(
      prepareCampaign(
        { campaignId: "camp_seg", now: NOW },
        {
          campaignRepository: stores.campaignRepository,
          segmentRepository: stores.segmentRepository,
          recipientRepository: stores.recipientRepository,
          deliveryJobRepository: jobs,
          institutionRepository,
          config,
          targetLimit: 20,
          billingProtectionRepository: billing,
        },
      ),
    ).rejects.toSatisfy((error: unknown) => {
      return (
        isBillingProtectionError(error) &&
        /Kampanya hazırlama \/ segment önizleme maliyet koruması \(EMERGENCY\)/i.test(
          error.message,
        )
      );
    });
    expect(institutionRepository.list).not.toHaveBeenCalled();
    expect(await jobs.listByCampaignId("camp_seg")).toHaveLength(0);
  });

  it("5) warm-up: 25 eligible + limit 20 → only 20 DeliveryJobs", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedExternalCampaign(stores);
    await seedMatchedRecipients(stores, campaignId, 25, { match: "matched" });

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
        billingProtectionRepository: emergencyRepo(),
      },
    );

    expect(result.recipientCount).toBe(20);
    expect(await jobs.listByCampaignId(campaignId)).toHaveLength(20);
    const recipients = await stores.recipientRepository.listByCampaignId(campaignId);
    expect(
      recipients.filter((r) => r.status === CampaignRecipientStatus.Pending),
    ).toHaveLength(5);
  });

  it("6) blocked unmatched/ambiguous never get DeliveryJobs", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedExternalCampaign(stores);
    await seedMatchedRecipients(stores, campaignId, 1, { match: "matched" });
    await seedMatchedRecipients(stores, campaignId, 1, {
      startIndex: 2,
      match: "unmatched",
    });
    await seedMatchedRecipients(stores, campaignId, 1, {
      startIndex: 3,
      match: "ambiguous",
    });

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
        billingProtectionRepository: emergencyRepo(),
      },
    );

    const jobList = await jobs.listByCampaignId(campaignId);
    expect(jobList).toHaveLength(1);
    expect(jobList[0]?.institutionId).toBe("inst_1");
  });

  it("7) idempotency: second Prepare creates no duplicate DeliveryJobs", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const campaignId = await seedExternalCampaign(stores);
    await seedMatchedRecipients(stores, campaignId, 5, { match: "matched" });
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

    const first = await prepareImportedCampaign({ campaignId, now: NOW }, deps);
    expect(first.recipientCount).toBe(5);
    const second = await prepareImportedCampaign(
      { campaignId, now: "2026-08-30T13:00:00.000Z" },
      deps,
    );
    expect(second.recipientCount).toBe(0);
    expect(await jobs.listByCampaignId(campaignId)).toHaveLength(5);
  });

  it("8) cancel/pause: non-draft Prepare remains rejected", async () => {
    for (const status of [
      CampaignStatus.Paused,
      CampaignStatus.Cancelled,
      CampaignStatus.Ready,
      CampaignStatus.Running,
    ] as const) {
      const stores = createInMemoryOutreachStores();
      const jobs = createInMemoryDeliveryJobRepository();
      const campaignId = `camp_${status}`;
      await seedExternalCampaign(stores, { id: campaignId, status });
      await seedMatchedRecipients(stores, campaignId, 1, { match: "matched" });
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
            billingProtectionRepository: emergencyRepo(),
          },
        ),
      ).rejects.toThrow(/draft/i);
      expect(await jobs.listByCampaignId(campaignId)).toHaveLength(0);
    }
  });

  it("segment Prepare rejects manual campaigns (use import prepare path)", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    await seedExternalCampaign(stores, { id: "camp_man_seg", source: "manual" });
    await expect(
      prepareCampaign(
        { campaignId: "camp_man_seg", now: NOW },
        {
          campaignRepository: stores.campaignRepository,
          segmentRepository: stores.segmentRepository,
          recipientRepository: stores.recipientRepository,
          deliveryJobRepository: jobs,
          institutionRepository: catalogSpyRepo(),
          config,
          billingProtectionRepository: emergencyRepo(),
        },
      ),
    ).rejects.toThrow(/Import Prepare|Excel\/CSV|tekil alıcı/i);
  });
});
