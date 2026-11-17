import { describe, expect, it } from "vitest";
import {
  CONTACT_UNLOCK_TTL_MS,
  createContactUnlockPayload,
  isInstitutionContactUnlocked,
  signContactUnlockToken,
  upsertInstitutionContactGrant,
  verifyContactUnlockToken,
} from "./contact-unlock-token";

const SECRET = "test-contact-unlock-secret-32chars!!";

describe("contact unlock token", () => {
  it("rejects unlock when cookie/token is missing (caller passes null)", () => {
    expect(isInstitutionContactUnlocked(createContactUnlockPayload({}), "inst_a")).toBe(
      false,
    );
  });

  it("unlocks only the granted institution after a successful grant", () => {
    const payload = upsertInstitutionContactGrant(null, "inst_a", {
      nowMs: 1_000_000,
      ttlMs: CONTACT_UNLOCK_TTL_MS,
    });
    const token = signContactUnlockToken(payload, SECRET);
    const verified = verifyContactUnlockToken(token, SECRET);

    expect(isInstitutionContactUnlocked(verified, "inst_a", 1_000_000 + 1000)).toBe(true);
    expect(isInstitutionContactUnlocked(verified, "inst_b", 1_000_000 + 1000)).toBe(false);
  });

  it("rejects expired grants", () => {
    const payload = upsertInstitutionContactGrant(null, "inst_a", {
      nowMs: 1_000_000,
      ttlMs: 5_000,
    });
    expect(isInstitutionContactUnlocked(payload, "inst_a", 1_000_000 + 4_999)).toBe(true);
    expect(isInstitutionContactUnlocked(payload, "inst_a", 1_000_000 + 5_001)).toBe(false);
  });

  it("rejects tampered or unsigned tokens", () => {
    const payload = upsertInstitutionContactGrant(null, "inst_a");
    const token = signContactUnlockToken(payload, SECRET);
    const tampered = `${token.slice(0, -4)}aaaa`;

    expect(() => verifyContactUnlockToken(tampered, SECRET)).toThrow(/signature/i);
    expect(() => verifyContactUnlockToken(token.split(".")[0] ?? "", SECRET)).toThrow(
      /Malformed/i,
    );
    expect(() => verifyContactUnlockToken("not-a-token", SECRET)).toThrow(/Malformed/i);
  });

  it("rejects tokens signed with a different secret", () => {
    const payload = upsertInstitutionContactGrant(null, "inst_a");
    const token = signContactUnlockToken(payload, SECRET);
    expect(() =>
      verifyContactUnlockToken(token, "other-contact-unlock-secret-32ch!!"),
    ).toThrow(/signature/i);
  });
});
