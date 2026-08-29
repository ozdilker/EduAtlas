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
  type InstitutionId,
} from "@eduatlas/domain";
import type { OutreachDeliveryConfig } from "../delivery/delivery-config";
import { createInMemoryDeliveryJobRepository } from "../delivery/in-memory-delivery-job-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { createConsoleEmailService } from "../notifications/console-email-service";
import { assertPersonalizationInstitutionName } from "./apply-mail-tokens";
import { renderClaimInvitationMail } from "./claim-invitation-mail";
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import {
  importExternalRecipients,
  prepareCampaignFromImport,
  prepareImportedCampaign,
} from "./import-campaign-recipients";
import { createInMemoryOutreachQueue } from "./outreach-queue";
import {
  CLAIM_INVITATION_DEFAULT_SUBJECT,
  CLAIM_INVITATION_TEMPLATE_ID,
} from "./outreach-seeds";
import { createOutreachService } from "./outreach-service";

const config: OutreachDeliveryConfig = Object.freeze({
  warmupBatchSize: 20,
  ratePerMinute: 10,
  dailySendLimit: 100,
  retryDelayMs: 1000,
  maxAttempts: 3,
  workerInstanceId: "test-worker",
  lockTtlMs: 60_000,
});

const NOW = "2026-08-21T12:00:00.000Z";

function stubInstitutionRepository(
  institutions: readonly ReturnType<typeof createPublishedInstitution>[] = [],
): InstitutionRepository {
  return {
    getById: async (id: InstitutionId) => {
      const needle = institutionIdAsString(id);
      return institutions.find((i) => institutionIdAsString(i.id) === needle) ?? null;
    },
    getBySlug: async () => null,
    save: async (institution) => institution,
    update: async (institution) => institution,
    delete: async () => undefined,
    list: async (options) => {
      const query = options?.filters?.query?.toLocaleLowerCase("tr-TR") ?? "";
      const items = institutions.filter((inst) => {
        if (!query) return true;
        return (
          inst.name.toLocaleLowerCase("tr-TR").includes(query) ||
          (inst.contact.email?.toLocaleLowerCase("tr-TR").includes(query) ?? false)
        );
      });
      return Object.freeze({
        items,
        page: 1,
        pageSize: options?.pageSize ?? 20,
        totalItems: items.length,
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
  };
}

async function seedDraftCampaign(
  stores: ReturnType<typeof createInMemoryOutreachStores>,
  id = "camp_imp",
) {
  await stores.templateRepository.save(
    createCampaignTemplate({
      id: CLAIM_INVITATION_TEMPLATE_ID,
      name: "Invite",
      subject: CLAIM_INVITATION_DEFAULT_SUBJECT,
      preview: "Preview",
      bodyLines: ["{{institutionName}} için EduAtlas'ta bir kurum profili oluşturduk."],
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
      name: "Import",
      status: CampaignStatus.Draft,
      channel: CampaignChannel.Email,
      templateId: CLAIM_INVITATION_TEMPLATE_ID,
      segmentId: "seg_1",
      subjectOverride: CLAIM_INVITATION_DEFAULT_SUBJECT,
      createdAt: NOW,
      createdBy: "admin",
    }),
  );
}

describe("GROWTH-005 external recipient persistence & personalization", () => {
  it("persists Excel import as Pending recipients without DeliveryJobs", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    await seedDraftCampaign(stores);

    const csv = new TextEncoder().encode(
      "institutionName,email\nKadro Kurs,info@kadrokurs.com\nOkul Iki,iki@example.com\n",
    );

    let seq = 0;
    const result = await importExternalRecipients(
      { campaignId: "camp_imp", fileName: "liste.csv", content: csv, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        institutionRepository: stubInstitutionRepository(),
        nextRecipientId: () => `crec_${++seq}`,
      },
    );

    expect(result.recipientCount).toBe(2);
    expect(result.unmatchedCount).toBe(2);

    const recipients = await stores.recipientRepository.listByCampaignId("camp_imp");
    expect(recipients).toHaveLength(2);
    expect(recipients.every((r) => r.status === CampaignRecipientStatus.Pending)).toBe(true);
    expect(recipients[0]?.displayName).toBe("Kadro Kurs");
    expect(await jobs.listByCampaignId("camp_imp")).toHaveLength(0);

    const campaign = await stores.campaignRepository.getById("camp_imp");
    expect(campaign?.status).toBe(CampaignStatus.Draft);
    expect(campaign?.recipientSource).toBe("external_import");
    expect(campaign?.execution?.preparedAt).toBeUndefined();
  });

  it("duplicate import before prepare is idempotent (replace pending)", async () => {
    const stores = createInMemoryOutreachStores();
    await seedDraftCampaign(stores);
    const csv = new TextEncoder().encode(
      "institutionName,email\nKadro Kurs,info@kadrokurs.com\n",
    );
    const deps = {
      campaignRepository: stores.campaignRepository,
      recipientRepository: stores.recipientRepository,
      institutionRepository: stubInstitutionRepository(),
    };
    await importExternalRecipients(
      { campaignId: "camp_imp", fileName: "a.csv", content: csv, now: NOW },
      deps,
    );
    await importExternalRecipients(
      { campaignId: "camp_imp", fileName: "b.csv", content: csv, now: NOW },
      deps,
    );
    const recipients = await stores.recipientRepository.listByCampaignId("camp_imp");
    expect(recipients).toHaveLength(1);
    expect(recipients[0]?.displayName).toBe("Kadro Kurs");
  });

  it("Prepare creates DeliveryJobs from persisted matched recipients", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    await seedDraftCampaign(stores);
    const matched = createPublishedInstitution({
      id: "inst_kadro",
      slug: "kadro-kurs",
      name: "Kadro Kurs",
      primaryType: InstitutionType.Kindergarten,
      verification: InstitutionVerification.Unclaimed,
      location: { cityId: "istanbul", districtId: "bakirkoy", address: "Bakırköy" },
      contact: { email: "info@kadrokurs.com" },
      shortDescription: "Kurs merkezi",
      createdAt: NOW,
      updatedAt: NOW,
      publishedAt: NOW,
    });
    const csv = new TextEncoder().encode(
      "institutionName,email\nKadro Kurs,info@kadrokurs.com\n",
    );
    await importExternalRecipients(
      { campaignId: "camp_imp", fileName: "liste.csv", content: csv, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        institutionRepository: stubInstitutionRepository([matched]),
      },
    );
    const pending = await stores.recipientRepository.listByCampaignId("camp_imp");
    await stores.recipientRepository.update(
      createCampaignRecipient({
        ...pending[0]!,
        institutionId: "inst_kadro",
        institutionMatch: "matched",
        updatedAt: NOW,
      }),
    );

    const result = await prepareImportedCampaign(
      { campaignId: "camp_imp", now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        segmentRepository: stores.segmentRepository,
        recipientRepository: stores.recipientRepository,
        deliveryJobRepository: jobs,
        institutionRepository: stubInstitutionRepository([matched]),
        config,
        targetLimit: 20,
      },
    );

    expect(result.recipientCount).toBe(1);
    const recipients = await stores.recipientRepository.listByCampaignId("camp_imp");
    expect(recipients[0]?.status).toBe(CampaignRecipientStatus.Queued);
    expect(await jobs.listByCampaignId("camp_imp")).toHaveLength(1);
    const campaign = await stores.campaignRepository.getById("camp_imp");
    expect(campaign?.execution?.preparedAt).toBe(NOW);
  });

  it("claim Prepare rejects when all recipients are unmatched", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    await seedDraftCampaign(stores);
    const csv = new TextEncoder().encode(
      "institutionName,email\nKadro Kurs,info@kadrokurs.com\n",
    );
    await importExternalRecipients(
      { campaignId: "camp_imp", fileName: "liste.csv", content: csv, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        institutionRepository: stubInstitutionRepository(),
      },
    );

    await expect(
      prepareImportedCampaign(
        { campaignId: "camp_imp", now: NOW },
        {
          campaignRepository: stores.campaignRepository,
          segmentRepository: stores.segmentRepository,
          recipientRepository: stores.recipientRepository,
          deliveryJobRepository: jobs,
          institutionRepository: stubInstitutionRepository(),
          config,
          targetLimit: 20,
        },
      ),
    ).rejects.toThrow(/eşleşmiş|matched/i);
    expect(await jobs.listByCampaignId("camp_imp")).toHaveLength(0);
  });

  it("mail preview and test mail use real institutionName, never Örnek Anaokulu", async () => {
    const stores = createInMemoryOutreachStores();
    const queue = createInMemoryOutreachQueue();
    const service = createOutreachService({ ...stores, queue });
    const emailService = createConsoleEmailService();
    await seedDraftCampaign(stores, "camp_pers");

    const csv = new TextEncoder().encode(
      "institutionName,email\nKadro Kurs,info@kadrokurs.com\n",
    );
    await importExternalRecipients(
      { campaignId: "camp_pers", fileName: "liste.csv", content: csv, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        institutionRepository: stubInstitutionRepository(),
      },
    );

    const recipients = await stores.recipientRepository.listByCampaignId("camp_pers");
    const name = recipients[0]?.displayName ?? "";
    expect(name).toBe("Kadro Kurs");

    const preview = await service.previewCampaignMail({
      campaignId: "camp_pers",
      institutionName: name,
      ctaHref: "https://eduatlas.com.tr/login",
    });
    expect(preview.subject).toBe("Kadro Kurs için EduAtlas kurum paneli hazır");
    expect(preview.subject.includes("Örnek Anaokulu")).toBe(false);
    expect(preview.html).toContain("Kadro Kurs");
    expect(preview.html.includes("Örnek Anaokulu")).toBe(false);

    const rendered = renderClaimInvitationMail({
      subject: CLAIM_INVITATION_DEFAULT_SUBJECT,
      preheader: "pre",
      institutionName: name,
      ctaHref: "https://eduatlas.com.tr/login",
      bodyLines: ["{{institutionName}} için EduAtlas'ta bir kurum profili oluşturduk."],
    });
    expect(rendered.html).toContain(
      "Kadro Kurs için EduAtlas'ta bir kurum profili oluşturduk.",
    );

    const sent = await service.sendTestEmail({
      campaignId: "camp_pers",
      to: "admin@example.com",
      institutionName: name,
      ctaHref: "https://eduatlas.com.tr/login",
      now: NOW,
      emailService,
    });
    expect(emailService.sent[0]?.to).toBe("admin@example.com");
    expect(sent.rendered.subject).toBe("Kadro Kurs için EduAtlas kurum paneli hazır");
    expect(sent.rendered.subject.includes("Örnek Anaokulu")).toBe(false);

    expect(() => assertPersonalizationInstitutionName("Örnek Anaokulu")).toThrow(/demo/i);
  });

  it("matches catalog institution by email when resolveCatalogMatches is opted in", async () => {
    const matched = createPublishedInstitution({
      id: "inst_kadro",
      slug: "kadro-kurs",
      name: "Kadro Kurs",
      primaryType: InstitutionType.Kindergarten,
      verification: InstitutionVerification.Unclaimed,
      location: { cityId: "istanbul", districtId: "bakirkoy", address: "Bakırköy" },
      contact: { email: "info@kadrokurs.com" },
      shortDescription: "Kurs merkezi",
      createdAt: NOW,
      updatedAt: NOW,
      publishedAt: NOW,
    });
    const stores = createInMemoryOutreachStores();
    await seedDraftCampaign(stores);
    const csv = new TextEncoder().encode(
      "institutionName,email\nKadro Kurs,info@kadrokurs.com\nABC Eğitim,info@abc.com\n",
    );
    const result = await importExternalRecipients(
      { campaignId: "camp_imp", fileName: "liste.csv", content: csv, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        recipientRepository: stores.recipientRepository,
        institutionRepository: stubInstitutionRepository([matched]),
        resolveCatalogMatches: true,
      },
    );
    expect(result.matchedCount).toBe(1);
    expect(result.unmatchedCount).toBe(1);
    const recipients = await stores.recipientRepository.listByCampaignId("camp_imp");
    const kadro = recipients.find((r) => r.email === "info@kadrokurs.com");
    const abc = recipients.find((r) => r.email === "info@abc.com");
    expect(kadro?.institutionMatch).toBe("matched");
    expect(kadro?.institutionId).toBe("inst_kadro");
    expect(abc?.institutionMatch).toBe("unmatched");
    expect(isExternalInstitutionId(abc?.institutionId ?? "")).toBe(true);
  });

  it("default import path does not scan institution catalog", async () => {
    const stores = createInMemoryOutreachStores();
    await seedDraftCampaign(stores);
    const list = vi.fn(async () =>
      Object.freeze({
        items: [],
        page: 1,
        pageSize: 50,
        totalItems: 0,
        totalPages: 0,
      }),
    );
    const csv = new TextEncoder().encode(
      "institutionName,email\nKadro Kurs,info@kadrokurs.com\n",
    );
    await importExternalRecipients(
      { campaignId: "camp_imp", fileName: "liste.csv", content: csv, now: NOW },
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
  });

  it("one-shot prepareCampaignFromImport still creates jobs (compat)", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    await seedDraftCampaign(stores);
    const institutions = [
      createPublishedInstitution({
        id: "inst_1",
        slug: "okul-bir",
        name: "Okul Bir",
        primaryType: InstitutionType.Kindergarten,
        verification: InstitutionVerification.Unclaimed,
        location: { cityId: "istanbul", districtId: "bakirkoy", address: "A" },
        contact: { email: "bir@example.com" },
        shortDescription: "x",
        createdAt: NOW,
        updatedAt: NOW,
        publishedAt: NOW,
      }),
      createPublishedInstitution({
        id: "inst_2",
        slug: "okul-iki",
        name: "Okul Iki",
        primaryType: InstitutionType.Kindergarten,
        verification: InstitutionVerification.Unclaimed,
        location: { cityId: "istanbul", districtId: "bakirkoy", address: "B" },
        contact: { email: "iki@example.com" },
        shortDescription: "x",
        createdAt: NOW,
        updatedAt: NOW,
        publishedAt: NOW,
      }),
    ];
    const csv = new TextEncoder().encode(
      "institutionName,email\nOkul Bir,bir@example.com\nOkul Iki,iki@example.com\n",
    );
    let seq = 0;
    const result = await prepareCampaignFromImport(
      { campaignId: "camp_imp", fileName: "liste.csv", content: csv, now: NOW },
      {
        campaignRepository: stores.campaignRepository,
        segmentRepository: stores.segmentRepository,
        recipientRepository: stores.recipientRepository,
        deliveryJobRepository: jobs,
        institutionRepository: stubInstitutionRepository(institutions),
        config,
        targetLimit: 20,
        nextRecipientId: () => `crec_${++seq}`,
        nextJobId: () => `djob_${++seq}`,
      },
    );
    expect(result.recipientCount).toBe(2);
    expect(await jobs.listByCampaignId("camp_imp")).toHaveLength(2);
  });
});
