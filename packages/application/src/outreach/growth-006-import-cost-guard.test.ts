import {
  CampaignChannel,
  CampaignStatus,
  createBillingProtection,
  createCampaign,
  createCampaignSegment,
  createCampaignTemplate,
} from "@eduatlas/domain";
import { describe, expect, it, vi } from "vitest";
import {
  assertOperationAllowed,
  isBillingProtectionError,
} from "../billing-protection";
import type { BillingProtectionRepository } from "../billing-protection/billing-protection-repository";
import { createInMemoryDeliveryJobRepository } from "../delivery/in-memory-delivery-job-repository";
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import { importExternalRecipients } from "./import-campaign-recipients";
import { previewSegmentInstitutions } from "./preview-segment-institutions";

const NOW = "2026-08-29T12:00:00.000Z";

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

describe("GROWTH-006 external import vs OUTREACH_PREPARE cost guard", () => {
  it("A) external import succeeds while EMERGENCY blocks OUTREACH_PREPARE", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    await stores.templateRepository.save(
      createCampaignTemplate({
        id: "tpl_1",
        name: "Invite",
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
        id: "camp_bakirkoy",
        name: "Bakırköy İlk 20 — Kurum Profilinizi Sahiplenin",
        status: CampaignStatus.Draft,
        channel: CampaignChannel.Email,
        templateId: "tpl_1",
        segmentId: "seg_1",
        createdAt: NOW,
        createdBy: "admin",
      }),
    );

    const billing = emergencyRepo();

    await expect(
      assertOperationAllowed("OUTREACH_PREPARE", {
        billingProtectionRepository: billing,
      }),
    ).rejects.toSatisfy((error: unknown) => {
      return (
        isBillingProtectionError(error) &&
        /Kampanya hazırlama \/ segment önizleme maliyet koruması \(EMERGENCY\)/i.test(
          error.message,
        )
      );
    });

    const list = vi.fn(async () =>
      Object.freeze({
        items: [],
        page: 1,
        pageSize: 50,
        totalItems: 0,
        totalPages: 0,
      }),
    );

    const rows = Array.from({ length: 20 }, (_, i) => {
      const n = i + 1;
      return `Okul ${n},okul${n}@example.com`;
    }).join("\n");
    const csv = new TextEncoder().encode(`institutionName,email\n${rows}\n`);

    const result = await importExternalRecipients(
      {
        campaignId: "camp_bakirkoy",
        fileName: "bakirkoy-20.csv",
        content: csv,
        now: NOW,
      },
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
        billingProtectionRepository: billing,
        resolveCatalogMatches: false,
      },
    );

    expect(result.recipientCount).toBe(20);
    expect(result.parse.accepted).toHaveLength(20);
    expect(result.parse.rejected).toHaveLength(0);
    expect(result.parse.duplicateEmailCount).toBe(0);
    expect(list).not.toHaveBeenCalled();

    const recipients = await stores.recipientRepository.listByCampaignId("camp_bakirkoy");
    expect(recipients).toHaveLength(20);
    expect(await jobs.listByCampaignId("camp_bakirkoy")).toHaveLength(0);

    const campaign = await stores.campaignRepository.getById("camp_bakirkoy");
    expect(campaign?.status).toBe(CampaignStatus.Draft);
    expect(campaign?.recipientSource).toBe("external_import");
    expect(campaign?.execution?.preparedAt).toBeUndefined();
  });

  it("B) segment preview remains blocked under EMERGENCY (guard not removed)", async () => {
    const stores = createInMemoryOutreachStores();
    await stores.segmentRepository.save(
      createCampaignSegment({
        id: "seg_guard",
        name: "Seg",
        filters: { cityId: "istanbul" },
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const list = vi.fn(async () =>
      Object.freeze({
        items: [],
        page: 1,
        pageSize: 500,
        totalItems: 0,
        totalPages: 0,
      }),
    );

    await expect(
      previewSegmentInstitutions(
        { segmentId: "seg_guard", limit: 25 },
        {
          segmentRepository: stores.segmentRepository,
          institutionRepository: {
            getById: async () => null,
            getBySlug: async () => null,
            save: async (i) => i,
            update: async (i) => i,
            delete: async () => undefined,
            list,
          },
          billingProtectionRepository: emergencyRepo(),
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

    expect(list).not.toHaveBeenCalled();
  });
});
