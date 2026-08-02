import {
  BillingEntitlement,
  createLead,
  LeadStatus,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { presentOwnerLeads } from "./present-owner-leads";
import type { InstitutionBillingAccess } from "./resolve-institution-billing-access";

function lead(id: string, createdAt: string) {
  return createLead({
    id,
    institutionId: "inst_1",
    parentName: "Ahmet Yılmaz",
    phone: "05321234567",
    email: "ahmet@gmail.com",
    message: "Bilgi almak istiyorum",
    consentAcceptedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    status: LeadStatus.New,
  });
}

describe("presentOwnerLeads", () => {
  const freeAccess: InstitutionBillingAccess = {
    planCode: "free",
    planName: "Free",
    entitlements: { [BillingEntitlement.FreeLeadQuota]: 3 },
    subscription: null,
    isPaidOrTrialing: false,
  };

  it("masks leads after the free quota using lifetime order", () => {
    const leads = [
      lead("lead_4", "2026-01-04T00:00:00.000Z"),
      lead("lead_1", "2026-01-01T00:00:00.000Z"),
      lead("lead_2", "2026-01-02T00:00:00.000Z"),
      lead("lead_3", "2026-01-03T00:00:00.000Z"),
    ];
    const presented = presentOwnerLeads(leads, freeAccess);
    const byId = Object.fromEntries(presented.map((p) => [p.lead.id.value, p]));

    expect(byId.lead_1).toBeDefined();
    expect(byId.lead_3).toBeDefined();
    expect(byId.lead_4).toBeDefined();
    expect(byId.lead_1!.locked).toBe(false);
    expect(byId.lead_1!.parentName).toBe("Ahmet Yılmaz");
    expect(byId.lead_3!.locked).toBe(false);
    expect(byId.lead_4!.locked).toBe(true);
    expect(byId.lead_4!.parentName).toBe("Ahmet Y*****");
    expect(byId.lead_4!.phone).toBe("05********");
    expect(byId.lead_4!.email).toBe("ah****@gmail.com");
  });

  it("unlocks all when unlimitedLeads entitlement is present", () => {
    const access: InstitutionBillingAccess = {
      ...freeAccess,
      planCode: "pro",
      entitlements: { [BillingEntitlement.UnlimitedLeads]: true },
      isPaidOrTrialing: true,
    };
    const presented = presentOwnerLeads(
      [lead("lead_1", "2026-01-01T00:00:00.000Z"), lead("lead_9", "2026-02-01T00:00:00.000Z")],
      access,
    );
    expect(presented.every((p) => !p.locked)).toBe(true);
  });
});
