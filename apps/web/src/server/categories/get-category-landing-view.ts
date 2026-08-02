import {
  getInstitutionTypeSlug,
  InstitutionType,
} from "@eduatlas/domain";
import { buildTurkeyGeographySeedCatalog } from "@eduatlas/firebase/server";
import type { CategoryLandingViewData } from "@eduatlas/ui";
import { cache } from "react";
import { searchPublicInstitutions } from "../institutions/search-public-institutions";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";

const COUNT_PAGE_SIZE = 1;

const POPULAR_CITY_PRIORITY = [
  "istanbul",
  "ankara",
  "izmir",
  "bursa",
  "antalya",
  "gaziantep",
  "konya",
  "adana",
] as const;

const CATEGORY_SLUG_ALIASES: Readonly<Record<string, InstitutionType>> = Object.freeze({
  "dil-kursu": InstitutionType.LanguageSchool,
});

/**
 * Maps a public `/categories/{slug}` path segment to InstitutionType.
 */
export function resolveInstitutionTypeFromCategorySlug(slug: string): InstitutionType | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized in CATEGORY_SLUG_ALIASES) {
    return CATEGORY_SLUG_ALIASES[normalized] ?? null;
  }

  for (const type of Object.values(InstitutionType)) {
    if (getInstitutionTypeSlug(type) === normalized) {
      return type;
    }
  }

  return null;
}

/**
 * Builds a data-backed category hub for `/categories/{slug}`.
 * Returns null when the slug is not a known institution type.
 * Cached per-request so generateMetadata + page share one load.
 */
export const getCategoryLandingView = cache(async function getCategoryLandingView(
  categorySlug: string,
): Promise<CategoryLandingViewData | null> {
  const type = resolveInstitutionTypeFromCategorySlug(categorySlug);
  if (!type) {
    return null;
  }

  const typeSlug = getInstitutionTypeSlug(type);
  const name = getInstitutionTypeLabel(type);
  const searchHref = `/search?type=${encodeURIComponent(type)}`;

  // Count only — category hubs no longer list institutions on the page.
  const countSearch = await searchPublicInstitutions({
    page: 1,
    pageSize: COUNT_PAGE_SIZE,
    filters: { primaryType: type },
  });

  const totalInstitutions = countSearch.result.page.totalItems;
  const catalog = buildTurkeyGeographySeedCatalog();
  const popularCities = POPULAR_CITY_PRIORITY.map((id) => {
    const city = catalog.cities.find((item) => item.slug === id);
    if (!city) {
      return null;
    }
    return {
      id,
      label: city.nameTr,
      href: `/cities/${city.slug}/types/${typeSlug}`,
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const relatedTypes = Object.values(InstitutionType)
    .filter((item) => item !== type)
    .map((item) => {
      const slug = getInstitutionTypeSlug(item);
      const label = getInstitutionTypeLabel(item);
      return {
        id: slug,
        label,
        href: `/categories/${slug}`,
        description: `${label} kurumlarını keşfedin`,
      };
    });

  return {
    slug: typeSlug,
    typeId: type,
    name,
    title: `Türkiye’de ${name}`,
    description:
      totalInstitutions > 0
        ? `Türkiye genelinde ${formatCount(totalInstitutions)} yayınlı ${name.toLowerCase()} kurumunu keşfedin. Şehir ve arama filtreleriyle daraltın.`
        : `Bu kategoride henüz yayınlı ${name.toLowerCase()} yok. Arama sayfasından diğer türleri deneyebilirsiniz.`,
    breadcrumbs: [
      { id: "home", label: "Ana sayfa", href: "/" },
      { id: "categories", label: "Kategoriler", href: "/categories" },
      { id: "current", label: name },
    ],
    statistics: [
      {
        id: "institutions",
        label: "Yayınlı kurum",
        value: formatCount(totalInstitutions),
      },
      {
        id: "cities",
        label: "Popüler şehir",
        value: formatCount(popularCities.length),
      },
      {
        id: "search",
        label: "Arama",
        value: "Açık",
      },
    ],
    popularCities:
      popularCities.length > 0
        ? popularCities
        : [
            { id: "istanbul", label: "İstanbul", href: `/cities/istanbul/types/${typeSlug}` },
            { id: "ankara", label: "Ankara", href: `/cities/ankara/types/${typeSlug}` },
            { id: "izmir", label: "İzmir", href: `/cities/izmir/types/${typeSlug}` },
          ],
    featuredInstitutions: [],
    relatedCategories: relatedTypes,
    buyingGuide: [
      {
        id: "needs",
        title: "İhtiyacı netleştirin",
        body: `${name} seçerken yaş grubu, program ve ulaşım önceliklerinizi listeleyin.`,
      },
      {
        id: "compare",
        title: "Birkaç kurumu karşılaştırın",
        body: "Konum, program özeti ve iletişim seçeneklerini yan yana değerlendirin.",
      },
      {
        id: "visit",
        title: "Bilgi alın ve ziyaret planlayın",
        body: "İlgilendiğiniz kurumlara bilgi talebi bırakın; mümkünse yerinde görün.",
      },
      {
        id: "verify",
        title: "Doğrulama sinyallerine bakın",
        body: "Doğrulanmış ve sahiplenilmiş profiller güven için yardımcı işaretlerdir.",
      },
      {
        id: "decide",
        title: "Kararınızı belgeleyin",
        body: "Ücret, saat ve kayıt koşullarını yazılı olarak netleştirin.",
      },
    ],
    faqs: [
      {
        id: "faq-1",
        question: `${name} nasıl seçilir?`,
        answer:
          "Önce ihtiyaçlarınızı belirleyin, ardından şehir ve ilçe filtreleriyle adayları daraltın.",
      },
      {
        id: "faq-2",
        question: "Şehir bazlı sayfalar var mı?",
        answer: `Evet. Örneğin İstanbul için /cities/istanbul/types/${typeSlug} yolunu kullanabilirsiniz. Tüm sonuçlar için ${searchHref} aramasını açın.`,
      },
      {
        id: "faq-3",
        question: "Kurum bilgileri güncel mi?",
        answer:
          "Bu listedeki kurumlar yayınlı katalogdan gelir. Eksik veya hatalı bilgi görürseniz kurum profilinden bildirim bırakabilirsiniz.",
      },
      {
        id: "faq-4",
        question: "Bilgi talebi gönderebilir miyim?",
        answer: "Kurum profil sayfalarındaki iletişim ve bilgi formu alanlarını kullanabilirsiniz.",
      },
    ],
  };
});

function formatCount(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}
