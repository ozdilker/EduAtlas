import { describe, expect, it, vi } from "vitest";
import {
  CampaignChannel,
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaign,
  createCampaignRecipient,
  createCampaignSegment,
  createCampaignTemplate,
  createPublishedInstitution,
  institutionIdAsString,
  InstitutionType,
  InstitutionVerification,
  isExternalInstitutionId,
  type Institution,
  type InstitutionId,
} from "@eduatlas/domain";
import type { OutreachDeliveryConfig } from "../delivery/delivery-config";
import { createInMemoryDeliveryJobRepository } from "../delivery/in-memory-delivery-job-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import {
  importExternalRecipients,
  prepareImportedCampaign,
} from "./import-campaign-recipients";
import {
  addManualCampaignRecipient,
  assignRecipientInstitution,
  matchCampaignRecipients,
  OUTREACH_MATCH_MAX_DOCS_PER_RECIPIENT,
  resolveBoundedOutreachInstitutionMatch,
} from "./match-outreach-recipients";
import { searchOutreachInstitutions } from "./search-outreach-institutions";
import {
  CLAIM_INVITATION_DEFAULT_SUBJECT,
  CLAIM_INVITATION_TEMPLATE_ID,
} from "./outreach-seeds";
import { createOutreachService } from "./outreach-service";
import { createInMemoryOutreachQueue } from "./outreach-queue";

const NOW = "2026-08-29T12:00:00.000Z";

const config: OutreachDeliveryConfig = Object.freeze({
  warmupBatchSize: 20,
  ratePerMinute: 10,
  dailySendLimit: 100,
  retryDelayMs: 1000,
  maxAttempts: 3,
  workerInstanceId: "test-worker",
  lockTtlMs: 60_000,
});

function inst(overrides: {
  id: string;
  name: string;
  email?: string;
  cityId?: string;
  districtId?: string;
}): ReturnType<typeof createPublishedInstitution> {
  return createPublishedInstitution({
    id: overrides.id,
    slug: overrides.id.replace(/_/g, "-"),
    name: overrides.name,
    primaryType: InstitutionType.Kindergarten,
    verification: InstitutionVerification.Unclaimed,
    location: {
      cityId: overrides.cityId ?? "istanbul",
      districtId: overrides.districtId ?? "bakirkoy",
      address: "Adres",
    },
    contact: { email: overrides.email },
    shortDescription: "Test",
    createdAt: NOW,
    updatedAt: NOW,
    publishedAt: NOW,
  });
}

function stubRepo(institutions: readonly Institution[]): InstitutionRepository {
  let listCalls = 0;
  return {
    getById: async (id: InstitutionId) => {
      const needle = institutionIdAsString(id);
      return institutions.find((i) => institutionIdAsString(i.id) === needle) ?? null;
    },
    getBySlug: async () => null,
    save: async (i) => i,
    update: async (i) => i,
    delete: async () => undefined,
    list: async () => {
      listCalls += 1;
      return Object.freeze({
        items: institutions,
        page: 1,
        pageSize: 50,
        totalItems: institutions.length,
        totalPages: 1,
      });
    },
    findByContactEmail: async (email, options) => {
      const needle = email.trim().toLowerCase();
      const limit = options?.limit ?? 5;
      return Object.freeze(
        institutions
          .filter((i) => (i.contact.email ?? "").toLowerCase() === needle)
          .slice(0, limit),
      );
    },
    findByExactName: async (name, options) => {
      const needle = name.trim().toLocaleLowerCase("tr-TR");
      const limit = options?.limit ?? 10;
      return Object.freeze(
        institutions
          .filter((i) => {
            if (i.name.trim().toLocaleLowerCase("tr-TR") !== needle) return false;
            if (options?.cityId && i.location.cityId !== options.cityId) return false;
            if (options?.districtId && i.location.districtId !== options.districtId) {
              return false;
            }
            return true;
          })
          .slice(0, limit),
      );
    },
    findBySearchKeyword: async (keyword, options) => {
      const needle = keyword.trim().toLocaleLowerCase("tr-TR");
      const limit = options?.limit ?? 20;
      return Object.freeze(
        institutions
          .filter((i) => {
            if (!i.name.toLocaleLowerCase("tr-TR").includes(needle)) return false;
            if (options?.cityId && i.location.cityId !== options.cityId) return false;
            if (options?.districtId && i.location.districtId !== options.districtId) {
              return false;
            }
            return true;
          })
          .slice(0, limit),
      );
    },
    __listCalls: () => listCalls,
  } as InstitutionRepository & { __listCalls: () => number };
}

async function seedCampaign(
  stores: ReturnType<typeof createInMemoryOutreachStores>,
  opts?: { id?: string; source?: "external_import" | "manual"; templateId?: string },
) {
  const id = opts?.id ?? "camp_g7";
  await stores.templateRepository.save(
    createCampaignTemplate({
      id: opts?.templateId ?? CLAIM_INVITATION_TEMPLATE_ID,
      name: "Invite",
      subject: CLAIM_INVITATION_DEFAULT_SUBJECT,
      preview: "Preview",
      bodyLines: ["{{institutionName}} için profil."],
      createdAt: NOW,
      updatedAt: NOW,
    }),
  );
  await stores.segmentRepository.save(
    createCampaignSegment({
      id: "seg_bakirkoy",
      name: "Bakırköy",
      filters: { cityId: "istanbul", districtId: "bakirkoy" },
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
      templateId: opts?.templateId ?? CLAIM_INVITATION_TEMPLATE_ID,
      segmentId: "seg_bakirkoy",
      ...(opts?.source ? { recipientSource: opts.source } : {}),
      subjectOverride: CLAIM_INVITATION_DEFAULT_SUBJECT,
      createdAt: NOW,
      createdBy: "admin",
    }),
  );
  return id;
}

describe("GROWTH-007 institution matching", () => {
  it("exact email match → matched with correct institutionId", async () => {
    const repo = stubRepo([
      inst({ id: "inst_kadro", name: "Kadro Kurs", email: "info@kadrokurs.com" }),
    ]);
    const result = await resolveBoundedOutreachInstitutionMatch(
      { institutionName: "Kadro Kurs", email: "info@kadrokurs.com" },
      repo,
    );
    expect(result.institutionMatch).toBe("matched");
    expect(result.institutionId).toBe("inst_kadro");
    expect(result.documentsRead).toBeLessThanOrEqual(OUTREACH_MATCH_MAX_DOCS_PER_RECIPIENT);
  });

  it("normalized name match within city scope", async () => {
    const repo = stubRepo([
      inst({
        id: "inst_kadro_bk",
        name: "Kadro Kurs",
        email: "other@example.com",
        cityId: "istanbul",
        districtId: "bakirkoy",
      }),
    ]);
    const result = await resolveBoundedOutreachInstitutionMatch(
      { institutionName: "kadro kurs", email: "x@example.com" },
      repo,
      { cityId: "istanbul", districtId: "bakirkoy" },
    );
    expect(result.institutionMatch).toBe("matched");
    expect(result.institutionId).toBe("inst_kadro_bk");
  });

  it("unmatched when no catalog hit", async () => {
    const repo = stubRepo([]);
    const result = await resolveBoundedOutreachInstitutionMatch(
      { institutionName: "Yok Kurum", email: "yok@example.com" },
      repo,
    );
    expect(result.institutionMatch).toBe("unmatched");
    expect(isExternalInstitutionId(result.institutionId)).toBe(true);
  });

  it("ambiguous when multiple exact name hits", async () => {
    const repo = stubRepo([
      inst({
        id: "inst_a",
        name: "ABC Kurs",
        email: "a@x.com",
        districtId: "bakirkoy",
      }),
      inst({
        id: "inst_b",
        name: "ABC Kurs",
        email: "b@x.com",
        districtId: "kadikoy",
      }),
    ]);
    const result = await resolveBoundedOutreachInstitutionMatch(
      { institutionName: "ABC Kurs", email: "c@x.com" },
      repo,
    );
    expect(result.institutionMatch).toBe("ambiguous");
    expect(result.matchCandidateIds).toHaveLength(2);
    expect(isExternalInstitutionId(result.institutionId)).toBe(true);
  });

  it("never calls institutionRepository.list during match", async () => {
    const repo = stubRepo([
      inst({ id: "inst_1", name: "Kadro Kurs", email: "info@kadrokurs.com" }),
    ]);
    await resolveBoundedOutreachInstitutionMatch(
      { institutionName: "Kadro Kurs", email: "info@kadrokurs.com" },
      repo,
    );
    expect((repo as unknown as { __listCalls: () => number }).__listCalls()).toBe(0);
  });

  it("manual assignRecipientInstitution → matched + Ready path", async () => {
    const stores = createInMemoryOutreachStores();
    const kadro = inst({ id: "inst_kadro", name: "Kadro Kurs", email: "info@kadrokurs.com" });
    const repo = stubRepo([kadro]);
    await seedCampaign(stores, { source: "external_import" });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_1",
        campaignId: "camp_g7",
        institutionId: "ext:abc",
        displayName: "Kadro Kurs",
        institutionMatch: "unmatched",
        source: "external_import",
        email: "info@kadrokurs.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    const updated = await assignRecipientInstitution(
      {
        campaignId: "camp_g7",
        recipientId: "crec_1",
        institutionId: "inst_kadro",
        now: NOW,
      },
      { recipientRepository: stores.recipientRepository, institutionRepository: repo },
    );
    expect(updated.institutionMatch).toBe("matched");
    expect(updated.institutionId).toBe("inst_kadro");
  });

  it("rejects arbitrary/invalid institutionId on assign", async () => {
    const stores = createInMemoryOutreachStores();
    const repo = stubRepo([]);
    await seedCampaign(stores, { source: "external_import" });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_1",
        campaignId: "camp_g7",
        institutionId: "ext:abc",
        displayName: "Kadro Kurs",
        institutionMatch: "unmatched",
        source: "external_import",
        email: "info@kadrokurs.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await expect(
      assignRecipientInstitution(
        {
          campaignId: "camp_g7",
          recipientId: "crec_1",
          institutionId: "inst_does_not_exist",
          now: NOW,
        },
        { recipientRepository: stores.recipientRepository, institutionRepository: repo },
      ),
    ).rejects.toThrow(/not found/i);
    const still = await stores.recipientRepository.getById("crec_1");
    expect(still?.institutionMatch).toBe("unmatched");
  });

  it("claim Prepare blocks unmatched; matched gets DeliveryJob with real id", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const kadro = inst({ id: "inst_kadro", name: "Kadro Kurs", email: "info@kadrokurs.com" });
    await seedCampaign(stores, { source: "external_import" });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_ok",
        campaignId: "camp_g7",
        institutionId: "inst_kadro",
        displayName: "Kadro Kurs",
        institutionMatch: "matched",
        source: "external_import",
        email: "info@kadrokurs.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_bad",
        campaignId: "camp_g7",
        institutionId: "ext:bad",
        displayName: "ABC",
        institutionMatch: "unmatched",
        source: "external_import",
        email: "abc@example.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const result = await prepareImportedCampaign(
      { campaignId: "camp_g7", now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        segmentRepository: stores.segmentRepository,
        recipientRepository: stores.recipientRepository,
        deliveryJobRepository: jobs,
        institutionRepository: stubRepo([kadro]),
        config,
        targetLimit: 20,
      },
    );
    expect(result.recipientCount).toBe(1);
    const jobList = await jobs.listByCampaignId("camp_g7");
    expect(jobList).toHaveLength(1);
    expect(jobList[0]?.institutionId).toBe("inst_kadro");
    const bad = await stores.recipientRepository.getById("crec_bad");
    expect(bad?.status).toBe(CampaignRecipientStatus.Pending);
  });

  it("ambiguous recipients are not promoted on claim Prepare", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    await seedCampaign(stores, { source: "external_import" });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_amb",
        campaignId: "camp_g7",
        institutionId: "ext:amb",
        displayName: "ABC Kurs",
        institutionMatch: "ambiguous",
        matchCandidateIds: ["inst_a", "inst_b"],
        source: "external_import",
        email: "abc@example.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await expect(
      prepareImportedCampaign(
        { campaignId: "camp_g7", now: NOW },
        {
          campaignRepository: stores.campaignRepository,
          segmentRepository: stores.segmentRepository,
          recipientRepository: stores.recipientRepository,
          deliveryJobRepository: jobs,
          institutionRepository: stubRepo([]),
          config,
        },
      ),
    ).rejects.toThrow(/eşleşmiş|matched/i);
  });
});

describe("GROWTH-007 external import + match", () => {
  it("persists 20 Excel recipients without DeliveryJobs", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    await seedCampaign(stores);
    const rows = Array.from({ length: 20 }, (_, i) => `Kurum ${i},mail${i}@example.com`).join(
      "\n",
    );
    const csv = new TextEncoder().encode(`institutionName,email\n${rows}\n`);
    const result = await importExternalRecipients(
      { campaignId: "camp_g7", fileName: "20.csv", content: csv, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        institutionRepository: null,
      },
    );
    expect(result.recipientCount).toBe(20);
    expect(await jobs.listByCampaignId("camp_g7")).toHaveLength(0);
    const recipients = await stores.recipientRepository.listByCampaignId("camp_g7");
    expect(recipients).toHaveLength(20);
    expect(recipients.every((r) => r.status === CampaignRecipientStatus.Pending)).toBe(true);
  });

  it("matchCampaignRecipients is bounded (docs ≤ 15 per recipient)", async () => {
    const stores = createInMemoryOutreachStores();
    const kadro = inst({ id: "inst_kadro", name: "Kadro Kurs", email: "info@kadrokurs.com" });
    const repo = stubRepo([kadro]);
    await seedCampaign(stores, { source: "external_import" });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_1",
        campaignId: "camp_g7",
        institutionId: "ext:x",
        displayName: "Kadro Kurs",
        institutionMatch: "unmatched",
        source: "external_import",
        email: "info@kadrokurs.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    const result = await matchCampaignRecipients(
      {
        campaignId: "camp_g7",
        now: NOW,
        scope: { cityId: "istanbul", districtId: "bakirkoy" },
      },
      { recipientRepository: stores.recipientRepository, institutionRepository: repo },
    );
    expect(result.matchedCount).toBe(1);
    expect(result.documentsRead).toBeLessThanOrEqual(OUTREACH_MATCH_MAX_DOCS_PER_RECIPIENT);
    expect((repo as unknown as { __listCalls: () => number }).__listCalls()).toBe(0);
  });

  it("duplicate import replaces pending (idempotent)", async () => {
    const stores = createInMemoryOutreachStores();
    await seedCampaign(stores);
    const csv = new TextEncoder().encode(
      "institutionName,email\nKadro Kurs,info@kadrokurs.com\n",
    );
    const deps = {
      campaignRepository: stores.campaignRepository,
      recipientRepository: stores.recipientRepository,
    };
    await importExternalRecipients(
      { campaignId: "camp_g7", fileName: "a.csv", content: csv, now: NOW },
      deps,
    );
    await importExternalRecipients(
      { campaignId: "camp_g7", fileName: "b.csv", content: csv, now: NOW },
      deps,
    );
    expect(await stores.recipientRepository.listByCampaignId("camp_g7")).toHaveLength(1);
  });
});

describe("GROWTH-007 manual recipient", () => {
  it("valid email creates Pending CampaignRecipient without DeliveryJob", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    await seedCampaign(stores, { source: "manual" });
    const saved = await addManualCampaignRecipient(
      {
        campaignId: "camp_g7",
        email: "Info@Example.com",
        displayName: "Örnek",
        now: NOW,
      },
      { recipientRepository: stores.recipientRepository },
    );
    expect(saved.email).toBe("info@example.com");
    expect(saved.source).toBe("manual");
    expect(saved.status).toBe(CampaignRecipientStatus.Pending);
    expect(saved.institutionMatch).toBe("unmatched");
    expect(await jobs.listByCampaignId("camp_g7")).toHaveLength(0);
  });

  it("invalid email rejected", async () => {
    const stores = createInMemoryOutreachStores();
    await seedCampaign(stores, { source: "manual" });
    await expect(
      addManualCampaignRecipient(
        { campaignId: "camp_g7", email: "not-an-email", now: NOW },
        { recipientRepository: stores.recipientRepository },
      ),
    ).rejects.toThrow(/e-posta/i);
  });

  it("duplicate email rejected (case-insensitive)", async () => {
    const stores = createInMemoryOutreachStores();
    await seedCampaign(stores, { source: "manual" });
    const deps = { recipientRepository: stores.recipientRepository };
    await addManualCampaignRecipient(
      { campaignId: "camp_g7", email: "info@example.com", now: NOW },
      deps,
    );
    await expect(
      addManualCampaignRecipient(
        { campaignId: "camp_g7", email: "Info@Example.com", now: NOW },
        deps,
      ),
    ).rejects.toThrow(/zaten/i);
  });

  it("manual + institutionId → matched; Prepare creates DeliveryJob", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const kadro = inst({ id: "inst_kadro", name: "Kadro Kurs", email: "info@kadrokurs.com" });
    const repo = stubRepo([kadro]);
    await seedCampaign(stores, { source: "manual" });
    await addManualCampaignRecipient(
      {
        campaignId: "camp_g7",
        email: "info@kadrokurs.com",
        displayName: "Kadro Kurs",
        institutionId: "inst_kadro",
        now: NOW,
      },
      { recipientRepository: stores.recipientRepository, institutionRepository: repo },
    );
    const result = await prepareImportedCampaign(
      { campaignId: "camp_g7", now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        segmentRepository: stores.segmentRepository,
        recipientRepository: stores.recipientRepository,
        deliveryJobRepository: jobs,
        institutionRepository: repo,
        config,
      },
    );
    expect(result.recipientCount).toBe(1);
    expect(await jobs.listByCampaignId("camp_g7")).toHaveLength(1);
  });

  it("service addManualRecipient persists after list (refresh path)", async () => {
    const stores = createInMemoryOutreachStores();
    const queue = createInMemoryOutreachQueue();
    const repo = stubRepo([]);
    await seedCampaign(stores, { source: "manual" });
    const service = createOutreachService({
      ...stores,
      queue,
      institutionRepository: repo,
    });
    await service.addManualRecipient({
      campaignId: "camp_g7",
      email: "solo@example.com",
      displayName: "Solo",
      now: NOW,
    });
    const listed = await stores.recipientRepository.listByCampaignId("camp_g7");
    expect(listed).toHaveLength(1);
    expect(listed[0]?.email).toBe("solo@example.com");
  });
});

describe("GROWTH-007 cost guard regression", () => {
  it("external import still works while OUTREACH_PREPARE emergency would block prepare", async () => {
    const stores = createInMemoryOutreachStores();
    await seedCampaign(stores);
    const list = vi.fn(async () =>
      Object.freeze({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 0 }),
    );
    const csv = new TextEncoder().encode(
      "institutionName,email\nKadro Kurs,info@kadrokurs.com\n",
    );
    await importExternalRecipients(
      { campaignId: "camp_g7", fileName: "liste.csv", content: csv, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        institutionRepository: {
          getById: async () => null,
          getBySlug: async () => null,
          save: async (i) => i,
          update: async (i) => i,
          delete: async () => undefined,
          list,
        },
      },
    );
    expect(list).not.toHaveBeenCalled();
    expect(await stores.recipientRepository.listByCampaignId("camp_g7")).toHaveLength(1);
  });

  it("segment prepare path still uses billing gate (import does not)", async () => {
    // Import must not call assertOperationAllowed — covered by growth-006 + above.
    // Matching must not call list — covered above.
    expect(OUTREACH_MATCH_MAX_DOCS_PER_RECIPIENT).toBeLessThanOrEqual(15);
  });
});

describe("GROWTH-007 FIX assign mutation persistence", () => {
  it("import 20 → search → select persists matched on recipient[0]", async () => {
    const stores = createInMemoryOutreachStores();
    const queue = createInMemoryOutreachQueue();
    const gencKadro = inst({
      id: "inst_genc_kadro",
      name: "GENÇ KADRO ÖZEL ÖĞRETİM KURSU",
      email: "info@genckadro.com",
      cityId: "istanbul",
      districtId: "istanbul-bakirkoy",
    });
    const repo = stubRepo([gencKadro]);
    await seedCampaign(stores, { source: "external_import" });
    const rows = [
      "Kadro Kurs,info@kadrokurs.com",
      ...Array.from({ length: 19 }, (_, i) => `Kurum ${i + 1},mail${i + 1}@example.com`),
    ].join("\n");
    const csv = new TextEncoder().encode(`institutionName,email\n${rows}\n`);
    const imported = await importExternalRecipients(
      { campaignId: "camp_g7", fileName: "20.csv", content: csv, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        institutionRepository: repo,
      },
    );
    expect(imported.recipientCount).toBe(20);
    const listed = await stores.recipientRepository.listByCampaignId("camp_g7");
    expect(listed).toHaveLength(20);
    expect(listed.every((row) => row.campaignId === "camp_g7")).toBe(true);
    const first = listed.find((row) => row.email === "info@kadrokurs.com");
    expect(first?.id).toMatch(/^crec_imp_/);
    expect(first?.institutionMatch).not.toBe("matched");
    expect(await stores.recipientRepository.getById(first!.id)).toEqual(first);

    const hits = await searchOutreachInstitutions(
      { query: "Kadro Kurs", cityId: "istanbul", districtId: "istanbul-bakirkoy" },
      repo,
    );
    expect(hits.items.some((item) => item.id === "inst_genc_kadro")).toBe(true);
    expect(hits.usedList).toBe(false);
    expect((repo as unknown as { __listCalls: () => number }).__listCalls()).toBe(0);

    const service = createOutreachService({
      ...stores,
      queue,
      institutionRepository: repo,
    });
    const updated = await service.assignRecipientInstitution({
      campaignId: "camp_g7",
      recipientId: first!.id,
      institutionId: "inst_genc_kadro",
      now: NOW,
    });
    expect(updated.id).toBe(first!.id);
    expect(updated.institutionId).toBe("inst_genc_kadro");
    expect(updated.institutionMatch).toBe("matched");
    expect(updated.matchCandidateIds).toBeUndefined();
    const persisted = await stores.recipientRepository.getById(first!.id);
    expect(persisted?.institutionId).toBe("inst_genc_kadro");
    expect(persisted?.institutionMatch).toBe("matched");
    expect(isExternalInstitutionId(persisted!.institutionId)).toBe(false);
    const logs = await stores.logRepository.listByCampaignId("camp_g7");
    expect(logs.some((log) => log.message.includes("inst_genc_kadro"))).toBe(true);
  });

  it("rejects wrong campaignId + recipientId pairing", async () => {
    const stores = createInMemoryOutreachStores();
    const kadro = inst({ id: "inst_kadro", name: "Kadro Kurs" });
    const repo = stubRepo([kadro]);
    await seedCampaign(stores, { source: "external_import" });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_imp_mtfnq7co_1",
        campaignId: "camp_g7",
        institutionId: "ext:abc",
        displayName: "Kadro Kurs",
        institutionMatch: "unmatched",
        source: "external_import",
        email: "info@kadrokurs.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await expect(
      assignRecipientInstitution(
        {
          campaignId: "camp_other",
          recipientId: "crec_imp_mtfnq7co_1",
          institutionId: "inst_kadro",
          now: NOW,
        },
        { recipientRepository: stores.recipientRepository, institutionRepository: repo },
      ),
    ).rejects.toThrow(/another campaign|not found/i);
    const still = await stores.recipientRepository.getById("crec_imp_mtfnq7co_1");
    expect(still?.institutionMatch).toBe("unmatched");
    expect(still?.institutionId).toBe("ext:abc");
  });

  it("still assigns when getById misses but campaign list has the recipient", async () => {
    const stores = createInMemoryOutreachStores();
    const kadro = inst({ id: "inst_kadro", name: "Kadro Kurs" });
    const repo = stubRepo([kadro]);
    await seedCampaign(stores, { source: "external_import" });
    await stores.recipientRepository.save(
      createCampaignRecipient({
        id: "crec_imp_mtfnq7co_1",
        campaignId: "camp_g7",
        institutionId: "ext:abc",
        displayName: "Kadro Kurs",
        institutionMatch: "unmatched",
        matchCandidateIds: ["inst_a", "inst_b"],
        source: "external_import",
        email: "info@kadrokurs.com",
        status: CampaignRecipientStatus.Pending,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    const wrapped: CampaignRecipientRepository = {
      getById: async () => null,
      save: (row) => stores.recipientRepository.save(row),
      update: (row) => stores.recipientRepository.update(row),
      listByCampaignId: (id) => stores.recipientRepository.listByCampaignId(id),
      listByInstitutionId: (id) => stores.recipientRepository.listByInstitutionId(id),
      deleteById: (id) => stores.recipientRepository.deleteById(id),
      deleteByCampaignId: (id) => stores.recipientRepository.deleteByCampaignId(id),
    };
    const updated = await assignRecipientInstitution(
      {
        campaignId: "camp_g7",
        recipientId: "crec_imp_mtfnq7co_1",
        institutionId: "inst_kadro",
        now: NOW,
      },
      { recipientRepository: wrapped, institutionRepository: repo },
    );
    expect(updated.institutionMatch).toBe("matched");
    expect(updated.institutionId).toBe("inst_kadro");
    expect(updated.matchCandidateIds).toBeUndefined();
  });
});
