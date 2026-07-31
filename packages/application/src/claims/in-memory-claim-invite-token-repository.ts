import type { ClaimInviteToken } from "@eduatlas/domain";
import type { ClaimInviteTokenRepository } from "./claim-invite-token-repository";

/**
 * In-memory ClaimInviteTokenRepository for tests / local fallback.
 */
export class InMemoryClaimInviteTokenRepository implements ClaimInviteTokenRepository {
  private readonly byId = new Map<string, ClaimInviteToken>();
  private readonly byHash = new Map<string, string>();

  async save(token: ClaimInviteToken): Promise<ClaimInviteToken> {
    this.byId.set(token.id, token);
    this.byHash.set(token.tokenHash, token.id);
    return token;
  }

  async getByTokenHash(tokenHash: string): Promise<ClaimInviteToken | null> {
    const id = this.byHash.get(tokenHash.trim().toLowerCase());
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }

  async getById(id: string): Promise<ClaimInviteToken | null> {
    return this.byId.get(id.trim()) ?? null;
  }

  async markUsed(id: string, usedAt: string): Promise<ClaimInviteToken> {
    const existing = this.byId.get(id.trim());
    if (!existing) {
      throw new Error(`CLAIM_INVITE_TOKEN_NOT_FOUND:${id}`);
    }
    const updated = Object.freeze({ ...existing, usedAt });
    this.byId.set(existing.id, updated);
    return updated;
  }
}

export function createInMemoryClaimInviteTokenRepository(): InMemoryClaimInviteTokenRepository {
  return new InMemoryClaimInviteTokenRepository();
}
