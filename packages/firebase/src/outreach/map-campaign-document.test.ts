import { describe, expect, it } from "vitest";
import { createCampaign } from "@eduatlas/domain";

const NOW = "2026-08-30T10:19:03.100Z";

describe("campaign document recipientMatchScope roundtrip", () => {
  it("rehydrates recipientMatchScope the same way FirestoreCampaignRepository.getById does", () => {
    const saved = createCampaign({
      id: "camp_b78f49c880d4",
      name: "Bakırköy İlk 20",
      templateId: "tpl_claim_invitation",
      segmentId: "seg_istanbul_unclaimed_email",
      recipientSource: "external_import",
      recipientMatchScope: { cityId: "istanbul", districtId: "istanbul-bakirkoy" },
      createdAt: NOW,
      createdBy: "admin_1",
    });
    const data = {
      name: saved.name,
      templateId: saved.templateId,
      segmentId: saved.segmentId,
      recipientSource: saved.recipientSource,
      recipientMatchScope: saved.recipientMatchScope,
      createdAt: saved.createdAt,
      createdBy: saved.createdBy,
      status: saved.status,
      channel: saved.channel,
    };
    const restored = createCampaign({
      id: "camp_b78f49c880d4",
      ...(data as Omit<Parameters<typeof createCampaign>[0], "id">),
    });
    expect(restored.recipientMatchScope).toEqual({
      cityId: "istanbul",
      districtId: "istanbul-bakirkoy",
    });
  });
});
