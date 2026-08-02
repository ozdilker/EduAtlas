import {
  CampaignStatus,
  createCampaignSegment,
  createCampaignTemplate,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { createConsoleEmailService } from "../notifications/console-email-service";
import { applyMailTokens } from "./apply-mail-tokens";
import {
  CLAIM_INVITATION_CTA_LABEL,
  renderClaimInvitationMail,
} from "./claim-invitation-mail";
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import { createInMemoryOutreachQueue } from "./outreach-queue";
import {
  CLAIM_INVITATION_DEFAULT_PREHEADER,
  CLAIM_INVITATION_DEFAULT_SUBJECT,
  CLAIM_INVITATION_TEMPLATE_ID,
  ensureOutreachSeeds,
  ISTANBUL_CITY_ID,
  ISTANBUL_UNCLAIMED_SEGMENT_ID,
} from "./outreach-seeds";
import { createOutreachService } from "./outreach-service";

const NOW = "2026-08-02T15:00:00.000Z";

describe("applyMailTokens", () => {
  it("replaces institutionName only", () => {
    expect(
      applyMailTokens("Merhaba {{institutionName}} — {{city}}", {
        institutionName: "Demo Anaokulu",
      }),
    ).toBe("Merhaba Demo Anaokulu — {{city}}");
  });
});

describe("renderClaimInvitationMail", () => {
  it("renders EMDS shell with claim CTA and personalized subject", () => {
    const rendered = renderClaimInvitationMail({
      subject: CLAIM_INVITATION_DEFAULT_SUBJECT,
      preheader: CLAIM_INVITATION_DEFAULT_PREHEADER,
      institutionName: "Örnek Anaokulu",
      ctaHref: "https://eduatlas.com.tr/login",
    });
    expect(rendered.html).toContain("max-width:600px");
    expect(rendered.html).toContain(CLAIM_INVITATION_CTA_LABEL);
    expect(rendered.html).toContain("Kurum daveti");
    expect(rendered.html).toContain("Örnek Anaokulu");
    expect(rendered.subject).toContain("Örnek Anaokulu");
    expect(rendered.html).not.toContain("{{institutionName}}");
  });
});

describe("ensureOutreachSeeds", () => {
  it("seeds claim invitation template and Istanbul segment once", async () => {
    const stores = createInMemoryOutreachStores();
    await ensureOutreachSeeds({
      templateRepository: stores.templateRepository,
      segmentRepository: stores.segmentRepository,
      now: NOW,
    });
    await ensureOutreachSeeds({
      templateRepository: stores.templateRepository,
      segmentRepository: stores.segmentRepository,
      now: NOW,
    });

    const template = await stores.templateRepository.getById(CLAIM_INVITATION_TEMPLATE_ID);
    const segment = await stores.segmentRepository.getById(ISTANBUL_UNCLAIMED_SEGMENT_ID);
    expect(template?.name).toContain("Claim");
    expect(segment?.filters.cityId).toBe(ISTANBUL_CITY_ID);
    expect(segment?.filters.hasEmail).toBe(true);
    expect(segment?.filters.verification).toBe("unclaimed");
    expect(await stores.templateRepository.list()).toHaveLength(1);
    expect(await stores.segmentRepository.list()).toHaveLength(1);
  });
});

describe("OutreachService builder flows", () => {
  it("updates subject/preheader and sends a single test email without running", async () => {
    const stores = createInMemoryOutreachStores();
    const queue = createInMemoryOutreachQueue();
    const service = createOutreachService({ ...stores, queue });
    const emailService = createConsoleEmailService();

    await ensureOutreachSeeds({
      templateRepository: stores.templateRepository,
      segmentRepository: stores.segmentRepository,
      now: NOW,
    });

    const campaign = await service.createCampaign({
      id: "camp_builder_1",
      name: "İstanbul claim",
      templateId: CLAIM_INVITATION_TEMPLATE_ID,
      segmentId: ISTANBUL_UNCLAIMED_SEGMENT_ID,
      subjectOverride: "{{institutionName}} paneli hazır",
      preheader: "Test preheader",
      createdAt: NOW,
      createdBy: "admin_1",
    });
    expect(campaign.status).toBe(CampaignStatus.Draft);

    const updated = await service.updateCampaign({
      campaignId: "camp_builder_1",
      name: "İstanbul claim v2",
      templateId: CLAIM_INVITATION_TEMPLATE_ID,
      segmentId: ISTANBUL_UNCLAIMED_SEGMENT_ID,
      subjectOverride: "{{institutionName}} için davet",
      preheader: "Güncel preheader",
      now: NOW,
    });
    expect(updated.name).toBe("İstanbul claim v2");
    expect(updated.subjectOverride).toBe("{{institutionName}} için davet");

    const preview = await service.previewCampaignMail({
      campaignId: "camp_builder_1",
      institutionName: "Örnek Anaokulu",
      ctaHref: "https://eduatlas.com.tr/login",
    });
    expect(preview.subject).toBe("Örnek Anaokulu için davet");
    expect(preview.html).toContain(CLAIM_INVITATION_CTA_LABEL);

    const sent = await service.sendTestEmail({
      campaignId: "camp_builder_1",
      to: "admin@eduatlas.com.tr",
      institutionName: "Örnek Anaokulu",
      ctaHref: "https://eduatlas.com.tr/login",
      now: NOW,
      emailService,
    });
    expect(sent.messageId).toBeTruthy();
    expect(emailService.sent).toHaveLength(1);
    expect(emailService.sent[0]?.to).toBe("admin@eduatlas.com.tr");
    expect(emailService.sent[0]?.subject).toContain("Örnek Anaokulu");

    const jobs = await queue.listReady(NOW);
    expect(jobs).toHaveLength(1);

    const after = await stores.campaignRepository.getById("camp_builder_1");
    expect(after?.status).toBe(CampaignStatus.Draft);

    const logs = await stores.logRepository.listByCampaignId("camp_builder_1");
    expect(logs.some((l) => l.message.includes("Test email sent to"))).toBe(true);
  });

  it("rejects update without subject", async () => {
    const stores = createInMemoryOutreachStores();
    const queue = createInMemoryOutreachQueue();
    const service = createOutreachService({ ...stores, queue });
    await stores.templateRepository.save(
      createCampaignTemplate({
        id: "tpl_x",
        name: "X",
        subject: "S",
        preview: "P",
        bodyLines: ["B"],
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await stores.segmentRepository.save(
      createCampaignSegment({
        id: "seg_x",
        name: "X",
        filters: {},
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await service.createCampaign({
      id: "camp_x",
      name: "X",
      templateId: "tpl_x",
      segmentId: "seg_x",
      createdAt: NOW,
      createdBy: "admin_1",
    });
    await expect(
      service.updateCampaign({
        campaignId: "camp_x",
        name: "X",
        templateId: "tpl_x",
        segmentId: "seg_x",
        subjectOverride: "  ",
        preheader: "pre",
        now: NOW,
      }),
    ).rejects.toThrow(/subject/i);
  });
});
