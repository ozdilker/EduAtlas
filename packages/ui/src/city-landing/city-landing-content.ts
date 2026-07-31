import type { InstitutionCardViewData } from "../institution/institution-card-content";

export type CityBreadcrumbItem = {
  id: string;
  label: string;
  href?: string;
};

export type CityStatItem = {
  id: string;
  label: string;
  value: string;
};

export type CityCategoryItem = {
  id: string;
  label: string;
  href: string;
  description: string;
};

export type CityDistrictItem = {
  id: string;
  label: string;
  href: string;
};

export type CityGuideItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
};

export type RelatedCityItem = {
  id: string;
  label: string;
  href: string;
};

export type CityLandingViewData = {
  slug: string;
  name: string;
  title: string;
  description: string;
  breadcrumbs: CityBreadcrumbItem[];
  statistics: CityStatItem[];
  categories: CityCategoryItem[];
  featuredInstitutions: InstitutionCardViewData[];
  districts: CityDistrictItem[];
  guides: CityGuideItem[];
  relatedCities: RelatedCityItem[];
};

/**
 * Static city hub presentation data (UI only).
 * Canonical path shape: `/cities/{slug}` — future bare `/{slug}` redirects remain compatible.
 */
export function getStaticCityLanding(slug = "ankara"): CityLandingViewData {
  const name = slug === "ankara" ? "Ankara" : slug.charAt(0).toUpperCase() + slug.slice(1);
  const cityPath = `/cities/${slug}`;

  return {
    slug,
    name,
    title: `${name}’da Eğitim Kurumları`,
    description: `${name} genelinde anaokulu, kreş, özel okul, dershane ve dil kurslarını keşfedin. Bu sayfa statik bir şehir hub arayüzüdür.`,
    breadcrumbs: [
      { id: "home", label: "Ana sayfa", href: "/" },
      { id: "cities", label: "Şehirler", href: "/cities" },
      { id: "current", label: name },
    ],
    statistics: [
      { id: "institutions", label: "Kurum profili", value: "120+" },
      { id: "districts", label: "İlçe", value: "8" },
      { id: "types", label: "Kurum türü", value: "6" },
      { id: "guides", label: "Rehber", value: "4" },
    ],
    categories: [
      {
        id: "anaokulu",
        label: "Anaokulu",
        href: `${cityPath}/types/anaokulu`,
        description: `${name} anaokulları`,
      },
      {
        id: "kres",
        label: "Kreş",
        href: `${cityPath}/types/kres`,
        description: `${name} kreşleri`,
      },
      {
        id: "ozel-okul",
        label: "Özel Okul",
        href: `${cityPath}/types/ozel-okul`,
        description: `${name} özel okulları`,
      },
      {
        id: "dershane",
        label: "Dershane",
        href: `${cityPath}/types/dershane`,
        description: `${name} dershaneleri`,
      },
      {
        id: "etut-merkezi",
        label: "Etüt Merkezi",
        href: `${cityPath}/types/etut-merkezi`,
        description: `${name} etüt merkezleri`,
      },
      {
        id: "dil-kursu",
        label: "Dil Kursu",
        href: `${cityPath}/types/dil-kursu`,
        description: `${name} dil kursları`,
      },
    ],
    featuredInstitutions: [
      {
        id: `${slug}-featured-1`,
        name: `${name} Örnek Anaokulu`,
        href: "/institutions/ankara-ornek-anaokulu",
        typeLabel: "Anaokulu",
        city: name,
        district: "Çankaya",
        snippet: "Şehir hub’ında öne çıkan statik kurum kartı.",
        badges: { verified: true, premium: true },
        ctaLabel: "İncele",
      },
      {
        id: `${slug}-featured-2`,
        name: `${name} Merkez Dershane`,
        href: "/institutions/ankara-merkez-dershane",
        typeLabel: "Dershane",
        city: name,
        district: "Yenimahalle",
        snippet: "Statik öne çıkan kurum örneği.",
        badges: { verified: true },
        ctaLabel: "İncele",
      },
      {
        id: `${slug}-featured-3`,
        name: `${name} Dil Akademisi`,
        href: "/institutions/ankara-dil-akademisi",
        typeLabel: "Dil Kursu",
        city: name,
        district: "Keçiören",
        snippet: "Şehir sayfası için örnek kart.",
        badges: { featured: true },
        ctaLabel: "İncele",
      },
      {
        id: `${slug}-featured-4`,
        name: `${name} Özel Okul`,
        href: "/institutions/ankara-ozel-okul",
        typeLabel: "Özel Okul",
        city: name,
        district: "Çankaya",
        snippet: "Statik featured kurum kartı.",
        badges: { premium: true },
        ctaLabel: "İncele",
      },
      {
        id: `${slug}-featured-5`,
        name: `${name} Etüt Merkezi`,
        href: "/institutions/ankara-etut-merkezi",
        typeLabel: "Etüt Merkezi",
        city: name,
        district: "Etimesgut",
        snippet: "Hub listesi için yer tutucu kart.",
        badges: { verified: true },
        ctaLabel: "İncele",
      },
      {
        id: `${slug}-featured-6`,
        name: `${name} Örnek Kreş`,
        href: "/institutions/ankara-ornek-kres",
        typeLabel: "Kreş",
        city: name,
        district: "Mamak",
        snippet: "Statik şehir hub kurum örneği.",
        badges: {},
        ctaLabel: "İncele",
      },
    ],
    districts: [
      { id: "cankaya", label: "Çankaya", href: `${cityPath}/cankaya` },
      { id: "yenimahalle", label: "Yenimahalle", href: `${cityPath}/yenimahalle` },
      { id: "kecioren", label: "Keçiören", href: `${cityPath}/kecioren` },
      { id: "mamak", label: "Mamak", href: `${cityPath}/mamak` },
      { id: "etimesgut", label: "Etimesgut", href: `${cityPath}/etimesgut` },
      { id: "sincan", label: "Sincan", href: `${cityPath}/sincan` },
      { id: "altindag", label: "Altındağ", href: `${cityPath}/altindag` },
      { id: "pursaklar", label: "Pursaklar", href: `${cityPath}/pursaklar` },
    ],
    guides: [
      {
        id: "guide-1",
        title: `${name}’da anaokulu seçerken`,
        summary: "Aileler için statik rehber özeti — yalnızca arayüz yer tutucusu.",
        href: "/categories/anaokulu",
      },
      {
        id: "guide-2",
        title: "Dershane karşılaştırması",
        summary: "Şehir bazlı karşılaştırma rehberi (statik).",
        href: "/categories/dershane",
      },
      {
        id: "guide-3",
        title: "İlçe rehberi: Çankaya",
        summary: "Popüler ilçede eğitim seçeneklerine bakış.",
        href: `${cityPath}/cankaya`,
      },
      {
        id: "guide-4",
        title: "Dil kursu başlangıç rehberi",
        summary: "Dil eğitimi arayan aileler için kısa rehber.",
        href: "/categories/dil-kursu",
      },
    ],
    relatedCities: [
      { id: "istanbul", label: "İstanbul", href: "/cities/istanbul" },
      { id: "izmir", label: "İzmir", href: "/cities/izmir" },
      { id: "bursa", label: "Bursa", href: "/cities/bursa" },
      { id: "antalya", label: "Antalya", href: "/cities/antalya" },
      { id: "gaziantep", label: "Gaziantep", href: "/cities/gaziantep" },
      { id: "konya", label: "Konya", href: "/cities/konya" },
    ],
  };
}
