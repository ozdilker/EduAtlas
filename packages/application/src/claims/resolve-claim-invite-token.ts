import {
  createInstitutionId,
  type Institution,
  isClaimInviteTokenExpired,
  isClaimInviteTokenUsed,
} from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { ClaimInviteTokenRepository } from "../claims/claim-invite-token-repository";
import { hashClaimInviteToken } from "../notifications/send-institution-claim-invite-email";

export type ResolveClaimInviteTokenResult =
  | Readonly<{
      readonly ok: true;
      readonly tokenId: string;
      readonly institution: Institution;
      readonly leadId: string;
    }>
  | Readonly<{
      readonly ok: false;
      readonly reason: "missing" | "invalid" | "expired" | "used" | "institution_missing";
    }>;

/**
 * Resolves a raw claim invite token for the /claim landing page.
 */
export async function resolveClaimInviteToken(
  rawToken: string,
  deps: {
    claimInviteTokenRepository: ClaimInviteTokenRepository;
    institutionRepository: InstitutionRepository;
    now?: string;
  },
): Promise<ResolveClaimInviteTokenResult> {
  const raw = rawToken.trim();
  if (!raw) {
    return Object.freeze({ ok: false, reason: "missing" });
  }

  const token = await deps.claimInviteTokenRepository.getByTokenHash(hashClaimInviteToken(raw));
  if (!token) {
    return Object.freeze({ ok: false, reason: "invalid" });
  }

  const now = deps.now ?? new Date().toISOString();
  if (isClaimInviteTokenUsed(token)) {
    return Object.freeze({ ok: false, reason: "used" });
  }
  if (isClaimInviteTokenExpired(token, now)) {
    return Object.freeze({ ok: false, reason: "expired" });
  }

  const institution = await deps.institutionRepository.getById(
    createInstitutionId(token.institutionId),
  );
  if (!institution) {
    return Object.freeze({ ok: false, reason: "institution_missing" });
  }

  return Object.freeze({
    ok: true,
    tokenId: token.id,
    institution,
    leadId: token.leadId,
  });
}
