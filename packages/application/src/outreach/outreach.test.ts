import {
  CampaignChannel,
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaignSegment,
  createCampaignTemplate,
  createInstitution,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import { institutionMatchesSegment } from "./institution-matches-segment";
import { createInMemoryOutreachQueue } from "./outreach-queue";
import { createOutreachService } from "./outreach-service";
import { renderCampaignTemplatePreview } from "./render-campaign-template";

const NOW = "2026-08-02T12:00:00.000Z";

function sampleInstitution(overrides: {
  cityId?: string;
  email?: string;
  verification?: InstitutionVerification;
  rating?: number;
} = {}) {
  return createInstitution({
    id: "inst_1",
    name: "Demo Okul",
    slug: "demo-okul",
    primaryType: InstitutionType.Kindergarten,
    status: InstitutionStatus.Published,
    verification: overrides.verification ?? InstitutionVerification.Unclaimed,
    location: {
      cityId: overrides.cityId ?? "tr-34",
      districtId: "tr-34-kadikoy",
      address: "Adres 1",
    },
    contact: {
      email: overrides.email ?? "school@example.com",
      phone: "02160000000",
    },
    socialLinks: {
      websiteUrl: "https://example.com",
    },
    shortDescription: "Kısa açıklama",
    createdAt: NOW,
    updatedAt: NOW,
    publishedAt: NOW,
    ...(overrides.rating !== undefined
      ? {
          googleBusiness: {
            placeId: "p1",
            placeName: "Demo",
            rating: overrides.rating,
            matchMethod: "search",
            syncStatus: "synced",
            retryCount: 0,
            lastSyncedAt: NOW,
          },
        }
      : {}),
  });
}

describe("InMemoryOutreachQueue", () => {
  it("enqueues jobs without sending mail", async () => {
    const q = createInMemoryOutreachQueue();
    const job = await q.enqueue({
      campaignId: "camp_1",
      recipientId: "rec_1",
      channel: CampaignChannel.Email,
      createdAt: NOW,
      availableAt: NOW,
    });
    const ready = await q.listReady("2026-08-02T13:00:00.000Z");
    expect(ready.map((j) => j.id)).toContain(job.id);
  });
});

describe("institutionMatchesSegment", () => {
  it("matches city and hasEmail filters", () => {
    const segment = createCampaignSegment({
      id: "seg_1",
      name: "Istanbul email",
      filters: { cityId: "tr-34", hasEmail: true, verification: "unclaimed" },
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(institutionMatchesSegment(sampleInstitution(), segment)).toBe(true);
    expect(
      institutionMatchesSegment(sampleInstitution({ cityId: "tr-06" }), segment),
    ).toBe(false);
  });

  it("applies google rating min filter", () => {
    const segment = createCampaignSegment({
      id: "seg_2",
      name: "High rated",
      filters: { googleRatingMin: 4.5 },
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(institutionMatchesSegment(sampleInstitution({ rating: 4.8 }), segment)).toBe(true);
    expect(institutionMatchesSegment(sampleInstitution({ rating: 4.0 }), segment)).toBe(false);
    expect(institutionMatchesSegment(sampleInstitution(), segment)).toBe(false);
  });
});

describe("renderCampaignTemplatePreview", () => {
  it("renders preview via EMDS 600px shell", () => {
    const template = createCampaignTemplate({
      id: "tpl_1",
      name: "Invite",
      subject: "Kurumunu sahiplen",
      preview: "Önizleme",
      bodyLines: ["Merhaba,", "EduAtlas’ta profilinizi yönetin."],
      createdAt: NOW,
      updatedAt: NOW,
    });
    const rendered = renderCampaignTemplatePreview(template);
    expect(rendered.html).toContain("max-width:600px");
    expect(rendered.html).toContain("#d1272c");
    expect(rendered.html).toContain("#0d8a8e");
    expect(rendered.subject).toBe("Kurumunu sahiplen");
  });
});

describe("OutreachService", () => {
  it("creates, marks ready, adds recipients, enqueues without sending", async () => {
    const stores = createInMemoryOutreachStores();
    const queue = createInMemoryOutreachQueue();
    const service = createOutreachService({ ...stores, queue });

    await stores.templateRepository.save(
      createCampaignTemplate({
        id: "tpl_1",
        name: "Invite",
        subject: "Subject",
        preview: "Preview",
        bodyLines: ["Body line"],
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.segmentRepository.save(
      createCampaignSegment({
        id: "seg_1",
        name: "Seg",
        filters: { cityId: "tr-34" },
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const campaign = await service.createCampaign({
      id: "camp_1",
      name: "Istanbul unclaimed",
      templateId: "tpl_1",
      segmentId: "seg_1",
      createdAt: NOW,
      createdBy: "admin_1",
      channel: CampaignChannel.Email,
    });
    expect(campaign.status).toBe(CampaignStatus.Draft);

    const recipients = await service.addRecipients({
      campaignId: "camp_1",
      now: NOW,
      recipients: [{ institutionId: "inst_1", email: "a@example.com" }],
    });
    expect(recipients[0]?.status).toBe(CampaignRecipientStatus.Pending);

    const ready = await service.markReady("camp_1", NOW);
    expect(ready.status).toBe(CampaignStatus.Ready);

    const enqueued = await service.enqueuePendingRecipients("camp_1", NOW);
    expect(enqueued).toBe(1);
    const jobs = await queue.listReady(NOW);
    expect(jobs).toHaveLength(1);

    const counts = await service.countRecipientsByStatus("camp_1");
    expect(counts.queued).toBe(1);

    const claimed = await service.markRecipientClaimed({
      institutionId: "inst_1",
      claimedAt: "2026-08-03T00:00:00.000Z",
    });
    expect(claimed).toBe(1);
    const after = await service.countRecipientsByStatus("camp_1");
    expect(after.claimed).toBe(1);

    const preview = await service.previewTemplate("tpl_1");
    expect(preview.html).toContain("max-width:600px");

    const logs = await stores.logRepository.listByCampaignId("camp_1");
    expect(logs.length).toBeGreaterThanOrEqual(3);
  });
});
