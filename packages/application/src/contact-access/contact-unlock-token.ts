import { createHmac, timingSafeEqual } from "node:crypto";

/** Default grant lifetime: 30 days. */
export const CONTACT_UNLOCK_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type ContactUnlockGrantMap = Readonly<Record<string, number>>;

export type ContactUnlockPayload = Readonly<{
  readonly v: 1;
  readonly g: ContactUnlockGrantMap;
}>;

export class ContactUnlockTokenError extends Error {
  override readonly name = "ContactUnlockTokenError";
}

function base64UrlEncode(value: string | Buffer): string {
  const buf = typeof value === "string" ? Buffer.from(value, "utf8") : value;
  return buf.toString("base64url");
}

function base64UrlDecodeToString(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createContactUnlockPayload(
  grants: ContactUnlockGrantMap,
): ContactUnlockPayload {
  return Object.freeze({ v: 1 as const, g: Object.freeze({ ...grants }) });
}

/**
 * Creates a signed unlock token for one or more institution grants.
 * `secret` must be a server-only high-entropy value (never expose to client).
 */
export function signContactUnlockToken(
  payload: ContactUnlockPayload,
  secret: string,
): string {
  const trimmedSecret = secret.trim();
  if (trimmedSecret.length < 32) {
    throw new ContactUnlockTokenError("Contact unlock secret is too short.");
  }
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = signPayload(payloadB64, trimmedSecret);
  return `${payloadB64}.${sig}`;
}

/**
 * Verifies signature and returns payload. Does not enforce expiry by itself.
 */
export function verifyContactUnlockToken(
  token: string,
  secret: string,
): ContactUnlockPayload {
  const trimmedSecret = secret.trim();
  if (trimmedSecret.length < 32) {
    throw new ContactUnlockTokenError("Contact unlock secret is too short.");
  }
  const trimmed = token.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0 || dot === trimmed.length - 1) {
    throw new ContactUnlockTokenError("Malformed contact unlock token.");
  }
  const payloadB64 = trimmed.slice(0, dot);
  const sig = trimmed.slice(dot + 1);
  const expected = signPayload(payloadB64, trimmedSecret);
  if (!safeEqual(sig, expected)) {
    throw new ContactUnlockTokenError("Invalid contact unlock signature.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlDecodeToString(payloadB64));
  } catch {
    throw new ContactUnlockTokenError("Invalid contact unlock payload.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as { v?: unknown }).v !== 1 ||
    typeof (parsed as { g?: unknown }).g !== "object" ||
    (parsed as { g?: unknown }).g === null
  ) {
    throw new ContactUnlockTokenError("Unsupported contact unlock payload.");
  }

  const grants: Record<string, number> = {};
  for (const [institutionId, exp] of Object.entries(
    (parsed as { g: Record<string, unknown> }).g,
  )) {
    const id = institutionId.trim();
    if (!id || typeof exp !== "number" || !Number.isFinite(exp)) continue;
    grants[id] = exp;
  }

  return createContactUnlockPayload(grants);
}

export function isInstitutionContactUnlocked(
  payload: ContactUnlockPayload,
  institutionId: string,
  nowMs: number = Date.now(),
): boolean {
  const id = institutionId.trim();
  if (!id) return false;
  const exp = payload.g[id];
  if (typeof exp !== "number" || !Number.isFinite(exp)) return false;
  return exp > nowMs;
}

export function upsertInstitutionContactGrant(
  existing: ContactUnlockPayload | null,
  institutionId: string,
  options?: { readonly nowMs?: number; readonly ttlMs?: number },
): ContactUnlockPayload {
  const id = institutionId.trim();
  if (!id) {
    throw new ContactUnlockTokenError("institutionId is required.");
  }
  const nowMs = options?.nowMs ?? Date.now();
  const ttlMs = options?.ttlMs ?? CONTACT_UNLOCK_TTL_MS;
  const next: Record<string, number> = { ...(existing?.g ?? {}) };
  // Drop expired grants to keep cookie small.
  for (const [key, exp] of Object.entries(next)) {
    if (exp <= nowMs) delete next[key];
  }
  next[id] = nowMs + ttlMs;
  return createContactUnlockPayload(next);
}
