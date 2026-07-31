/**
 * One-time claim invite token (raw token lives only in email URL; store hash).
 */
export type ClaimInviteToken = Readonly<{
  readonly id: string;
  readonly tokenHash: string;
  readonly institutionId: string;
  readonly leadId: string;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly usedAt?: string;
}>;

export type CreateClaimInviteTokenInput = {
  id: string;
  tokenHash: string;
  institutionId: string;
  leadId: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
};

export function createClaimInviteToken(input: CreateClaimInviteTokenInput): ClaimInviteToken {
  const id = input.id.trim();
  const tokenHash = input.tokenHash.trim().toLowerCase();
  const institutionId = input.institutionId.trim();
  const leadId = input.leadId.trim();

  if (!id) throw new Error("ClaimInviteToken.id is required.");
  if (!tokenHash) throw new Error("ClaimInviteToken.tokenHash is required.");
  if (!institutionId) throw new Error("ClaimInviteToken.institutionId is required.");
  if (!leadId) throw new Error("ClaimInviteToken.leadId is required.");
  assertIso(input.createdAt, "createdAt");
  assertIso(input.expiresAt, "expiresAt");
  if (input.usedAt !== undefined) assertIso(input.usedAt, "usedAt");

  return Object.freeze({
    id,
    tokenHash,
    institutionId,
    leadId,
    expiresAt: input.expiresAt,
    createdAt: input.createdAt,
    ...(input.usedAt ? { usedAt: input.usedAt } : {}),
  });
}

export function isClaimInviteTokenExpired(token: ClaimInviteToken, nowIso: string): boolean {
  return Date.parse(token.expiresAt) <= Date.parse(nowIso);
}

export function isClaimInviteTokenUsed(token: ClaimInviteToken): boolean {
  return Boolean(token.usedAt);
}

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`ClaimInviteToken.${field} must be a valid ISO timestamp.`);
  }
}
