/**
 * Internal institution quality dimensions (not public Growth Score).
 */
export enum QualityDimension {
  Identity = "identity",
  Contact = "contact",
  Location = "location",
  Description = "description",
  Gallery = "gallery",
  Programs = "programs",
  Verification = "verification",
  Categories = "categories",
  Website = "website",
  SocialLinks = "social_links",
}

export const QUALITY_DIMENSIONS: readonly QualityDimension[] = Object.freeze(
  Object.values(QualityDimension),
);

const DIMENSION_VALUES: ReadonlySet<string> = new Set(Object.values(QualityDimension));

export function isQualityDimension(value: string): value is QualityDimension {
  return DIMENSION_VALUES.has(value);
}

export function parseQualityDimension(raw: string): QualityDimension {
  const value = raw.trim();
  if (!isQualityDimension(value)) {
    throw new Error(`Unknown QualityDimension: ${raw}`);
  }
  return value;
}

/** Max points per dimension (sums to 100). */
export const QUALITY_DIMENSION_WEIGHTS: Readonly<Record<QualityDimension, number>> = Object.freeze({
  [QualityDimension.Identity]: 10,
  [QualityDimension.Contact]: 12,
  [QualityDimension.Location]: 12,
  [QualityDimension.Description]: 12,
  [QualityDimension.Gallery]: 8,
  [QualityDimension.Programs]: 10,
  [QualityDimension.Verification]: 15,
  [QualityDimension.Categories]: 8,
  [QualityDimension.Website]: 8,
  [QualityDimension.SocialLinks]: 5,
});
