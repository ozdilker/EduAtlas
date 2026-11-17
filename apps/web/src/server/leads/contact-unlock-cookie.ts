import {
  CONTACT_UNLOCK_TTL_MS,
  type ContactUnlockPayload,
  isInstitutionContactUnlocked,
  signContactUnlockToken,
  upsertInstitutionContactGrant,
  verifyContactUnlockToken,
} from "@eduatlas/application";
import { cookies } from "next/headers";

export const CONTACT_UNLOCK_COOKIE_NAME = "ea_contact_unlock";

/**
 * Server-only HMAC secret for anonymous contact unlock cookies.
 * Set `CONTACT_UNLOCK_SECRET` (≥32 chars) in apps/web/.env.local and hosting envs.
 */
export function getContactUnlockSecret(): string | null {
  const secret = process.env.CONTACT_UNLOCK_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return secret;
}

export function isContactUnlockCookieSecure(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export function contactUnlockCookieOptions(secure = isContactUnlockCookieSecure()) {
  return {
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(CONTACT_UNLOCK_TTL_MS / 1000),
  };
}

/**
 * Next.js serializes cookie values with encodeURIComponent.
 * Accept the stored token as-is, and a single extra decode for older cookies.
 */
export function verifyStoredContactUnlockToken(
  raw: string,
  secret: string,
): ContactUnlockPayload | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return verifyContactUnlockToken(trimmed, secret);
  } catch {
    try {
      const decoded = decodeURIComponent(trimmed);
      if (decoded === trimmed) return null;
      return verifyContactUnlockToken(decoded, secret);
    } catch {
      return null;
    }
  }
}

export async function readContactUnlockPayload(): Promise<ContactUnlockPayload | null> {
  const secret = getContactUnlockSecret();
  if (!secret) return null;
  const jar = await cookies();
  const raw = jar.get(CONTACT_UNLOCK_COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifyStoredContactUnlockToken(raw, secret);
}

export async function hasInstitutionContactUnlock(institutionId: string): Promise<boolean> {
  const payload = await readContactUnlockPayload();
  if (!payload) return false;
  return isInstitutionContactUnlocked(payload, institutionId);
}

/**
 * After a successful lead save, grants contact unlock for that institution only.
 * No-op when secret is missing (fail-closed: lead still succeeds, phone stays locked).
 */
export async function grantInstitutionContactUnlock(institutionId: string): Promise<boolean> {
  const secret = getContactUnlockSecret();
  if (!secret) return false;

  const existing = await readContactUnlockPayload();
  const next = upsertInstitutionContactGrant(existing, institutionId, {
    ttlMs: CONTACT_UNLOCK_TTL_MS,
  });
  const token = signContactUnlockToken(next, secret);
  const jar = await cookies();
  jar.set(CONTACT_UNLOCK_COOKIE_NAME, token, contactUnlockCookieOptions());
  return true;
}
