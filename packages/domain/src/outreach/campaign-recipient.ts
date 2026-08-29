import {
  CampaignRecipientStatus,
  parseCampaignRecipientStatus,
  type CampaignRecipientStatus as CampaignRecipientStatusType,
} from "./campaign-recipient-status";

/** Whether the recipient maps to a catalog Institution (claim-safe). */
export type CampaignRecipientInstitutionMatch = "matched" | "unmatched" | "ambiguous";

export type CampaignRecipient = Readonly<{
  readonly id: string;
  readonly campaignId: string;
  readonly institutionId: string;
  /** Optional display name for mail tokens (external import / manual). */
  readonly displayName?: string;
  /**
   * Catalog match for external/manual recipients.
   * matched → real institutionId (claim-safe);
   * unmatched / ambiguous → synthetic ext: id (claim blocked).
   */
  readonly institutionMatch?: CampaignRecipientInstitutionMatch;
  /** Candidate institution ids when institutionMatch is ambiguous (admin picker). */
  readonly matchCandidateIds?: readonly string[];
  /** How this row was added (campaign-level source is also stored on Campaign). */
  readonly source?: "segment" | "external_import" | "manual";
  readonly email: string;
  readonly status: CampaignRecipientStatusType;
  readonly sentAt?: string;
  readonly openedAt?: string;
  readonly clickedAt?: string;
  readonly claimedAt?: string;
  readonly lastError?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}>;

export type CreateCampaignRecipientInput = {
  id: string;
  campaignId: string;
  institutionId: string;
  displayName?: string;
  institutionMatch?: CampaignRecipientInstitutionMatch;
  matchCandidateIds?: readonly string[];
  source?: "segment" | "external_import" | "manual";
  email: string;
  status?: CampaignRecipientStatusType | string;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  claimedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Creates an immutable campaign recipient row for one institution.
 */
export function createCampaignRecipient(input: CreateCampaignRecipientInput): CampaignRecipient {
  const id = input.id.trim();
  const campaignId = input.campaignId.trim();
  const institutionId = input.institutionId.trim();
  const displayName = input.displayName?.trim();
  const email = input.email.trim().toLowerCase();
  const lastError = input.lastError?.trim();
  const institutionMatch = input.institutionMatch;
  if (
    institutionMatch !== undefined &&
    institutionMatch !== "matched" &&
    institutionMatch !== "unmatched" &&
    institutionMatch !== "ambiguous"
  ) {
    throw new Error(
      "CampaignRecipient.institutionMatch must be matched, unmatched, or ambiguous.",
    );
  }
  const source = input.source;
  if (
    source !== undefined &&
    source !== "segment" &&
    source !== "external_import" &&
    source !== "manual"
  ) {
    throw new Error("CampaignRecipient.source must be segment, external_import, or manual.");
  }
  const matchCandidateIds = input.matchCandidateIds
    ?.map((id) => id.trim())
    .filter(Boolean);
  const status =
    typeof input.status === "string"
      ? parseCampaignRecipientStatus(input.status)
      : (input.status ?? CampaignRecipientStatus.Pending);

  if (!id) throw new Error("CampaignRecipient.id is required.");
  if (!campaignId) throw new Error("CampaignRecipient.campaignId is required.");
  if (!institutionId) throw new Error("CampaignRecipient.institutionId is required.");
  if (!email || !email.includes("@")) {
    throw new Error("CampaignRecipient.email must be a valid email.");
  }
  assertIso(input.createdAt, "createdAt");
  assertIso(input.updatedAt, "updatedAt");
  for (const [field, value] of [
    ["sentAt", input.sentAt],
    ["openedAt", input.openedAt],
    ["clickedAt", input.clickedAt],
    ["claimedAt", input.claimedAt],
  ] as const) {
    if (value) assertIso(value, field);
  }

  return Object.freeze({
    id,
    campaignId,
    institutionId,
    ...(displayName ? { displayName } : {}),
    ...(institutionMatch ? { institutionMatch } : {}),
    ...(matchCandidateIds && matchCandidateIds.length > 0
      ? { matchCandidateIds: Object.freeze([...matchCandidateIds]) }
      : {}),
    ...(source ? { source } : {}),
    email,
    status,
    ...(input.sentAt ? { sentAt: input.sentAt } : {}),
    ...(input.openedAt ? { openedAt: input.openedAt } : {}),
    ...(input.clickedAt ? { clickedAt: input.clickedAt } : {}),
    ...(input.claimedAt ? { claimedAt: input.claimedAt } : {}),
    ...(lastError ? { lastError } : {}),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`CampaignRecipient.${field} must be a valid ISO timestamp.`);
  }
}
