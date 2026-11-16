import { createInstitutionContact } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { createInstitutionPrivateContact } from "./institution-private-contact";
import {
  publicContactChannels,
  resolveInstitutionContactSource,
} from "./resolve-institution-contact";
import {
  isInstitutionContactUnlocked,
  signContactUnlockToken,
  upsertInstitutionContactGrant,
  verifyContactUnlockToken,
} from "./contact-unlock-token";

const SECRET = "legacy-fallback-secret-32-characters";

describe("institution contact source", () => {
  const legacy = createInstitutionContact({
    phone: "+90 216 111 22 33",
    email: "legacy@okul.test",
    whatsappNumber: "+90 532 111 22 33",
  });

  it("uses the private store when a record exists", () => {
    const resolved = resolveInstitutionContactSource(
      legacy,
      createInstitutionPrivateContact({
        institutionId: "inst_a",
        phone: "+90 216 999 88 77",
        email: "private@okul.test",
        updatedAt: "2026-11-16T00:00:00.000Z",
      }),
    );
    expect(resolved.phone).toBe("+90 216 999 88 77");
    expect(resolved.email).toBe("private@okul.test");
    expect(resolved.whatsappNumber).toBeUndefined();
  });

  it("uses legacy fields only when the private record is absent", () => {
    const resolved = resolveInstitutionContactSource(legacy, null);
    expect(resolved.phone).toBe("+90 216 111 22 33");
    expect(resolved.email).toBe("legacy@okul.test");
  });

  it("exposes legacy contact only for a valid unlock of that institution", () => {
    const now = 5_000_000;
    const token = signContactUnlockToken(
      upsertInstitutionContactGrant(null, "inst_a", { nowMs: now }),
      SECRET,
    );
    const payload = verifyContactUnlockToken(token, SECRET);
    const legacyOnly = resolveInstitutionContactSource(legacy, null);

    const unlocked = publicContactChannels({
      unlocked: isInstitutionContactUnlocked(payload, "inst_a", now + 1),
      contact: legacyOnly,
    });
    const otherInstitution = publicContactChannels({
      unlocked: isInstitutionContactUnlocked(payload, "inst_b", now + 1),
      contact: legacyOnly,
    });

    expect(unlocked.phone).toBe("+90 216 111 22 33");
    expect(otherInstitution.phone).toBeUndefined();
    expect(JSON.stringify(otherInstitution)).not.toContain("216");
  });

  it("does not expose legacy contact for a missing or invalid token", () => {
    const legacyOnly = resolveInstitutionContactSource(legacy, null);
    expect(
      publicContactChannels({ unlocked: false, contact: legacyOnly }).phone,
    ).toBeUndefined();

    const token = signContactUnlockToken(upsertInstitutionContactGrant(null, "inst_a"), SECRET);
    expect(() => verifyContactUnlockToken(`${token}x`, SECRET)).toThrow(/signature|Malformed/i);
    expect(
      publicContactChannels({ unlocked: false, contact: legacyOnly }).email,
    ).toBeUndefined();
  });
});
