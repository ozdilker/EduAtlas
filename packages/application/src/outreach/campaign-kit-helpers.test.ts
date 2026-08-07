import { describe, expect, it } from "vitest";
import {
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaign,
  createCampaignRecipient,
  createDeliveryJob,
  DeliveryJobStatus,
  emptyPreSendChecklist,
  isPreSendChecklistComplete,
  mergePreSendChecklist,
} from "@eduatlas/domain";
import { buildCampaignPostSummary, buildRecipientChecklist } from "./campaign-kit-helpers";

const NOW = "2026-08-07T12:00:00.000Z";

describe("preSendChecklist", () => {
  it("blocks run until all flags true", () => {
    expect(isPreSendChecklistComplete(undefined)).toBe(false);
    expect(isPreSendChecklistComplete(emptyPreSendChecklist())).toBe(false);
    const full = mergePreSendChecklist(emptyPreSendChecklist(), {
      subjectOk: true,
      ctaOk: true,
      testMailSent: true,
      recipientsReviewed: true,
      warmupOk: true,
      sendApproved: true,
    });
    expect(isPreSendChecklistComplete(full)).toBe(true);
  });
});

describe("buildRecipientChecklist", () => {
  it("passes for clean prepared list within warmup", () => {
    const recipients = [
      createCampaignRecipient({
        id: "r1",
        campaignId: "c1",
        institutionId: "i1",
        email: "a@example.com",
        status: CampaignRecipientStatus.Queued,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    ];
    const result = buildRecipientChecklist({ recipients, warmupLimit: 20 });
    expect(result.allOk).toBe(true);
  });
});

describe("buildCampaignPostSummary", () => {
  it("aggregates sent/failed/bounce/claimed/duration", () => {
    const campaign = createCampaign({
      id: "c1",
      name: "N",
      templateId: "t",
      segmentId: "s",
      status: CampaignStatus.Running,
      createdAt: NOW,
      createdBy: "admin",
      startedAt: "2026-08-07T11:00:00.000Z",
      execution: { startedAt: "2026-08-07T11:00:00.000Z" },
    });
    const jobs = [
      createDeliveryJob({
        id: "j1",
        campaignId: "c1",
        recipientId: "r1",
        institutionId: "i1",
        status: DeliveryJobStatus.Sent,
        availableAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      }),
      createDeliveryJob({
        id: "j2",
        campaignId: "c1",
        recipientId: "r2",
        institutionId: "i2",
        status: DeliveryJobStatus.Bounced,
        availableAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    ];
    const recipients = [
      createCampaignRecipient({
        id: "r1",
        campaignId: "c1",
        institutionId: "i1",
        email: "a@example.com",
        status: CampaignRecipientStatus.Claimed,
        claimedAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      }),
      createCampaignRecipient({
        id: "r2",
        campaignId: "c1",
        institutionId: "i2",
        email: "b@example.com",
        status: CampaignRecipientStatus.Bounced,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    ];
    const summary = buildCampaignPostSummary({
      campaign,
      jobs,
      recipients,
      completedAt: "2026-08-07T12:00:00.000Z",
    });
    expect(summary.sent).toBe(1);
    expect(summary.bounced).toBe(1);
    expect(summary.claimed).toBe(1);
    expect(summary.durationMs).toBe(3_600_000);
  });
});
