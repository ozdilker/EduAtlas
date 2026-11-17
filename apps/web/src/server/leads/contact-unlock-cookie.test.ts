import {
  signContactUnlockToken,
  upsertInstitutionContactGrant,
  isInstitutionContactUnlocked,
} from "@eduatlas/application";
import { RequestCookies, ResponseCookies } from "next/dist/server/web/spec-extension/cookies";
import { describe, expect, it } from "vitest";
import {
  CONTACT_UNLOCK_COOKIE_NAME,
  contactUnlockCookieOptions,
  verifyStoredContactUnlockToken,
} from "./contact-unlock-cookie";

const SECRET = "preview-fixture-test-secret-32chars";
const FIRST_ID = "inst_preview_contact_unlock";
const SECOND_ID = "inst_preview_contact_locked";
const NOW_MS = 1_700_000_000_000;

function setCookieHeader(token: string): string {
  const headers = new Headers();
  const jar = new ResponseCookies(headers);
  jar.set(CONTACT_UNLOCK_COOKIE_NAME, token, contactUnlockCookieOptions(true));
  const header = headers.get("set-cookie");
  if (!header) throw new Error("Set-Cookie was not written.");
  return header;
}

function payloadFromBrowserRoundTrip(setCookie: string) {
  const pair = setCookie.split(";")[0] ?? "";
  const request = new RequestCookies(new Headers({ cookie: pair }));
  const raw = request.get(CONTACT_UNLOCK_COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifyStoredContactUnlockToken(raw, SECRET);
}

describe("contact unlock cookie round trip", () => {
  it("keeps the first institution unlocked on the next request and leaves the second locked", () => {
    const token = signContactUnlockToken(
      upsertInstitutionContactGrant(null, FIRST_ID, { nowMs: NOW_MS, ttlMs: 60_000 }),
      SECRET,
    );
    const header = setCookieHeader(token);

    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=lax");
    expect(header).toContain("Path=/");
    expect(header).toContain("Max-Age=");
    expect(header).not.toContain("Domain=");

    const payload = payloadFromBrowserRoundTrip(header);
    expect(payload).not.toBeNull();
    expect(isInstitutionContactUnlocked(payload!, FIRST_ID, NOW_MS + 1)).toBe(true);
    expect(isInstitutionContactUnlocked(payload!, SECOND_ID, NOW_MS + 1)).toBe(false);
  });

  it("locks both institutions when the cookie is missing", () => {
    expect(verifyStoredContactUnlockToken("", SECRET)).toBeNull();
    expect(verifyStoredContactUnlockToken("   ", SECRET)).toBeNull();
  });

  it("rejects an expired grant and a tampered signature", () => {
    const token = signContactUnlockToken(
      upsertInstitutionContactGrant(null, FIRST_ID, { nowMs: NOW_MS, ttlMs: 1_000 }),
      SECRET,
    );
    const payload = verifyStoredContactUnlockToken(token, SECRET);
    expect(payload).not.toBeNull();
    expect(isInstitutionContactUnlocked(payload!, FIRST_ID, NOW_MS + 1_001)).toBe(false);

    const header = setCookieHeader(`${token}x`);
    expect(payloadFromBrowserRoundTrip(header)).toBeNull();
  });
});
