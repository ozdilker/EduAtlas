import type { ClaimInviteToken } from "@eduatlas/domain";

/**
 * Persistence port for claim invite tokens (hashed at rest).
 */
export interface ClaimInviteTokenRepository {
  save(token: ClaimInviteToken): Promise<ClaimInviteToken>;
  getByTokenHash(tokenHash: string): Promise<ClaimInviteToken | null>;
  getById(id: string): Promise<ClaimInviteToken | null>;
  markUsed(id: string, usedAt: string): Promise<ClaimInviteToken>;
}
