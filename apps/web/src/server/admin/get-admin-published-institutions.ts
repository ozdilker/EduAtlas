import {
  ADMIN_FREE_TEXT_SEARCH_LOCATION_REQUIRED_MESSAGE,
  calculateInstitutionQuality,
  InstitutionSort,
  isUnscopedAdminFreeTextQuery,
} from "@eduatlas/application";
import { cityIdAsString, InstitutionStatus, institutionIdAsString } from "@eduatlas/domain";
import { buildTurkeyGeographySeedCatalog, resolveGeoLabels } from "@eduatlas/firebase/server";
import {
  ADMIN_PUBLISHED_PAGE_SIZE,
  type AdminPublishedInstitutionsViewData,
  buildAdminPublishedPageNumbers,
} from "@eduatlas/ui";
import { getInstitutionRepository } from "../institutions/repository";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";

export type PublishedSearchParams = {
  cityId?: string | string[];
  q?: string | string[];
  page?: string | string[];
  cursor?: string | string[];
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function parsePage(raw: string): number {
  const value = Number.parseInt(raw || "1", 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function formatPublishedAt(value: string | undefined): string {
  if (!value) {
    return "—";
  }
  try {
    return new Date(value).toLocaleString("tr-TR");
  } catch {
    return value;
  }
}

function emptyView(input: {
  cityId: string;
  query: string;
  cities: AdminPublishedInstitutionsViewData["cities"];
  subtitle?: string;
  emptyMessage: string;
  locationRequired?: boolean;
}): AdminPublishedInstitutionsViewData {
  return {
    title: "Yayındaki kurumlar",
    subtitle:
      input.subtitle ??
      "İçe aktarılan ve yayına alınan kurumları il il filtreleyerek kontrol edin. Bu liste Firebase’deki published kayıtları gösterir.",
    totalCount: 0,
    filteredCount: 0,
    query: input.query,
    cityId: input.cityId,
    cities: input.cities,
    rows: [],
    emptyMessage: input.emptyMessage,
    ...(input.locationRequired ? { locationRequired: true } : {}),
    pagination: {
      page: 1,
      pageSize: ADMIN_PUBLISHED_PAGE_SIZE,
      totalPages: 1,
      totalItems: 0,
      from: 0,
      to: 0,
      pageNumbers: [1],
      nextCursor: null,
      cursor: null,
      hasNextPage: false,
    },
  };
}

/**
 * Lists published institutions for admin verification (import checks + city filter).
 * Bounded Firestore pagination + count aggregation — never downloads the full catalog
 * unless free-text search (`q`) is active (substring correctness; separate follow-up).
 */
export async function getAdminPublishedInstitutionsView(
  searchParams: PublishedSearchParams = {},
): Promise<AdminPublishedInstitutionsViewData> {
  const cityId = firstParam(searchParams.cityId).trim();
  const query = firstParam(searchParams.q).trim();
  const cursor = firstParam(searchParams.cursor).trim();
  const requestedPage = cursor ? parsePage(firstParam(searchParams.page)) : 1;

  const catalog = buildTurkeyGeographySeedCatalog();
  const cities = catalog.cities
    .map((city) => ({
      id: cityIdAsString(city.id),
      label: city.nameTr,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));

  const institutionRepository = await getInstitutionRepository();

  // Free-text substring search cannot be applied after limit(50) without wrong results.
  // Keep legacy list() only for scoped q; unscoped q never calls list()/listAll().
  if (query) {
    if (isUnscopedAdminFreeTextQuery(query, { cityId })) {
      return emptyView({
        cityId,
        query,
        cities,
        emptyMessage: ADMIN_FREE_TEXT_SEARCH_LOCATION_REQUIRED_MESSAGE,
        locationRequired: true,
      });
    }
    return loadPublishedWithLegacySearch({
      institutionRepository,
      cityId,
      query,
      requestedPage: parsePage(firstParam(searchParams.page)),
      cities,
    });
  }

  if (!institutionRepository.listAdminPage || !institutionRepository.countAdmin) {
    return emptyView({
      cityId,
      query,
      cities,
      emptyMessage: "Yayınlı kurum listesi alınamadı. Admin sayfalama adaptörü yapılandırılmamış.",
    });
  }

  const filters = {
    status: InstitutionStatus.Published,
    ...(cityId ? { cityId } : {}),
  };

  let pageResult: Awaited<ReturnType<NonNullable<(typeof institutionRepository)["listAdminPage"]>>>;
  let totalCount = 0;
  try {
    const [listed, publishedTotal] = await Promise.all([
      institutionRepository.listAdminPage({
        pageSize: ADMIN_PUBLISHED_PAGE_SIZE,
        sort: "name_asc",
        cursor: cursor || null,
        filters,
      }),
      institutionRepository.countAdmin({ status: InstitutionStatus.Published }),
    ]);
    pageResult = listed;
    totalCount = publishedTotal;
  } catch (error) {
    console.error(
      "[eduatlas] getAdminPublishedInstitutionsView bounded list failed:",
      error instanceof Error ? error.message : error,
    );
    return emptyView({
      cityId,
      query,
      cities,
      subtitle:
        "Firebase’deki yayınlı kurumları il bazında kontrol edin. Liste yüklenemedi — kota veya bağlantı hatası olabilir.",
      emptyMessage:
        "Yayınlı kurum listesi alınamadı. Firestore kotasını veya Admin bağlantısını kontrol edin.",
    });
  }

  const filteredCount = pageResult.totalItems;
  const totalPages = Math.max(1, Math.ceil(filteredCount / ADMIN_PUBLISHED_PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  const rows = pageResult.items.map((item) => {
    const geo = resolveGeoLabels(item.location.cityId, item.location.districtId);
    const id = institutionIdAsString(item.id);
    const qualityScore = calculateInstitutionQuality({ institution: item }).quality.score;
    return {
      id,
      name: item.name,
      slug: item.slug,
      typeLabel: getInstitutionTypeLabel(item.primaryType),
      cityId: item.location.cityId,
      cityLabel: geo.cityName,
      districtId: item.location.districtId,
      districtLabel: geo.districtName,
      statusLabel: "Yayında",
      qualityScore,
      publishedAtLabel: formatPublishedAt(item.publishedAt),
      publicHref: `/institutions/${item.slug}`,
      profileHref: `/admin/review?queue=published&selected=${encodeURIComponent(id)}`,
    };
  });

  const from =
    filteredCount === 0 || rows.length === 0 ? 0 : (page - 1) * ADMIN_PUBLISHED_PAGE_SIZE + 1;
  const to =
    filteredCount === 0 || rows.length === 0
      ? 0
      : Math.min((page - 1) * ADMIN_PUBLISHED_PAGE_SIZE + rows.length, filteredCount);

  const emptyMessage =
    totalCount === 0
      ? "Henüz yayında kurum yok. Excel içe aktarma sonrası burada görünmeleri gerekir. Kota hatası aldıysanız kurumlar kaydedilmemiş olabilir."
      : cityId
        ? "Bu filtreyle eşleşen yayındaki kurum yok."
        : "Yayındaki kurum bulunamadı.";

  return {
    title: "Yayındaki kurumlar",
    subtitle:
      "İçe aktarılan ve yayına alınan kurumları il il filtreleyerek kontrol edin. Bu liste Firebase’deki published kayıtları gösterir.",
    totalCount,
    filteredCount,
    query,
    cityId,
    cities,
    rows,
    emptyMessage,
    pagination: {
      page,
      pageSize: ADMIN_PUBLISHED_PAGE_SIZE,
      totalPages,
      totalItems: filteredCount,
      from,
      to,
      pageNumbers: buildAdminPublishedPageNumbers(page, totalPages),
      nextCursor: pageResult.nextCursor,
      cursor: cursor || null,
      hasNextPage: pageResult.hasNextPage,
    },
  };
}

async function loadPublishedWithLegacySearch(input: {
  institutionRepository: Awaited<ReturnType<typeof getInstitutionRepository>>;
  cityId: string;
  query: string;
  requestedPage: number;
  cities: AdminPublishedInstitutionsViewData["cities"];
}): Promise<AdminPublishedInstitutionsViewData> {
  const { cityId, query, requestedPage, cities, institutionRepository } = input;

  let totalCount = 0;
  try {
    if (institutionRepository.countAdmin) {
      totalCount = await institutionRepository.countAdmin({
        status: InstitutionStatus.Published,
      });
    }
  } catch {
    totalCount = 0;
  }

  let listed: Awaited<ReturnType<(typeof institutionRepository)["list"]>>;
  try {
    listed = await institutionRepository.list({
      page: requestedPage,
      pageSize: ADMIN_PUBLISHED_PAGE_SIZE,
      sort: InstitutionSort.NameAsc,
      filters: {
        status: InstitutionStatus.Published,
        ...(cityId ? { cityId } : {}),
        query,
      },
    });
  } catch (error) {
    console.error(
      "[eduatlas] getAdminPublishedInstitutionsView legacy search failed:",
      error instanceof Error ? error.message : error,
    );
    return emptyView({
      cityId,
      query,
      cities,
      emptyMessage:
        "Yayınlı kurum araması alınamadı. Firestore kotasını veya Admin bağlantısını kontrol edin.",
    });
  }

  const filteredCount = listed.totalItems;
  const totalPages = Math.max(1, Math.ceil(filteredCount / ADMIN_PUBLISHED_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const rows = listed.items.map((item) => {
    const geo = resolveGeoLabels(item.location.cityId, item.location.districtId);
    const id = institutionIdAsString(item.id);
    const qualityScore = calculateInstitutionQuality({ institution: item }).quality.score;
    return {
      id,
      name: item.name,
      slug: item.slug,
      typeLabel: getInstitutionTypeLabel(item.primaryType),
      cityId: item.location.cityId,
      cityLabel: geo.cityName,
      districtId: item.location.districtId,
      districtLabel: geo.districtName,
      statusLabel: "Yayında",
      qualityScore,
      publishedAtLabel: formatPublishedAt(item.publishedAt),
      publicHref: `/institutions/${item.slug}`,
      profileHref: `/admin/review?queue=published&selected=${encodeURIComponent(id)}`,
    };
  });

  const from = filteredCount === 0 ? 0 : (page - 1) * ADMIN_PUBLISHED_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_PUBLISHED_PAGE_SIZE, filteredCount);

  return {
    title: "Yayındaki kurumlar",
    subtitle:
      "İçe aktarılan ve yayına alınan kurumları il il filtreleyerek kontrol edin. Bu liste Firebase’deki published kayıtları gösterir.",
    totalCount,
    filteredCount,
    query,
    cityId,
    cities,
    rows,
    emptyMessage: "Bu filtreyle eşleşen yayındaki kurum yok.",
    usedLegacySearchScan: true,
    pagination: {
      page,
      pageSize: ADMIN_PUBLISHED_PAGE_SIZE,
      totalPages,
      totalItems: filteredCount,
      from,
      to,
      pageNumbers: buildAdminPublishedPageNumbers(page, totalPages),
      nextCursor: null,
      cursor: null,
      hasNextPage: page < totalPages,
    },
  };
}
