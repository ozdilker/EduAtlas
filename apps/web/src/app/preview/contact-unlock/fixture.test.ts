import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ContactUnlockTokenError,
  isInstitutionContactUnlocked,
  signContactUnlockToken,
  upsertInstitutionContactGrant,
  verifyContactUnlockToken,
} from "@eduatlas/application";
import { describe, expect, it } from "vitest";
import { previewFixtureContact } from "./fixture-channels";
import {
  isPreviewContactUnlockFixtureEnabled,
  PREVIEW_LOCKED_INSTITUTION,
  PREVIEW_UNLOCK_INSTITUTION,
  shouldGrantPreviewContactUnlock,
} from "./fixture-data";

const TEST_SECRET = "preview-fixture-test-secret-32chars";
const dir = path.dirname(fileURLToPath(import.meta.url));

function readWorkspace(relativePath: string): string {
  return readFileSync(path.resolve(dir, relativePath), "utf8");
}

describe("preview contact unlock fixture", () => {
  it("allows the page only when VERCEL_ENV is preview", () => {
    expect(isPreviewContactUnlockFixtureEnabled({ VERCEL_ENV: "preview" })).toBe(true);
    expect(isPreviewContactUnlockFixtureEnabled({ VERCEL_ENV: "production" })).toBe(false);
    expect(isPreviewContactUnlockFixtureEnabled({ VERCEL_ENV: "development" })).toBe(false);
    expect(isPreviewContactUnlockFixtureEnabled({})).toBe(false);
  });

  it("hides phone, WhatsApp, and email until that institution is unlocked", () => {
    const hidden = previewFixtureContact(PREVIEW_UNLOCK_INSTITUTION, false);
    expect(hidden.phone).toBeUndefined();
    expect(hidden.whatsappNumber).toBeUndefined();
    expect(hidden.email).toBeUndefined();

    const visible = previewFixtureContact(PREVIEW_UNLOCK_INSTITUTION, true);
    expect(visible.phone).toBe(PREVIEW_UNLOCK_INSTITUTION.phone);
    expect(visible.whatsappNumber).toBe(PREVIEW_UNLOCK_INSTITUTION.whatsapp);
    expect(visible.email).toBe(PREVIEW_UNLOCK_INSTITUTION.email);
  });

  it("does not open the second institution with the first institution grant", () => {
    const nowMs = 1_700_000_000_000;
    const payload = upsertInstitutionContactGrant(null, PREVIEW_UNLOCK_INSTITUTION.id, {
      nowMs,
      ttlMs: 60_000,
    });
    const token = signContactUnlockToken(payload, TEST_SECRET);
    const verified = verifyContactUnlockToken(token, TEST_SECRET);

    expect(isInstitutionContactUnlocked(verified, PREVIEW_UNLOCK_INSTITUTION.id, nowMs + 1)).toBe(
      true,
    );
    expect(isInstitutionContactUnlocked(verified, PREVIEW_LOCKED_INSTITUTION.id, nowMs + 1)).toBe(
      false,
    );
    expect(previewFixtureContact(PREVIEW_LOCKED_INSTITUTION, false).phone).toBeUndefined();
  });

  it("keeps contact hidden for an expired or tampered cookie", () => {
    const nowMs = 1_700_000_000_000;
    const payload = upsertInstitutionContactGrant(null, PREVIEW_UNLOCK_INSTITUTION.id, {
      nowMs,
      ttlMs: 1_000,
    });
    const token = signContactUnlockToken(payload, TEST_SECRET);
    const verified = verifyContactUnlockToken(token, TEST_SECRET);

    expect(
      isInstitutionContactUnlocked(verified, PREVIEW_UNLOCK_INSTITUTION.id, nowMs + 1_001),
    ).toBe(false);
    expect(() => verifyContactUnlockToken(`${token}x`, TEST_SECRET)).toThrow(ContactUnlockTokenError);
  });

  it("grants only on the successful fake flow for the first institution", () => {
    expect(shouldGrantPreviewContactUnlock("success", PREVIEW_UNLOCK_INSTITUTION.id)).toBe(true);
    expect(shouldGrantPreviewContactUnlock("failure", PREVIEW_UNLOCK_INSTITUTION.id)).toBe(false);
    expect(shouldGrantPreviewContactUnlock("success", PREVIEW_LOCKED_INSTITUTION.id)).toBe(false);
    expect(shouldGrantPreviewContactUnlock("success", "inst_real_school")).toBe(false);
  });

  it("keeps the fake actions off Firestore and the real lead action", () => {
    const actions = readWorkspace("actions.ts");
    const grantRoute = readWorkspace("grant/route.ts");
    const failureStart = actions.indexOf("export async function previewContactUnlockFailureAction");
    const failure = actions.slice(failureStart);
    expect(failure).not.toContain("grantInstitutionContactUnlock");
    for (const source of [actions, grantRoute]) {
      expect(source).not.toContain("submitLead(");
      expect(source).not.toContain("submitInstitutionLeadAction");
      expect(source).not.toContain("getLeadRepository");
      expect(source).not.toContain("getAdminFirestore");
      expect(source).not.toContain("getNotificationService");
    }
    expect(actions).toContain("notFound()");
    expect(grantRoute).toContain("notFound()");
    expect(grantRoute).toContain("NextResponse.redirect");
    expect(grantRoute).toContain(", 303)");
    expect(grantRoute).toContain("Geçersiz istek gövdesi.");
    expect(grantRoute).toContain("status: 400");
    expect(grantRoute).toContain("grantInstitutionContactUnlock(PREVIEW_UNLOCK_INSTITUTION.id)");
  });

  it("preserves HttpOnly, Secure, and SameSite on the unlock cookie", () => {
    const cookie = readWorkspace("../../../server/leads/contact-unlock-cookie.ts");
    expect(cookie).toContain("httpOnly: true");
    expect(cookie).toContain('sameSite: "lax"');
    expect(cookie).toContain("secure,");
    expect(cookie).toContain('process.env.NODE_ENV === "production" || process.env.VERCEL === "1"');
    expect(cookie).not.toContain("console.");
    expect(cookie).not.toContain("NEXT_PUBLIC_CONTACT_UNLOCK_SECRET");
  });

  it("does not attach the fixture to institution pages or their metadata", () => {
    const institutionPage = readWorkspace("../../institutions/[slug]/page.tsx");
    const fixturePage = readWorkspace("page.tsx");
    expect(institutionPage).not.toContain("preview/contact-unlock");
    expect(institutionPage).not.toContain(PREVIEW_UNLOCK_INSTITUTION.id);
    expect(institutionPage).toContain("includePrivateContact: false");
    expect(fixturePage).toContain('robots: { index: false, follow: false }');
    expect(fixturePage).toContain("notFound()");
    const proxy = readWorkspace("../../../proxy.ts");
    expect(proxy).toContain('pathname === "/preview/contact-unlock"');
    expect(proxy).toContain('process.env.VERCEL_ENV !== "preview"');
    expect(proxy).toContain("status: 404");
    expect(fixturePage).toContain('action="/preview/contact-unlock/grant"');
    expect(fixturePage).not.toContain("submitInstitutionLeadAction");
    expect(fixturePage).not.toContain("previewContactUnlockSuccessAction");
    expect(fixturePage).not.toContain("generateMetadata");
  });
});
