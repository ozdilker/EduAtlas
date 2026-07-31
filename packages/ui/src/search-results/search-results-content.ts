import type { InstitutionCardViewData } from "../institution/institution-card-content";

export type SearchResultsSortOption = {
  id: string;
  label: string;
  selected?: boolean;
};

export type SearchResultsFilterChip = {
  id: string;
  label: string;
  selected?: boolean;
};

export type SearchResultsPageInfo = {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
};

export function getStaticSearchResultsSummary() {
  return {
    queryLabel: "eğitim kurumları",
    resultCount: 12,
    resultCountLabel: "12 kurum",
  };
}

export function getStaticSearchResultsSortOptions(): SearchResultsSortOption[] {
  return [
    { id: "relevance", label: "İlgiye göre", selected: true },
    { id: "name-asc", label: "Ada göre (A-Z)", selected: false },
    { id: "name-desc", label: "Ada göre (Z-A)", selected: false },
  ];
}

export function getStaticSearchResultsFilterChips(): SearchResultsFilterChip[] {
  return [
    { id: "city-istanbul", label: "İstanbul", selected: true },
    { id: "type-anaokulu", label: "Anaokulu", selected: false },
    { id: "type-dershane", label: "Dershane", selected: false },
    { id: "type-dil", label: "Dil kursu", selected: false },
    { id: "verified", label: "Doğrulanmış", selected: false },
  ];
}

export function getStaticSearchResultsPagination(): SearchResultsPageInfo {
  return {
    currentPage: 1,
    totalPages: 5,
    pageNumbers: [1, 2, 3, 4, 5],
  };
}

const PROGRAM_SETS = [
  ["Okul öncesi", "Tam gün"],
  ["Yüz yüze", "Yarı zamanlı"],
  ["STEM", "Yabancı dil"],
  ["Sınav hazırlık"],
  ["Etüt", "Ödev desteği"],
  ["Genel İngilizce", "IELTS"],
] as const;

/**
 * Twelve static presentation cards for the search results page (UI only).
 */
export function getStaticSearchResultInstitutions(): InstitutionCardViewData[] {
  const types = ["Anaokulu", "Kreş", "Özel Okul", "Dershane", "Etüt Merkezi", "Dil Kursu"] as const;
  const cities = [
    { city: "İstanbul", district: "Kadıköy" },
    { city: "İstanbul", district: "Beşiktaş" },
    { city: "Ankara", district: "Çankaya" },
    { city: "İzmir", district: "Karşıyaka" },
    { city: "Bursa", district: "Nilüfer" },
    { city: "Antalya", district: "Muratpaşa" },
  ] as const;
  const ratings = ["4,8", "4,6", "4,4", "4,2", "4,0", "3,9"] as const;

  return Array.from({ length: 12 }, (_, index) => {
    const typeLabel = types[index % types.length] ?? "Anaokulu";
    const location = cities[index % cities.length] ?? cities[0];
    const n = index + 1;
    const rating = ratings[index % ratings.length] ?? "4,0";
    const reviewCount = 40 + index * 17;

    return {
      id: `search-result-${n}`,
      name: `${typeLabel} Örnek ${n}`,
      href: `/institutions/ornek-kurum-${n}`,
      typeLabel,
      city: location.city,
      district: location.district,
      snippet: "Karar vermeyi kolaylaştıran kısa özet — yalnızca arayüz yer tutucusu.",
      badges: {
        verified: index % 3 === 0,
        premium: index % 4 === 0,
        featured: index % 5 === 0,
      },
      programLabels: [...(PROGRAM_SETS[index % PROGRAM_SETS.length] ?? PROGRAM_SETS[0])],
      distanceLabel:
        index % 2 === 0 ? `${(1.1 + index * 0.4).toFixed(1).replace(".", ",")} km` : undefined,
      ratingPlaceholder: rating,
      reviewCountPlaceholder: `${reviewCount} değerlendirme`,
      ctaLabel: "Detayları Gör",
    };
  });
}

/**
 * Static recommendation rail — not personalized; does not alter search ranking.
 */
export function getStaticSearchRecommendations(): InstitutionCardViewData[] {
  return getStaticSearchResultInstitutions()
    .filter((item) => item.badges?.verified || item.badges?.premium)
    .slice(0, 3);
}
