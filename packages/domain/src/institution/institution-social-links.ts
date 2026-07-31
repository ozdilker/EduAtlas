/**
 * Optional public social / web presence links.
 */
export type InstitutionSocialLinks = Readonly<{
  readonly websiteUrl?: string;
  readonly facebookUrl?: string;
  readonly instagramUrl?: string;
  readonly twitterUrl?: string;
  readonly youtubeUrl?: string;
  readonly linkedinUrl?: string;
}>;

export type CreateInstitutionSocialLinksInput = {
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
};

/**
 * Creates an immutable InstitutionSocialLinks object.
 */
export function createInstitutionSocialLinks(
  input: CreateInstitutionSocialLinksInput = {},
): InstitutionSocialLinks {
  const websiteUrl = normalizeUrl(input.websiteUrl, "websiteUrl");
  const facebookUrl = normalizeUrl(input.facebookUrl, "facebookUrl");
  const instagramUrl = normalizeUrl(input.instagramUrl, "instagramUrl");
  const twitterUrl = normalizeUrl(input.twitterUrl, "twitterUrl");
  const youtubeUrl = normalizeUrl(input.youtubeUrl, "youtubeUrl");
  const linkedinUrl = normalizeUrl(input.linkedinUrl, "linkedinUrl");

  return Object.freeze({
    ...(websiteUrl ? { websiteUrl } : {}),
    ...(facebookUrl ? { facebookUrl } : {}),
    ...(instagramUrl ? { instagramUrl } : {}),
    ...(twitterUrl ? { twitterUrl } : {}),
    ...(youtubeUrl ? { youtubeUrl } : {}),
    ...(linkedinUrl ? { linkedinUrl } : {}),
  });
}

function normalizeUrl(value: string | undefined, field: string): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid protocol");
    }

    return url.toString();
  } catch {
    throw new Error(`InstitutionSocialLinks.${field} must be a valid http(s) URL.`);
  }
}
