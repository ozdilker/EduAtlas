import { describe, expect, it } from "vitest";
import {
  CampaignChannel,
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaign,
  createCampaignRecipient,
  createCampaignSegment,
  createCampaignTemplate,
} from "./index";

describe("createCampaign", () => {
  it("creates a draft email campaign", () => {
    const c = createCampaign({
      id: "camp_1",
      name: "Istanbul unclaimed",
      status: CampaignStatus.Draft,
      channel: CampaignChannel.Email,
      templateId: "tpl_1",
      segmentId: "seg_1",
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "admin_1",
    });
    expect(c.status).toBe("draft");
    expect(c.channel).toBe("email");
  });
});

describe("createCampaignSegment", () => {
  it("stores filters", () => {
    const s = createCampaignSegment({
      id: "seg_1",
      name: "Istanbul unclaimed",
      filters: { cityId: "tr-34", hasEmail: true, verification: "unclaimed" },
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    });
    expect(s.filters.cityId).toBe("tr-34");
    expect(s.filters.hasEmail).toBe(true);
  });
});

describe("createCampaignRecipient", () => {
  it("defaults to pending", () => {
    const r = createCampaignRecipient({
      id: "rec_1",
      campaignId: "camp_1",
      institutionId: "inst_1",
      email: "school@example.com",
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    });
    expect(r.status).toBe(CampaignRecipientStatus.Pending);
  });
});

describe("createCampaignTemplate", () => {
  it("rejects empty body lines", () => {
    expect(() =>
      createCampaignTemplate({
        id: "tpl_1",
        name: "Invite",
        subject: "Subject",
        preview: "Preview",
        bodyLines: [],
        createdAt: "2026-08-02T00:00:00.000Z",
        updatedAt: "2026-08-02T00:00:00.000Z",
      }),
    ).toThrow(/bodyLines/);
  });
});
