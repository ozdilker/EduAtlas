import { type CreateInstitutionInput, createInstitution, type Institution } from "./institution";
import {
  type CreateInstitutionSearchDocumentInput,
  createInstitutionSearchDocument,
  type InstitutionSearchDocument,
} from "./institution-search-document";
import { InstitutionStatus } from "./institution-status";
import { InstitutionVerification } from "./institution-verification";

export type CreateDraftInstitutionInput = Omit<
  CreateInstitutionInput,
  "status" | "verification" | "isPremium" | "qualityScore"
> & {
  status?: InstitutionStatus;
  verification?: InstitutionVerification;
  isPremium?: boolean;
  qualityScore?: number;
};

/**
 * Factory for a draft institution with safe defaults.
 */
export function createDraftInstitution(input: CreateDraftInstitutionInput): Institution {
  return createInstitution({
    ...input,
    status: input.status ?? InstitutionStatus.Draft,
    verification: input.verification ?? InstitutionVerification.Unclaimed,
    isPremium: input.isPremium ?? false,
    qualityScore: input.qualityScore ?? 0,
  });
}

/**
 * Factory for a published institution.
 */
export function createPublishedInstitution(
  input: CreateInstitutionInput & { publishedAt: string },
): Institution {
  return createInstitution({
    ...input,
    status: InstitutionStatus.Published,
    publishedAt: input.publishedAt,
  });
}

/**
 * Factory for a published search projection document.
 */
export function createPublishedSearchDocument(
  input: Omit<CreateInstitutionSearchDocumentInput, "status"> & {
    status?: InstitutionStatus;
  },
): InstitutionSearchDocument {
  return createInstitutionSearchDocument({
    ...input,
    status: InstitutionStatus.Published,
  });
}
