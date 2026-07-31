import {
  createInstitution,
  createInstitutionId,
  type Institution,
  InstitutionStatus,
  institutionIdAsString,
  validateInstitutionForPublish,
} from "@eduatlas/domain";
import { withRecalculatedInstitutionQuality } from "../institution-quality/with-recalculated-institution-quality";
import { InstitutionNotFoundError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";

/**
 * Human review decisions. Merge is intentionally NOT here —
 * it is a UI placeholder until a dedicated merge workflow ships.
 */
export type ReviewAction = "publish" | "return_to_draft" | "reject";

export const REVIEW_ACTIONS: readonly ReviewAction[] = Object.freeze([
  "publish",
  "return_to_draft",
  "reject",
]);

export function isReviewAction(value: string): value is ReviewAction {
  return (REVIEW_ACTIONS as readonly string[]).includes(value);
}

/**
 * Thrown when a review decision violates business rules (e.g. publish gates).
 */
export class ReviewValidationError extends Error {
  readonly code = "REVIEW_VALIDATION" as const;
  readonly errors: readonly string[];

  constructor(message: string, errors: readonly string[] = []) {
    super(message);
    this.name = "ReviewValidationError";
    this.errors = Object.freeze([...errors]);
  }
}

export function isReviewValidationError(error: unknown): error is ReviewValidationError {
  return error instanceof ReviewValidationError;
}

export type ReviewInstitutionInput = {
  institutionId: string;
  action: ReviewAction;
  /** Reviewer identity for the audit trail. */
  reviewedBy?: string;
  now?: string;
};

export type ReviewInstitutionDependencies = {
  institutionRepository: InstitutionRepository;
};

export type ReviewInstitutionResult = Readonly<{
  readonly institution: Institution;
  readonly action: ReviewAction;
}>;

/**
 * Applies a human review decision through the repository:
 * publish (with publish-gate validation), return to draft, or reject (archive).
 * No automation — every transition is admin-initiated.
 * @throws {InstitutionNotFoundError} when the institution does not exist
 * @throws {ReviewValidationError} when the transition is not allowed
 */
export async function reviewInstitution(
  input: ReviewInstitutionInput,
  deps: ReviewInstitutionDependencies,
): Promise<ReviewInstitutionResult> {
  const id = createInstitutionId(input.institutionId);
  const existing = await deps.institutionRepository.getById(id);

  if (!existing) {
    throw new InstitutionNotFoundError({ id });
  }

  const now = input.now ?? new Date().toISOString();
  const nextStatus = statusForAction(input.action);

  if (existing.status === nextStatus) {
    throw new ReviewValidationError("Kurum zaten bu durumda.");
  }

  if (input.action === "publish") {
    const validation = validateInstitutionForPublish(existing);
    if (!validation.ok) {
      throw new ReviewValidationError("Yayın koşulları sağlanmıyor.", validation.errors);
    }
  }

  const updated = createInstitution({
    id: institutionIdAsString(existing.id),
    name: existing.name,
    slug: existing.slug,
    primaryType: existing.primaryType,
    status: nextStatus,
    verification: existing.verification,
    location: existing.location,
    contact: existing.contact,
    socialLinks: existing.socialLinks,
    shortDescription: existing.shortDescription,
    longDescription: existing.longDescription,
    programsSummary: existing.programsSummary,
    ageOrLevelFocus: existing.ageOrLevelFocus,
    logoUrl: existing.logoUrl,
    coverImageUrl: existing.coverImageUrl,
    galleryImages: existing.galleryImages,
    workingHours: existing.workingHours,
    promoVideoUrl: existing.promoVideoUrl,
    brochurePdfUrl: existing.brochurePdfUrl,
    amenities: existing.amenities,
    educationPrograms: existing.educationPrograms,
    faqs: existing.faqs,
    highlights: existing.highlights,
    isPremium: existing.isPremium,
    qualityScore: existing.qualityScore,
    publishedAt: input.action === "publish" ? (existing.publishedAt ?? now) : existing.publishedAt,
    createdAt: existing.createdAt,
    updatedAt: now,
    updatedByUserId: input.reviewedBy ?? existing.updatedByUserId,
  });

  const saved = await deps.institutionRepository.update(
    withRecalculatedInstitutionQuality(updated, now),
  );

  return Object.freeze({ institution: saved, action: input.action });
}

function statusForAction(action: ReviewAction): InstitutionStatus {
  switch (action) {
    case "publish":
      return InstitutionStatus.Published;
    case "return_to_draft":
      return InstitutionStatus.Draft;
    case "reject":
      return InstitutionStatus.Archived;
  }
}
