import {
  cityIdAsString,
  districtIdAsString,
  getInstitutionTypeSlug,
  InstitutionType,
} from "@eduatlas/domain";
import { buildTurkeyGeographySeedCatalog } from "@eduatlas/firebase/server";
import type { CityLandingViewData } from "@eduatlas/ui";
import { searchPublicInstitutions } from "../institutions/search-public-institutions";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";

const RELATED_CITY_PRIORITY = [
  "istanbul",
  "ankara",
  "izmir",
  "bursa",
  "antalya",
  "gaziantep",
  "konya",
  "adana",
] as const;

const CITY_TYPES: readonly InstitutionType[] = Object.freeze([
  InstitutionType.Kindergarten,
  InstitutionType.Preschool,
  InstitutionType.PrivateSchool,
  InstitutionType.Dershane,
  InstitutionType.EtutMerkezi,
  InstitutionType.LanguageSchool,
]);

const COUNT_PAGE_SIZE = 1;
const DISTRICT_LINK_LIMIT = 12;

/**
 * Builds a data-backed city hub view for `/cities/{slug}`.
 * Uses the Türkiye geography catalog + a lightweight count query.
 * Returns null when the slug is not a known city.
 */
export async function getCityLandingView(citySlug: string): Promise<CityLandingViewData | null> {
  const slug = citySlug.trim().toLowerCase();
  if (!slug) {
    return null;
  }

  const catalog = buildTurkeyGeographySeedCatalog();
  const city = catalog.cities.find((item) => {
    const id = cityIdAsString(item.id);
    return item.slug === slug || id === slug || id === `city_${slug}`;
  });

  if (!city) {
    return null;
  }

  const cityId = cityIdAsString(city.id);
  const cityName = city.nameTr;
  const searchHref = `/search?city=${encodeURIComponent(cityId)}`;

  const cityDistricts = catalog.districts
    .filter((district) => cityIdAsString(district.cityId) === cityId)
    .slice()
    .sort((left, right) => left.nameTr.localeCompare(right.nameTr, "tr"));

  // Count only — city hubs no longer list institutions on the page.
  const countSearch = await searchPublicInstitutions({
    page: 1,
    pageSize: COUNT_PAGE_SIZE,
    filters: { cityId },
  });

  const totalInstitutions = countSearch.result.page.totalItems;

  const relatedCities = RELATED_CITY_PRIORITY.filter((id) => id !== city.slug)
    .map((id) => {
      const related = catalog.cities.find((item) => cityIdAsString(item.id) === id);
      if (!related) {
        return null;
      }
      return {
        id,
        label: related.nameTr,
        href: `/cities/${related.slug}`,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 6);

  return {
    slug: city.slug,
    name: cityName,
    title: `${cityName}’da Eğitim Kurumları`,
    description:
      totalInstitutions > 0
        ? `${cityName} genelinde ${formatCount(totalInstitutions)} yayınlı eğitim kurumunu keşfedin. Anaokulu, kreş, özel okul, dershane ve dil kurslarını ilçe ve türe göre filtreleyin.`
        : `${cityName} için henüz yayınlı kurum yok. Arama sayfasından diğer şehirleri keşfedebilir veya daha sonra tekrar bakabilirsiniz.`,
    breadcrumbs: [
      { id: "home", label: "Ana sayfa", href: "/" },
      { id: "cities", label: "Şehirler", href: "/cities" },
      { id: "current", label: cityName },
    ],
    statistics: [
      {
        id: "institutions",
        label: "Yayınlı kurum",
        value: formatCount(totalInstitutions),
      },
      {
        id: "districts",
        label: "İlçe",
        value: formatCount(cityDistricts.length),
      },
      {
        id: "types",
        label: "Kurum türü",
        value: formatCount(CITY_TYPES.length),
      },
      {
        id: "search",
        label: "Arama",
        value: "Açık",
      },
    ],
    categories: CITY_TYPES.map((type) => {
      const typeSlug = getInstitutionTypeSlug(type);
      const label = getInstitutionTypeLabel(type);
      return {
        id: typeSlug,
        label,
        href: `${searchHref}&type=${encodeURIComponent(type)}`,
        description: `${cityName} ${label.toLowerCase()} araması`,
      };
    }),
    featuredInstitutions: [],
    districts: cityDistricts.slice(0, DISTRICT_LINK_LIMIT).map((district) => {
      const districtId = districtIdAsString(district.id);
      return {
        id: districtId,
        label: district.nameTr,
        href: `${searchHref}&district=${encodeURIComponent(districtId)}`,
      };
    }),
    guides: [
      {
        id: "guide-search",
        title: `${cityName} kurumlarını ara`,
        summary: "Şehir filtresi açık arama sayfasında tüm yayınlı kurumları listeleyin.",
        href: searchHref,
      },
      {
        id: "guide-types",
        title: "Kurum türüne göre filtrele",
        summary: "Anaokulu, kreş, özel okul, dershane ve dil kurslarını ayrı ayrı inceleyin.",
        href: `${searchHref}&type=${encodeURIComponent(InstitutionType.Kindergarten)}`,
      },
      {
        id: "guide-categories",
        title: "Kategori rehberleri",
        summary: "Kurum tipi sayfalarından Türkiye geneli rehberlere geçin.",
        href: "/categories",
      },
      {
        id: "guide-cities",
        title: "Diğer şehirler",
        summary: "Başka bir şehir sayfasına geçerek karşılaştırmalı keşif yapın.",
        href: "/cities",
      },
    ],
    relatedCities,
  };
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}
