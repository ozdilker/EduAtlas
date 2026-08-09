import type { InstitutionRepository } from "@eduatlas/application";
import {
  createEmptyInstitutionRepository,
  resolveGeoLabels,
} from "@eduatlas/firebase/server";
import type { InstitutionCardViewData } from "@eduatlas/ui";
import { getInstitutionRepository } from "./repository";
import { toInstitutionCardView } from "./to-profile-view";

export const PUBLIC_INSTITUTIONS_BROWSE_PAGE_SIZE = 24;

export type PublicInstitutionsBrowseView = Readonly<{
  readonly institutions: readonly InstitutionCardViewData[];
  readonly totalCount: number;
  readonly pageSize: number;
  readonly nextCursor: string | null;
}>;

function isQuotaOrUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "8" ||
    /RESOURCE_EXHAUSTED|Quota exceeded|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(`${code} ${message}`)
  );
}

/**
 * Public /institutions index — bounded Firestore browse (no listAll / full catalog).
 * Optional cursor uses Firestore startAfter semantics via the repository adapter.
 */
export async function listPublicInstitutionsBrowse(options?: {
  pageSize?: number;
  cursor?: string | null;
  repository?: InstitutionRepository;
}): Promise<PublicInstitutionsBrowseView> {
  const pageSize = options?.pageSize ?? PUBLIC_INSTITUTIONS_BROWSE_PAGE_SIZE;
  const primary = options?.repository ?? (await getInstitutionRepository());

  const load = async (repo: InstitutionRepository) => {
    if (!repo.listPublishedBrowsePage) {
      throw new Error(
        "InstitutionRepository.listPublishedBrowsePage is required for /institutions browse.",
      );
    }
    return repo.listPublishedBrowsePage({
      pageSize,
      cursor: options?.cursor ?? null,
    });
  };

  let page;
  try {
    page = await load(primary);
  } catch (error) {
    if (!isQuotaOrUnavailableError(error)) {
      throw error;
    }
    console.warn(
      "[eduatlas] Public institutions browse fell back to empty local store after backend failure:",
      error instanceof Error ? error.message : error,
    );
    page = await load(await createEmptyInstitutionRepository());
  }

  const institutions = page.items.map((institution) =>
    toInstitutionCardView(
      institution,
      resolveGeoLabels(institution.location.cityId, institution.location.districtId),
    ),
  );

  return Object.freeze({
    institutions: Object.freeze(institutions),
    totalCount: page.totalPublished,
    pageSize: page.pageSize,
    nextCursor: page.nextCursor,
  });
}
