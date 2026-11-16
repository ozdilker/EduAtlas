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

function isCookieSecure(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export async function readContactUnlockPayload(): Promise<ContactUnlockPayload | null> {
  const secret = getContactUnlockSecret();
  if (!secret) return null;
  const jar = await cookies();
  const raw = jar.get(CONTACT_UNLOCK_COOKIE_NAME)?.value;
  if (!raw?.trim()) return null;
  try {
    return verifyContactUnlockToken(decodeURIComponent(raw), secret);
  } catch {
    return null;
  }
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
  jar.set(CONTACT_UNLOCK_COOKIE_NAME, encodeURIComponent(token), {
    httpOnly: true,
    secure: isCookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(CONTACT_UNLOCK_TTL_MS / 1000),
  });
  return true;
}
