import { describe, expect, it } from "vitest";
import { createLead, LeadRole, LeadStatus } from "./index";

describe("Lead domain", () => {
  it("creates an immutable lead with required fields", () => {
    const lead = createLead({
      id: "lead_1",
      institutionId: "seed_inst_ist_kolej_1",
      parentName: "Ayşe Yılmaz",
      phone: "+90 532 000 00 00",
      message: "Ücret ve kontenjan hakkında bilgi almak istiyorum.",
      consentAcceptedAt: "2026-07-14T12:00:00.000Z",
      createdAt: "2026-07-14T12:00:00.000Z",
      updatedAt: "2026-07-14T12:00:00.000Z",
    });

    expect(Object.isFrozen(lead)).toBe(true);
    expect(lead.status).toBe(LeadStatus.New);
    expect(lead.role).toBe(LeadRole.Parent);
    expect(lead.parentName).toBe("Ayşe Yılmaz");
  });

  it("rejects missing message and invalid phone", () => {
    expect(() =>
      createLead({
        id: "lead_2",
        institutionId: "seed_inst_ist_kolej_1",
        parentName: "Ayşe",
        phone: "abc",
        message: "Merhaba",
        consentAcceptedAt: "2026-07-14T12:00:00.000Z",
        createdAt: "2026-07-14T12:00:00.000Z",
        updatedAt: "2026-07-14T12:00:00.000Z",
      }),
    ).toThrow(/phone/);

    expect(() =>
      createLead({
        id: "lead_3",
        institutionId: "seed_inst_ist_kolej_1",
        parentName: "Ayşe",
        phone: "+90 532 000 00 00",
        message: "   ",
        consentAcceptedAt: "2026-07-14T12:00:00.000Z",
        createdAt: "2026-07-14T12:00:00.000Z",
        updatedAt: "2026-07-14T12:00:00.000Z",
      }),
    ).toThrow(/message/);
  });
});
