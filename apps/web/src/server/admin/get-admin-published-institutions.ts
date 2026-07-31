import { InstitutionSort } from "@eduatlas/application";
import {
  cityIdAsString,
  InstitutionStatus,
  institutionIdAsString,
} from "@eduatlas/domain";
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

function emptyView(
  input: {
    cityId: string;
    query: string;
    cities: AdminPublishedInstitutionsViewData["cities"];
    subtitle?: string;
    emptyMessage: string;
  },
): AdminPublishedInstitutionsViewData {
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
    pagination: {
      page: 1,
      pageSize: ADMIN_PUBLISHED_PAGE_SIZE,
      totalPages: 1,
      totalItems: 0,
      from: 0,
      to: 0,
      pageNumbers: [1],
    },
  };
}

/**
 * Lists published institutions for admin verification (import checks + city filter).
 * Server-paginated — full catalog can exceed 7k rows.
 */
export async function getAdminPublishedInstitutionsView(
  searchParams: PublishedSearchParams = {},
): Promise<AdminPublishedInstitutionsViewData> {
  const cityId = firstParam(searchParams.cityId).trim();
  const query = firstParam(searchParams.q).trim();
  const requestedPage = parsePage(firstParam(searchParams.page));

  const catalog = buildTurkeyGeographySeedCatalog();
  const cities = catalog.cities
    .map((city) => ({
      id: cityIdAsString(city.id),
      label: city.nameTr,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));

  const institutionRepository = await getInstitutionRepository();

  let totalCount = 0;
  try {
    const totals = await institutionRepository.list({
      page: 1,
      pageSize: 1,
      filters: { status: InstitutionStatus.Published },
    });
    totalCount = totals.totalItems;
  } catch (error) {
    console.error(
      "[eduatlas] getAdminPublishedInstitutionsView total count failed:",
      error instanceof Error ? error.message : error,
    );
  }

  let listed;
  try {
    listed = await institutionRepository.list({
      page: requestedPage,
      pageSize: ADMIN_PUBLISHED_PAGE_SIZE,
      sort: InstitutionSort.NameAsc,
      filters: {
        status: InstitutionStatus.Published,
        ...(cityId ? { cityId } : {}),
        ...(query ? { query } : {}),
      },
    });
  } catch (error) {
    console.error(
      "[eduatlas] getAdminPublishedInstitutionsView list failed:",
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

  const filteredCount = listed.totalItems;
  const totalPages = Math.max(1, Math.ceil(filteredCount / ADMIN_PUBLISHED_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  // If the URL page is past the end (e.g. after filters), re-fetch the last page.
  if (page !== requestedPage && filteredCount > 0) {
    listed = await institutionRepository.list({
      page,
      pageSize: ADMIN_PUBLISHED_PAGE_SIZE,
      sort: InstitutionSort.NameAsc,
      filters: {
        status: InstitutionStatus.Published,
        ...(cityId ? { cityId } : {}),
        ...(query ? { query } : {}),
      },
    });
  }

  const rows = listed.items.map((item) => {
    const geo = resolveGeoLabels(item.location.cityId, item.location.districtId);
    const id = institutionIdAsString(item.id);
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
      qualityScore: item.qualityScore,
      publishedAtLabel: formatPublishedAt(item.publishedAt),
      publicHref: `/institutions/${item.slug}`,
      profileHref: `/admin/review?queue=published&selected=${encodeURIComponent(id)}`,
    };
  });

  const from = filteredCount === 0 ? 0 : (page - 1) * ADMIN_PUBLISHED_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_PUBLISHED_PAGE_SIZE, filteredCount);

  const emptyMessage =
    totalCount === 0
      ? "Henüz yayında kurum yok. Excel içe aktarma sonrası burada görünmeleri gerekir. Kota hatası aldıysanız kurumlar kaydedilmemiş olabilir."
      : cityId || query
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
    },
  };
}
