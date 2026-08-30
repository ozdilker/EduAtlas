import { describe, expect, it } from "vitest";
import { CampaignChannel, CampaignStatus } from "../outreach";
import { parseCampaignRecipientStatus } from "../outreach/campaign-recipient-status";
import { parseCampaignStatus } from "../outreach/campaign-status";
import { buildDeliveryIdempotencyKey } from "./delivery-idempotency";
import { createDeliveryJob } from "./delivery-job";
import { DeliveryJobStatus, parseDeliveryJobStatus } from "./delivery-job-status";

describe("DeliveryJob", () => {
  it("builds idempotency key and creates a pending job", () => {
    const key = buildDeliveryIdempotencyKey({
      campaignId: "camp_1",
      institutionId: "inst_1",
      channel: CampaignChannel.Email,
    });
    expect(key).toBe("camp_1:inst_1:email");

    const recipientKey = buildDeliveryIdempotencyKey({
      campaignId: "camp_1",
      recipientId: "crec_1",
      channel: CampaignChannel.Email,
    });
    expect(recipientKey).toBe("camp_1:crec_1:email");

    const job = createDeliveryJob({
      id: "job_1",
      campaignId: "camp_1",
      recipientId: "rec_1",
      institutionId: "inst_1",
      availableAt: "2026-08-02T00:00:00.000Z",
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    });
    expect(job.status).toBe(DeliveryJobStatus.Pending);
    expect(job.idempotencyKey).toBe(key);
    expect(job.maxAttempts).toBe(3);
  });

  it("parses locked status", () => {
    expect(parseDeliveryJobStatus("locked")).toBe("locked");
  });
});

describe("campaign status extensions", () => {
  it("parses failed campaign status", () => {
    expect(parseCampaignStatus("failed")).toBe(CampaignStatus.Failed);
  });

  it("parses sending recipient status", () => {
    expect(parseCampaignRecipientStatus("sending")).toBe("sending");
  });
});
