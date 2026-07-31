import {
  createInstitutionImport,
  type InstitutionImport,
  mapInstitutionTypeLabel,
} from "@eduatlas/domain";

function stripHtml(value: string): string {
  return value.replaceAll(/<[^>]*>/g, " ");
}

function collapseWhitespace(value: string): string {
  return value.replaceAll(/[\s\u00a0\u200b\ufeff]+/g, " ").trim();
}

function normalizePhone(value: string): string {
  return collapseWhitespace(value.replaceAll(/[^\d+\s()-]/g, ""));
}

function normalizeEmail(value: string): string {
  return collapseWhitespace(value).toLowerCase();
}

/** Excel placeholders / junk that must not become `https://…`. */
const WEBSITE_PLACEHOLDER =
  /^(?:[-–—._*+/\\]+|yok|yoktur|yok\.|n\/?a|#n\/?a|na|none|null|nil|bilinmiyor|yoktur\.|var|yok\s*var)$/i;

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    const host = url.hostname.replace(/\.$/, "");
    // Require a real hostname with a dot (e.g. example.com), not "-", "www", etc.
    return host.includes(".") && !host.startsWith(".") && !host.endsWith(".");
  } catch {
    return false;
  }
}

/**
 * Normalizes website/social URL cells. Invalid or placeholder values become empty
 * so import preview never crashes on domain URL validation.
 */
function normalizeWebsite(value: string): string {
  const trimmed = collapseWhitespace(value);
  if (!trimmed || WEBSITE_PLACEHOLDER.test(trimmed)) {
    return "";
  }

  // Prefer the first URL-looking token when the cell has multiple values.
  const candidate =
    trimmed
      .split(/[|;,\n\r]+/)
      .map((part) => collapseWhitespace(part))
      .find((part) => part.length > 0) ?? trimmed;

  if (!candidate || WEBSITE_PLACEHOLDER.test(candidate)) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate.replace(/^\/+/, "")}`;

  return isValidHttpUrl(withProtocol) ? withProtocol : "";
}

/**
 * Normalizes a raw adapter row: phone/email/url/address/type.
 * Short description is filled after geography resolution when absent.
 */
export function normalizeInstitutionImportRow(row: InstitutionImport): InstitutionImport {
  const primaryType = mapInstitutionTypeLabel(row.primaryType);

  return createInstitutionImport({
    rowNumber: row.rowNumber,
    values: {
      name: collapseWhitespace(stripHtml(row.name)),
      slug: collapseWhitespace(row.slug),
      primaryType,
      cityId: collapseWhitespace(row.cityId),
      districtId: collapseWhitespace(row.districtId),
      address: collapseWhitespace(stripHtml(row.address)),
      shortDescription: collapseWhitespace(stripHtml(row.shortDescription)),
      longDescription: collapseWhitespace(stripHtml(row.longDescription)),
      phone: normalizePhone(row.phone),
      email: normalizeEmail(row.email),
      whatsappNumber: normalizePhone(row.whatsappNumber),
      websiteUrl: normalizeWebsite(row.websiteUrl),
      facebookUrl: normalizeWebsite(row.facebookUrl),
      instagramUrl: normalizeWebsite(row.instagramUrl),
      programsSummary: collapseWhitespace(stripHtml(row.programsSummary)),
      ageOrLevelFocus: collapseWhitespace(row.ageOrLevelFocus),
      latitude: collapseWhitespace(row.latitude).replace(",", "."),
      longitude: collapseWhitespace(row.longitude).replace(",", "."),
    },
  });
}

export function normalizeInstitutionImportRows(
  rows: readonly InstitutionImport[],
): readonly InstitutionImport[] {
  return Object.freeze(rows.map((row) => normalizeInstitutionImportRow(row)));
}

export function buildDefaultShortDescription(cityLabel: string, districtLabel: string): string {
  const city = collapseWhitespace(cityLabel);
  const district = collapseWhitespace(districtLabel);
  if (city && district) {
    return `${city} ili ${district} ilçesinde faaliyet gösteren eğitim kurumu.`;
  }
  if (city) {
    return `${city} ilinde faaliyet gösteren eğitim kurumu.`;
  }
  return "Eğitim kurumu.";
}
