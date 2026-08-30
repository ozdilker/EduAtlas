import {
  buildExternalInstitutionId,
  CampaignRecipientStatus,
  createCampaignRecipient,
  createInstitutionId,
  institutionIdAsString,
  isExternalInstitutionId,
  type CampaignRecipient,
  type CampaignRecipientInstitutionMatch,
} from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import { OutreachValidationError } from "./errors";

/** Hard caps — outreach matching must never approach catalog size. */
export const OUTREACH_MATCH_EMAIL_LIMIT = 5;
export const OUTREACH_MATCH_NAME_LIMIT = 10;
/** Max docs readable per recipient (email query + name query). */
export const OUTREACH_MATCH_MAX_DOCS_PER_RECIPIENT =
  OUTREACH_MATCH_EMAIL_LIMIT + OUTREACH_MATCH_NAME_LIMIT;

export type OutreachMatchScope = Readonly<{
  readonly cityId?: string;
  readonly districtId?: string;
}>;

export type OutreachInstitutionMatchResult = Readonly<{
  readonly institutionId: string;
  readonly institutionMatch: CampaignRecipientInstitutionMatch;
  readonly matchCandidateIds?: readonly string[];
  readonly matchedName?: string;
  /** Documents read for this row (for cost assertions). */
  readonly documentsRead: number;
}>;

export function normalizeOutreachInstitutionName(name: string): string {
  return name.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

export function isClaimSafeInstitutionMatch(
  match: CampaignRecipientInstitutionMatch | undefined,
): boolean {
  return match === "matched";
}

/**
 * Bounded catalog match: contactEmail equality, then exact name equality.
 * Never calls institutionRepository.list() / catalog scan.
 */
export async function resolveBoundedOutreachInstitutionMatch(
  row: { institutionName: string; email: string },
  institutionRepository: InstitutionRepository,
  scope?: OutreachMatchScope,
): Promise<OutreachInstitutionMatchResult> {
  const externalId = buildExternalInstitutionId(row.email);
  let documentsRead = 0;

  const findByEmail = institutionRepository.findByContactEmail?.bind(institutionRepository);
  const findByName = institutionRepository.findByExactName?.bind(institutionRepository);

  if (!findByEmail && !findByName) {
    return Object.freeze({
      institutionId: externalId,
      institutionMatch: "unmatched" as const,
      documentsRead: 0,
    });
  }

  if (findByEmail) {
    const byEmail = await findByEmail(row.email, { limit: OUTREACH_MATCH_EMAIL_LIMIT });
    documentsRead += byEmail.length;
    if (byEmail.length === 1 && byEmail[0]) {
      return Object.freeze({
        institutionId: institutionIdAsString(byEmail[0].id),
        institutionMatch: "matched" as const,
        matchedName: byEmail[0].name,
        documentsRead,
      });
    }
    if (byEmail.length > 1) {
      return Object.freeze({
        institutionId: externalId,
        institutionMatch: "ambiguous" as const,
        matchCandidateIds: Object.freeze(
          byEmail.map((inst) => institutionIdAsString(inst.id)),
        ),
        documentsRead,
      });
    }
  }

  const name = row.institutionName.trim();
  if (!name || !findByName) {
    return Object.freeze({
      institutionId: externalId,
      institutionMatch: "unmatched" as const,
      documentsRead,
    });
  }

  const byName = await findByName(name, {
    limit: OUTREACH_MATCH_NAME_LIMIT,
    ...(scope?.cityId ? { cityId: scope.cityId } : {}),
    ...(scope?.districtId ? { districtId: scope.districtId } : {}),
  });
  documentsRead += byName.length;

  const nameNeedle = normalizeOutreachInstitutionName(name);
  const exact = byName.filter(
    (inst) => normalizeOutreachInstitutionName(inst.name) === nameNeedle,
  );

  if (exact.length === 1 && exact[0]) {
    return Object.freeze({
      institutionId: institutionIdAsString(exact[0].id),
      institutionMatch: "matched" as const,
      matchedName: exact[0].name,
      documentsRead,
    });
  }
  if (exact.length > 1) {
    return Object.freeze({
      institutionId: externalId,
      institutionMatch: "ambiguous" as const,
      matchCandidateIds: Object.freeze(exact.map((inst) => institutionIdAsString(inst.id))),
      documentsRead,
    });
  }

  return Object.freeze({
    institutionId: externalId,
    institutionMatch: "unmatched" as const,
    documentsRead,
  });
}

export type MatchCampaignRecipientsResult = Readonly<{
  readonly matchedCount: number;
  readonly unmatchedCount: number;
  readonly ambiguousCount: number;
  readonly updatedCount: number;
  readonly documentsRead: number;
}>;

/**
 * Re-runs bounded matching for Pending external/manual recipients that are not yet matched.
 */
export async function matchCampaignRecipients(
  input: {
    campaignId: string;
    now: string;
    scope?: OutreachMatchScope;
  },
  deps: {
    recipientRepository: CampaignRecipientRepository;
    institutionRepository: InstitutionRepository;
  },
): Promise<MatchCampaignRecipientsResult> {
  const campaignId = input.campaignId.trim();
  const rows = await deps.recipientRepository.listByCampaignId(campaignId);
  let matchedCount = 0;
  let unmatchedCount = 0;
  let ambiguousCount = 0;
  let updatedCount = 0;
  let documentsRead = 0;

  for (const recipient of rows) {
    if (recipient.status !== CampaignRecipientStatus.Pending) {
      if (recipient.institutionMatch === "matched") matchedCount += 1;
      else if (recipient.institutionMatch === "ambiguous") ambiguousCount += 1;
      else if (
        recipient.institutionMatch === "unmatched" ||
        isExternalInstitutionId(recipient.institutionId)
      ) {
        unmatchedCount += 1;
      }
      continue;
    }
    if (
      recipient.institutionMatch === "matched" &&
      !isExternalInstitutionId(recipient.institutionId)
    ) {
      matchedCount += 1;
      continue;
    }

    const result = await resolveBoundedOutreachInstitutionMatch(
      {
        institutionName: recipient.displayName ?? "",
        email: recipient.email,
      },
      deps.institutionRepository,
      input.scope,
    );
    documentsRead += result.documentsRead;

    const next = createCampaignRecipient({
      ...recipient,
      institutionId: result.institutionId,
      institutionMatch: result.institutionMatch,
      ...(result.matchCandidateIds
        ? { matchCandidateIds: result.matchCandidateIds }
        : { matchCandidateIds: undefined }),
      updatedAt: input.now,
    });
    // Clear candidates when matched/unmatched — recreate without field
    const cleaned = createCampaignRecipient({
      id: next.id,
      campaignId: next.campaignId,
      institutionId: next.institutionId,
      displayName: next.displayName,
      institutionMatch: next.institutionMatch,
      ...(result.institutionMatch === "ambiguous" && result.matchCandidateIds
        ? { matchCandidateIds: result.matchCandidateIds }
        : {}),
      source: next.source,
      email: next.email,
      status: next.status,
      sentAt: next.sentAt,
      openedAt: next.openedAt,
      clickedAt: next.clickedAt,
      claimedAt: next.claimedAt,
      lastError: next.lastError,
      createdAt: next.createdAt,
      updatedAt: input.now,
    });
    await deps.recipientRepository.update(cleaned);
    updatedCount += 1;

    if (result.institutionMatch === "matched") matchedCount += 1;
    else if (result.institutionMatch === "ambiguous") ambiguousCount += 1;
    else unmatchedCount += 1;
  }

  return Object.freeze({
    matchedCount,
    unmatchedCount,
    ambiguousCount,
    updatedCount,
    documentsRead,
  });
}

/**
 * Admin picks a concrete institution for a recipient (manual match).
 */
export async function assignRecipientInstitution(
  input: {
    campaignId: string;
    recipientId: string;
    institutionId: string;
    now: string;
  },
  deps: {
    recipientRepository: CampaignRecipientRepository;
    institutionRepository: InstitutionRepository;
  },
): Promise<CampaignRecipient> {
  const campaignId = input.campaignId.trim();
  const recipientId = input.recipientId.trim();
  const institutionId = input.institutionId.trim();
  if (!campaignId || !recipientId || !institutionId) {
    throw new OutreachValidationError("Kampanya, alıcı ve kurum gerekli.");
  }

  let recipient = await deps.recipientRepository.getById(recipientId);
  // Fallback: list projection / doc-path mismatches should not block admin match.
  if (!recipient || recipient.campaignId !== campaignId) {
    const rows = await deps.recipientRepository.listByCampaignId(campaignId);
    const fromCampaign = rows.find((row) => row.id === recipientId) ?? null;
    if (fromCampaign) {
      recipient = fromCampaign;
    }
  }

  if (!recipient) {
    throw new OutreachValidationError(
      `Recipient not found for this campaign (${recipientId}).`,
    );
  }
  if (recipient.campaignId !== campaignId) {
    throw new OutreachValidationError(
      `Recipient ${recipientId} belongs to another campaign.`,
    );
  }
  if (recipient.status !== CampaignRecipientStatus.Pending) {
    throw new OutreachValidationError("Only pending recipients can be rematched.");
  }

  const inst = await deps.institutionRepository.getById(createInstitutionId(institutionId));
  if (!inst) {
    throw new OutreachValidationError("Institution not found.");
  }

  const updated = createCampaignRecipient({
    id: recipient.id,
    campaignId: recipient.campaignId,
    institutionId: institutionIdAsString(inst.id),
    displayName: recipient.displayName?.trim() || inst.name,
    institutionMatch: "matched",
    source: recipient.source,
    email: recipient.email,
    status: recipient.status,
    sentAt: recipient.sentAt,
    openedAt: recipient.openedAt,
    clickedAt: recipient.clickedAt,
    claimedAt: recipient.claimedAt,
    lastError: recipient.lastError,
    createdAt: recipient.createdAt,
    updatedAt: input.now,
  });
  return deps.recipientRepository.update(updated);
}

export type ManualRecipientInput = Readonly<{
  campaignId: string;
  email: string;
  displayName?: string;
  institutionId?: string;
  now: string;
}>;

/**
 * Adds a single Pending manual recipient (no DeliveryJob).
 */
export async function addManualCampaignRecipient(
  input: ManualRecipientInput,
  deps: {
    recipientRepository: CampaignRecipientRepository;
    institutionRepository?: InstitutionRepository | null;
    nextRecipientId?: () => string;
  },
): Promise<CampaignRecipient> {
  const campaignId = input.campaignId.trim();
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@") || email.includes(" ")) {
    throw new OutreachValidationError("Geçerli bir e-posta adresi girin.");
  }

  const existing = await deps.recipientRepository.listByCampaignId(campaignId);
  if (existing.some((r) => r.email === email)) {
    throw new OutreachValidationError("Bu e-posta kampanyada zaten var.");
  }

  let institutionId = buildExternalInstitutionId(email);
  let institutionMatch: CampaignRecipientInstitutionMatch = "unmatched";
  let displayName = input.displayName?.trim();

  const explicitId = input.institutionId?.trim();
  if (explicitId) {
    if (!deps.institutionRepository) {
      throw new OutreachValidationError("Institution repository is not configured.");
    }
    const inst = await deps.institutionRepository.getById(createInstitutionId(explicitId));
    if (!inst) {
      throw new OutreachValidationError("Seçilen EduAtlas kurumu bulunamadı.");
    }
    institutionId = institutionIdAsString(inst.id);
    institutionMatch = "matched";
    displayName = displayName || inst.name;
  }

  const id =
    deps.nextRecipientId?.() ??
    `crec_manual_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const recipient = createCampaignRecipient({
    id,
    campaignId,
    institutionId,
    ...(displayName ? { displayName } : {}),
    institutionMatch,
    source: "manual",
    email,
    status: CampaignRecipientStatus.Pending,
    createdAt: input.now,
    updatedAt: input.now,
  });
  return deps.recipientRepository.save(recipient);
}

/** Label helper for admin UI / summary. */
export function summarizeRecipientMatches(
  recipients: readonly CampaignRecipient[],
): {
  importedCount: number;
  matchedCount: number;
  unmatchedCount: number;
  ambiguousCount: number;
  preparedCount: number;
} {
  let matchedCount = 0;
  let unmatchedCount = 0;
  let ambiguousCount = 0;
  let preparedCount = 0;
  for (const r of recipients) {
    if (r.status !== CampaignRecipientStatus.Pending) preparedCount += 1;
    if (r.institutionMatch === "matched") matchedCount += 1;
    else if (r.institutionMatch === "ambiguous") ambiguousCount += 1;
    else unmatchedCount += 1;
  }
  return Object.freeze({
    importedCount: recipients.length,
    matchedCount,
    unmatchedCount,
    ambiguousCount,
    preparedCount,
  });
}
