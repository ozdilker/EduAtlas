import { describe, expect, it } from "vitest";
import { CampaignRecipientStatus } from "@eduatlas/domain";
import { mapCampaignRecipientDocument } from "./firestore-outreach-repositories";

const NOW = "2026-08-30T10:19:03.100Z";

describe("mapCampaignRecipientDocument", () => {
  it("uses Firestore document id even when payload.id differs", () => {
    const recipient = mapCampaignRecipientDocument("crec_imp_mtfnq7co_1", {
      id: "wrong-payload-id",
      campaignId: "camp_b78f49c880d4",
      institutionId: "ext:466071f33d030909d6c44761",
      displayName: "Kadro Kurs",
      institutionMatch: "unmatched",
      source: "external_import",
      email: "info@kadrokurs.com",
      status: "pending",
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(recipient.id).toBe("crec_imp_mtfnq7co_1");
    expect(recipient.campaignId).toBe("camp_b78f49c880d4");
    expect(recipient.status).toBe(CampaignRecipientStatus.Pending);
  });
});
