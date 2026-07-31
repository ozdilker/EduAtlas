import type { InstitutionSearchDocument } from "@eduatlas/domain";
import { getInstitutionTypeSlug, isInstitutionVerified } from "@eduatlas/domain";
import type { InstitutionCardViewData } from "@eduatlas/ui";
import { getInstitutionTypeLabel } from "./to-profile-view";
import { resolveFirebaseStorageVariantUrl } from "@eduatlas/firebase/storage";

const IMAGE_VARIANTS_ENABLED =
  process.env.EDUATLAS_IMAGE_VARIANTS_ENABLED?.trim().toLowerCase() === "1" ||
  process.env.EDUATLAS_IMAGE_VARIANTS_ENABLED?.trim().toLowerCase() === "true";

/**
 * Maps a search projection document to an InstitutionCard DTO for UI.
 */
export function toInstitutionCardFromSearchDocument(
  document: InstitutionSearchDocument,
): InstitutionCardViewData {
  return {
    id: document.id,
    name: document.name,
    href: `/institutions/${document.slug}`,
    typeLabel: getInstitutionTypeLabel(document.primaryType),
    typeSlug: getInstitutionTypeSlug(document.primaryType),
    city: document.cityName,
    district: document.districtName,
    snippet: undefined,
    ...(document.coverImageUrl
      ? {
          imageSrc: IMAGE_VARIANTS_ENABLED
            ? resolveFirebaseStorageVariantUrl({
                url: document.coverImageUrl,
                variant: "thumb_200",
              }) ?? document.coverImageUrl
            : document.coverImageUrl,
        }
      : {}),
    badges: {
      verified: isInstitutionVerified(document.verification),
      premium: document.isPremium,
      featured: document.isFeatured,
    },
    ctaLabel: "İncele",
  };
}

export function getTypeHrefFromSearchDocument(document: InstitutionSearchDocument): string {
  return `/categories/${getInstitutionTypeSlug(document.primaryType)}`;
}
