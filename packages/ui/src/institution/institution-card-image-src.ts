/**
 * Maps institution type labels / slugs to homepage category photography.
 * Used when an institution has no uploaded cover image.
 */
const TYPE_FALLBACK_IMAGES: Readonly<Record<string, string>> = Object.freeze({
  anaokulu: "/images/categories/anaokulu.png",
  kindergarten: "/images/categories/anaokulu.png",
  kres: "/images/categories/kres.png",
  kreş: "/images/categories/kres.png",
  preschool: "/images/categories/kres.png",
  "ozel-okul": "/images/categories/ozel-okul.png",
  "özel okul": "/images/categories/ozel-okul.png",
  private_school: "/images/categories/ozel-okul.png",
  dershane: "/images/categories/dershane.png",
  "etut-merkezi": "/images/categories/etut-merkezi.png",
  "etüt merkezi": "/images/categories/etut-merkezi.png",
  etut_merkezi: "/images/categories/etut-merkezi.png",
  "dil-kursu": "/images/categories/dil-kursu.png",
  "dil kursu": "/images/categories/dil-kursu.png",
  "dil-okulu": "/images/categories/dil-kursu.png",
  "dil okulu": "/images/categories/dil-kursu.png",
  language_school: "/images/categories/dil-kursu.png",
});

const DEFAULT_FALLBACK_IMAGE = "/images/categories/ozel-okul.png";

function normalizeTypeKey(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

/**
 * Category photography URL for a type label, slug, or enum value.
 */
export function getInstitutionTypeFallbackImage(typeKey?: string): string {
  if (!typeKey?.trim()) {
    return DEFAULT_FALLBACK_IMAGE;
  }
  return TYPE_FALLBACK_IMAGES[normalizeTypeKey(typeKey)] ?? DEFAULT_FALLBACK_IMAGE;
}

/**
 * Prefers the institution cover/image; otherwise uses type-matched category art.
 */
export function resolveInstitutionCardImageSrc(input: {
  imageSrc?: string;
  typeLabel?: string;
  typeSlug?: string;
}): string {
  const own = input.imageSrc?.trim();
  if (own) {
    return own;
  }
  if (input.typeSlug?.trim()) {
    return getInstitutionTypeFallbackImage(input.typeSlug);
  }
  return getInstitutionTypeFallbackImage(input.typeLabel);
}
