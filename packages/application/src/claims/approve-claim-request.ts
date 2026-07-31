import {
  ClaimRequestStatus,
  createClaimRequestId,
  createInstitution,
  createOwnerBinding,
  InstitutionVerification,
  institutionIdAsString,
  type ClaimRequest,
  type Institution,
  type OwnerBinding,
} from "@eduatlas/domain";
import { generateTemporaryOwnerPassword } from "../identity/generate-temporary-password";
import type { OwnerAccountProvisioner } from "../identity/owner-account-provisioner";
import type { OwnerBindingRepository } from "../identity/owner-binding-repository";
import { InstitutionNotFoundError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { EmailService } from "../notifications/email-service";
import { renderEmailTemplate } from "../notifications/email-templates";
import { resolveEmailCtaHref } from "../notifications/resolve-email-cta-href";
import type { ClaimRequestRepository } from "./claim-request-repository";
import { ClaimValidationError } from "./errors";

export type ApproveClaimRequestInput = {
  claimRequestId: string;
  institutionId?: string;
  reviewedBy?: string;
  siteBaseUrl?: string;
  now?: string;
};

export type ApproveClaimRequestResult = Readonly<{
  readonly claimRequest: ClaimRequest;
  readonly institution: Institution;
  readonly binding: OwnerBinding;
  readonly ownerEmail: string;
  readonly temporaryPassword: string;
  readonly userId: string;
}>;

export type ApproveClaimRequestDependencies = {
  claimRequestRepository: ClaimRequestRepository;
  institutionRepository: InstitutionRepository;
  ownerBindingRepository: OwnerBindingRepository;
  ownerAccountProvisioner: OwnerAccountProvisioner;
  emailService: EmailService;
};

/**
 * Admin approval: claim → verified institution + owner binding + Auth credentials email.
 */
export async function approveClaimRequest(
  input: ApproveClaimRequestInput,
  deps: ApproveClaimRequestDependencies,
): Promise<ApproveClaimRequestResult> {
  const claimId = input.claimRequestId.trim();
  if (!claimId) {
    throw new ClaimValidationError("claimRequestId is required.");
  }

  const loaded = await deps.claimRequestRepository.getById(createClaimRequestId(claimId));
  if (!loaded) {
    throw new ClaimValidationError("Sahiplenme talebi bulunamadı.");
  }
  if (loaded.status !== ClaimRequestStatus.Pending) {
    throw new ClaimValidationError("Bu talep zaten işlenmiş.");
  }
  if (input.institutionId?.trim() && loaded.institutionId.value !== input.institutionId.trim()) {
    throw new ClaimValidationError("Talep kurum ile eşleşmiyor.");
  }

  const institution = await deps.institutionRepository.getById(loaded.institutionId);
  if (!institution) {
    throw new InstitutionNotFoundError({ id: loaded.institutionId });
  }

  const now = input.now ?? new Date().toISOString();
  const temporaryPassword = generateTemporaryOwnerPassword();
  const provisioned = await deps.ownerAccountProvisioner.provisionOwnerWithPassword({
    email: loaded.email,
    password: temporaryPassword,
    displayName: loaded.applicantName,
  });

  const approvedClaim = await deps.claimRequestRepository.updateStatus(
    loaded.id,
    ClaimRequestStatus.Approved,
  );

  const verifiedInstitution = await deps.institutionRepository.update(
    createInstitution({
      id: institutionIdAsString(institution.id),
      name: institution.name,
      slug: institution.slug,
      primaryType: institution.primaryType,
      status: institution.status,
      verification: InstitutionVerification.Verified,
      location: institution.location,
      contact: institution.contact,
      socialLinks: institution.socialLinks,
      shortDescription: institution.shortDescription,
      longDescription: institution.longDescription,
      programsSummary: institution.programsSummary,
      ageOrLevelFocus: institution.ageOrLevelFocus,
      logoUrl: institution.logoUrl,
      coverImageUrl: institution.coverImageUrl,
      galleryImages: institution.galleryImages,
      workingHours: institution.workingHours,
      promoVideoUrl: institution.promoVideoUrl,
      brochurePdfUrl: institution.brochurePdfUrl,
      amenities: institution.amenities,
      educationPrograms: institution.educationPrograms,
      faqs: institution.faqs,
      highlights: institution.highlights,
      isPremium: institution.isPremium,
      qualityScore: institution.qualityScore,
      publishedAt: institution.publishedAt,
      createdAt: institution.createdAt,
      updatedAt: now,
      updatedByUserId: input.reviewedBy ?? institution.updatedByUserId,
      leadCounters: institution.leadCounters,
    }),
  );

  const binding = await deps.ownerBindingRepository.save(
    createOwnerBinding({
      userId: provisioned.userId,
      institutionId: institutionIdAsString(verifiedInstitution.id),
      status: "approved",
      requestedAt: loaded.createdAt,
      approvedAt: now,
    }),
  );

  const loginHref =
    resolveEmailCtaHref("/login", input.siteBaseUrl) ?? "https://eduatlas.com.tr/login";
  const rendered = renderEmailTemplate({
    title: "EduAtlas — Kurum paneli giriş bilgileriniz",
    preview: "Sahiplenme onaylandı. Geçici şifrenizle giriş yapabilirsiniz.",
    bodyLines: [
      `Merhaba ${loaded.applicantName},`,
      `${verifiedInstitution.name} için sahiplenme talebiniz onaylandı.`,
      `Giriş e-postası: ${loaded.email}`,
      `Geçici şifre: ${temporaryPassword}`,
      "Giriş yaptıktan sonra kurum panelinden şifrenizi değiştirmenizi öneririz.",
    ],
    ctaLabel: "Kurum paneline giriş",
    ctaHref: loginHref,
  });

  await deps.emailService.send({
    to: loaded.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    messageId: `claim_approved_${approvedClaim.id.value}`,
  });

  return Object.freeze({
    claimRequest: approvedClaim,
    institution: verifiedInstitution,
    binding,
    ownerEmail: loaded.email,
    temporaryPassword,
    userId: provisioned.userId,
  });
}
