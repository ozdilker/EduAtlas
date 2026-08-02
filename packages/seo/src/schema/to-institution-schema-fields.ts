/**
 * Maps institution profile contact/media fields into MetadataEngine institution input.
 * Does not fetch — only reshapes data already loaded for the page.
 */
export function toInstitutionSchemaFields(profile: {
  readonly address?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly coverImageUrl?: string;
  readonly logoUrl?: string;
  readonly contact?: readonly { readonly id: string; readonly value: string; readonly href?: string }[];
}): {
  telephone?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
  logoUrl?: string;
  websiteUrl?: string;
} {
  const phone = profile.contact?.find((item) => item.id === "phone")?.value?.trim();
  const email = profile.contact?.find((item) => item.id === "email")?.value?.trim();
  const website = profile.contact?.find((item) => item.id === "web")?.href?.trim();
  const address = profile.address?.trim();

  return {
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(address ? { address } : {}),
    ...(typeof profile.latitude === "number" ? { latitude: profile.latitude } : {}),
    ...(typeof profile.longitude === "number" ? { longitude: profile.longitude } : {}),
    ...(profile.coverImageUrl?.trim() ? { coverImageUrl: profile.coverImageUrl.trim() } : {}),
    ...(profile.logoUrl?.trim() ? { logoUrl: profile.logoUrl.trim() } : {}),
    ...(website ? { websiteUrl: website } : {}),
  };
}
