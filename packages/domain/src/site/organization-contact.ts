export const DEFAULT_ORGANIZATION_DISPLAY_NAME = "EduAtlas";
export const DEFAULT_ORGANIZATION_CONTACT_EMAIL = "info@eduatlas.com.tr";
export const ORGANIZATION_CONTACT_COUNTRY = "TR" as const;

export type OrganizationContact = Readonly<{
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly streetAddress: string;
  readonly addressLocality: string;
  readonly addressRegion: string;
  readonly postalCode: string;
  readonly addressCountry: "TR";
  readonly updatedAt: string;
  readonly updatedByUserId?: string;
}>;

export type CreateOrganizationContactInput = {
  readonly displayName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly streetAddress?: string;
  readonly addressLocality?: string;
  readonly addressRegion?: string;
  readonly postalCode?: string;
  readonly updatedAt?: string;
  readonly updatedByUserId?: string;
};

export function createOrganizationContact(
  input: CreateOrganizationContactInput = {},
): OrganizationContact {
  const emailRaw = input.email?.trim().toLowerCase() ?? "";
  if (emailRaw && !emailRaw.includes("@")) {
    throw new Error("OrganizationContact.email must be a valid email.");
  }
  return Object.freeze({
    displayName: input.displayName?.trim() ?? "",
    email: emailRaw,
    phone: input.phone?.trim() ?? "",
    streetAddress: input.streetAddress?.trim() ?? "",
    addressLocality: input.addressLocality?.trim() ?? "",
    addressRegion: input.addressRegion?.trim() ?? "",
    postalCode: input.postalCode?.trim() ?? "",
    addressCountry: ORGANIZATION_CONTACT_COUNTRY,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    ...(input.updatedByUserId?.trim()
      ? { updatedByUserId: input.updatedByUserId.trim() }
      : {}),
  });
}

/** Public-facing merge with defaults. */
export function resolveOrganizationContact(contact: OrganizationContact): OrganizationContact {
  return createOrganizationContact({
    displayName: contact.displayName || DEFAULT_ORGANIZATION_DISPLAY_NAME,
    email: contact.email || DEFAULT_ORGANIZATION_CONTACT_EMAIL,
    phone: contact.phone,
    streetAddress: contact.streetAddress,
    addressLocality: contact.addressLocality,
    addressRegion: contact.addressRegion,
    postalCode: contact.postalCode,
    updatedAt: contact.updatedAt,
    updatedByUserId: contact.updatedByUserId,
  });
}

export function formatOrganizationAddressLine(contact: OrganizationContact): string {
  return [contact.streetAddress, contact.addressLocality, contact.addressRegion, contact.postalCode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export function formatOrganizationAddressMultiline(contact: OrganizationContact): string {
  const line1 = contact.streetAddress.trim();
  const line2 = [contact.postalCode, contact.addressLocality, contact.addressRegion]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  if (!line1 && !line2) return "";
  return [line1, line2, "Türkiye"].filter(Boolean).join("\n");
}

export function formatOrganizationAddressForPaytr(contact: OrganizationContact): string {
  const line = formatOrganizationAddressLine(contact);
  return line ? `${line}, Türkiye` : "";
}
