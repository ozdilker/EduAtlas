import { describe, expect, it } from "vitest";
import {
  CONTACT_UNLOCK_TTL_MS,
  isInstitutionContactUnlocked,
  signContactUnlockToken,
  upsertInstitutionContactGrant,
  verifyContactUnlockToken,
} from "./contact-unlock-token";

const SECRET = "flow-contact-unlock-secret-32chars!";

/**
 * End-to-end grant scenarios for Bilgi Al → contact unlock (no Firestore I/O).
 */
describe("contact unlock flow scenarios", () => {
  it("1) failed lead path leaves contact locked (no grant issued)", () => {
    // Caller must not call upsert/sign on failure — simulate absent cookie.
    expect(isInstitutionContactUnlocked({ v: 1, g: {} }, "inst_a")).toBe(false);
  });

  it("2) successful lead grant unlocks that institution", () => {
    const now = 2_000_000;
    const payload = upsertInstitutionContactGrant(null, "inst_a", {
      nowMs: now,
      ttlMs: CONTACT_UNLOCK_TTL_MS,
    });
    const token = signContactUnlockToken(payload, SECRET);
    const verified = verifyContactUnlockToken(token, SECRET);
    expect(isInstitutionContactUnlocked(verified, "inst_a", now + 10)).toBe(true);
  });

  it("3) institution A grant does not unlock institution B", () => {
    const payload = upsertInstitutionContactGrant(null, "inst_a");
    expect(isInstitutionContactUnlocked(payload, "inst_b")).toBe(false);
  });

  it("4) expired token keeps contact locked", () => {
    const now = 3_000_000;
    const payload = upsertInstitutionContactGrant(null, "inst_a", {
      nowMs: now,
      ttlMs: 1_000,
    });
    expect(isInstitutionContactUnlocked(payload, "inst_a", now + 1_001)).toBe(false);
  });

  it("5) tampered token is rejected", () => {
    const payload = upsertInstitutionContactGrant(null, "inst_a");
    const token = signContactUnlockToken(payload, SECRET);
    expect(() => verifyContactUnlockToken(`${token}x`, SECRET)).toThrow(/signature|Malformed/i);
  });

  it("6) missing cookie/token keeps contact locked", () => {
    expect(isInstitutionContactUnlocked({ v: 1, g: {} }, "inst_a")).toBe(false);
  });
});
