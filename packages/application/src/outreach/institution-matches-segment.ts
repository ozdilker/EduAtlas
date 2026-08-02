import type { CampaignSegment, Institution } from "@eduatlas/domain";

/**
 * Evaluates whether an institution matches a campaign segment's dynamic filters.
 */
export function institutionMatchesSegment(
  institution: Institution,
  segment: CampaignSegment,
): boolean {
  const f = segment.filters;

  if (f.cityId && institution.location.cityId !== f.cityId) {
    return false;
  }
  if (f.districtId && institution.location.districtId !== f.districtId) {
    return false;
  }
  if (f.primaryType && institution.primaryType !== f.primaryType) {
    return false;
  }
  if (f.verification && institution.verification !== f.verification) {
    return false;
  }
  if (f.isPremium !== undefined && institution.isPremium !== f.isPremium) {
    return false;
  }

  const hasEmail = Boolean(institution.contact.email?.trim());
  const hasPhone = Boolean(institution.contact.phone?.trim());
  const hasWebsite = Boolean(institution.socialLinks.websiteUrl?.trim());

  if (f.hasEmail !== undefined && hasEmail !== f.hasEmail) {
    return false;
  }
  if (f.hasPhone !== undefined && hasPhone !== f.hasPhone) {
    return false;
  }
  if (f.hasWebsite !== undefined && hasWebsite !== f.hasWebsite) {
    return false;
  }

  const rating = institution.googleBusiness?.rating;
  if (f.googleRatingMin !== undefined) {
    if (rating === undefined || rating < f.googleRatingMin) {
      return false;
    }
  }
  if (f.googleRatingMax !== undefined) {
    if (rating === undefined || rating > f.googleRatingMax) {
      return false;
    }
  }

  return true;
}
