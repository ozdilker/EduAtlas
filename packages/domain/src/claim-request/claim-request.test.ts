import { describe, expect, it } from "vitest";
import { ClaimApplicantRole, ClaimRequestStatus, createClaimRequest } from "./index";

describe("ClaimRequest domain", () => {
  it("creates an immutable claim request with required fields", () => {
    const claim = createClaimRequest({
      id: "claim_1",
      institutionId: "seed_inst_ist_kolej_1",
      applicantName: "Ahmet Yılmaz",
      phone: "+90 532 000 00 00",
      email: "ahmet@example.com",
      message: "Kurum sahibi olarak profili sahiplenmek istiyorum.",
      createdAt: "2026-07-14T12:00:00.000Z",
      updatedAt: "2026-07-14T12:00:00.000Z",
    });

    expect(Object.isFrozen(claim)).toBe(true);
    expect(claim.status).toBe(ClaimRequestStatus.Pending);
    expect(claim.role).toBe(ClaimApplicantRole.Owner);
    expect(claim.email).toBe("ahmet@example.com");
  });

  it("rejects invalid email, phone, and evidence URL", () => {
    expect(() =>
      createClaimRequest({
        id: "claim_2",
        institutionId: "seed_inst_ist_kolej_1",
        applicantName: "Ahmet",
        phone: "abc",
        email: "ahmet@example.com",
        message: "Merhaba",
        createdAt: "2026-07-14T12:00:00.000Z",
        updatedAt: "2026-07-14T12:00:00.000Z",
      }),
    ).toThrow(/phone/);

    expect(() =>
      createClaimRequest({
        id: "claim_3",
        institutionId: "seed_inst_ist_kolej_1",
        applicantName: "Ahmet",
        phone: "+90 532 000 00 00",
        email: "not-an-email",
        message: "Merhaba",
        createdAt: "2026-07-14T12:00:00.000Z",
        updatedAt: "2026-07-14T12:00:00.000Z",
      }),
    ).toThrow(/email/);

    expect(() =>
      createClaimRequest({
        id: "claim_4",
        institutionId: "seed_inst_ist_kolej_1",
        applicantName: "Ahmet",
        phone: "+90 532 000 00 00",
        email: "ahmet@example.com",
        message: "Merhaba",
        evidenceUrl: "ftp://files.example/proof.pdf",
        createdAt: "2026-07-14T12:00:00.000Z",
        updatedAt: "2026-07-14T12:00:00.000Z",
      }),
    ).toThrow(/evidenceUrl/);
  });
});
