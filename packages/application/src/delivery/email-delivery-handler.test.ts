import { describe, expect, it, vi } from "vitest";
import {
  CampaignChannel,
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaign,
  createCampaignRecipient,
  createDeliveryJob,
  DeliveryJobStatus,
} from "@eduatlas/domain";
import { createEmailDeliveryHandler } from "./email-delivery-handler";

describe("EmailDeliveryHandler displayName", () => {
  it("prefers recipient.displayName over resolveInstitutionName", async () => {
    let capturedSubject = "";
    let capturedHtml = "";
    const send = vi.fn(
      async (input: { subject: string; html: string; text: string; to: string; messageId?: string }) => {
        capturedSubject = input.subject;
        capturedHtml = input.html;
        return Object.freeze({
          accepted: true,
          messageId: "m1",
          smtpResponse: "250 ok",
          smtpCode: "250",
        });
      },
    );
    const resolveInstitutionName = vi.fn(async () => "Catalog Name");
    const handler = createEmailDeliveryHandler({
      emailService: { send },
      templateRepository: {
        getById: async () =>
          Object.freeze({
            id: "tpl_custom",
            name: "Custom",
            subject: "Merhaba {{institutionName}}",
            preview: "Önizleme",
            bodyLines: ["Sayın {{institutionName}}"],
            createdAt: "2026-08-02T00:00:00.000Z",
            updatedAt: "2026-08-02T00:00:00.000Z",
          }),
        list: async () => [],
        save: async (t) => t,
        update: async (t) => t,
      },
      ctaHref: "https://eduatlas.com.tr/login",
      resolveInstitutionName,
    });

    const campaign = createCampaign({
      id: "camp_1",
      name: "Test",
      status: CampaignStatus.Running,
      channel: CampaignChannel.Email,
      templateId: "tpl_custom",
      segmentId: "seg_1",
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "admin",
    });
    const recipient = createCampaignRecipient({
      id: "rec_1",
      campaignId: "camp_1",
      institutionId: "ext:deadbeef",
      displayName: "Harici Okul",
      email: "harici@example.com",
      status: CampaignRecipientStatus.Queued,
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    });
    const job = createDeliveryJob({
      id: "job_1",
      channel: CampaignChannel.Email,
      campaignId: "camp_1",
      recipientId: "rec_1",
      institutionId: "ext:deadbeef",
      status: DeliveryJobStatus.Pending,
      idempotencyKey: "k1",
      attemptCount: 0,
      maxAttempts: 3,
      availableAt: "2026-08-02T00:00:00.000Z",
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    });

    const result = await handler.send({
      job,
      recipient,
      campaign,
      now: "2026-08-02T00:00:00.000Z",
    });

    expect(result.outcome).toBe("accepted");
    expect(resolveInstitutionName).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledOnce();
    expect(capturedSubject).toContain("Harici Okul");
    expect(capturedHtml).toContain("Harici Okul");
  });
});
