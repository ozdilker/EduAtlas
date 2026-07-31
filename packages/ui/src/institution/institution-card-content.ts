export type InstitutionCardBadgeFlags = {
  verified?: boolean;
  premium?: boolean;
  featured?: boolean;
};

/**
 * Presentation-only fields for institution cards (not a domain model).
 */
export type InstitutionCardViewData = {
  id: string;
  name: string;
  href: string;
  typeLabel: string;
  /** Optional type slug for fallback photography (e.g. anaokulu). */
  typeSlug?: string;
  city?: string;
  district?: string;
  snippet?: string;
  imageSrc?: string;
  imageAlt?: string;
  badges?: InstitutionCardBadgeFlags;
  /** Optional program / track chips (UI presentation). */
  programLabels?: readonly string[];
  /** Optional distance label when geo context is available. */
  distanceLabel?: string;
  ratingPlaceholder?: string;
  reviewCountPlaceholder?: string;
  studentCountPlaceholder?: string;
  ctaLabel?: string;
};

export type InstitutionCardLayout = "vertical" | "horizontal" | "compact";

export function getInstitutionCardBadgeLabels(flags: InstitutionCardBadgeFlags = {}) {
  const labels: Array<{
    id: string;
    label: string;
    tone: "success" | "warning" | "info" | "primary";
  }> = [];

  if (flags.verified) {
    labels.push({ id: "verified", label: "Doğrulanmış", tone: "success" });
  }
  if (flags.premium) {
    labels.push({ id: "premium", label: "Premium", tone: "warning" });
  }
  if (flags.featured) {
    labels.push({ id: "featured", label: "Öne çıkan", tone: "info" });
  }

  return labels;
}

export function getInstitutionCardEmptyMessage(): string {
  return "Aramanızla eşleşen kurum yok. Filtreleri hafifçe değiştirerek yeniden deneyin.";
}

export function getSampleInstitutionCardData(): InstitutionCardViewData {
  return {
    id: "sample-anaokulu",
    name: "Örnek Anaokulu",
    href: "/institutions/ornek-anaokulu",
    typeLabel: "Anaokulu",
    city: "İstanbul",
    district: "Kadıköy",
    snippet: "Aileler için örnek kurum kartı — yalnızca arayüz yer tutucusu.",
    imageAlt: "Örnek anaokulu görseli",
    programLabels: ["Okul öncesi", "Tam gün"],
    distanceLabel: "1,2 km",
    badges: {
      verified: true,
      premium: true,
      featured: false,
    },
    ratingPlaceholder: "4,6",
    reviewCountPlaceholder: "128 değerlendirme",
    studentCountPlaceholder: "— öğrenci",
    ctaLabel: "İncele",
  };
}
