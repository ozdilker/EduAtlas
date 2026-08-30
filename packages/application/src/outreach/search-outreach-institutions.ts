import {
  distinctiveSearchTokens,
  foldTurkishText,
  institutionIdAsString,
  pickInstitutionSearchProbeToken,
  type Institution,
} from "@eduatlas/domain";
import { scoreInstitutionNameSearch } from "../institutions/score-institution-name-search";
import type { InstitutionRepository } from "../institutions/institution-repository";

export const OUTREACH_SEARCH_LIMIT = 8;
export const OUTREACH_SEARCH_QUERY_CAP = 20;

export type OutreachInstitutionSearchHit = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly cityId: string;
  readonly districtId: string;
  readonly email: string;
  readonly score: number;
}>;

export type OutreachInstitutionSearchInput = Readonly<{
  readonly query: string;
  readonly cityId?: string;
  readonly districtId?: string;
  readonly limit?: number;
}>;

export type OutreachInstitutionSearchResult = Readonly<{
  readonly items: readonly OutreachInstitutionSearchHit[];
  readonly documentsRead: number;
  readonly usedList: false;
}>;

export function normalizeOutreachDistrictId(
  cityId: string | undefined,
  districtId: string | undefined,
): string | undefined {
  const city = cityId?.trim();
  const district = districtId?.trim();
  if (!district) return undefined;
  if (city && district === city) return undefined;
  if (city && !district.includes("-") && !district.startsWith(`${city}-`)) {
    return `${city}-${district}`;
  }
  return district;
}

export function distinctiveOutreachSearchTokens(
  query: string,
  scope?: { cityId?: string; districtId?: string },
): readonly string[] {
  const cityId = scope?.cityId?.trim() || undefined;
  const districtId = normalizeOutreachDistrictId(cityId, scope?.districtId);
  return distinctiveSearchTokens(query, { cityId, districtId });
}

/**
 * Growth Center matching-only generic tokens. Not shared stopwords —
 * public search and the shared ranker do not use this list.
 */
export const OUTREACH_MATCHING_GENERIC_TOKENS: ReadonlySet<string> = Object.freeze(
  new Set([
    "egitim",
    "kurumlari",
    "kurs",
    "kursu",
    "ogretim",
    "ozel",
    "akademi",
    "merkezi",
    "merkez",
    "anaokulu",
  ]),
);

export function matchingOutreachSearchTokens(
  query: string,
  scope?: { cityId?: string; districtId?: string },
): readonly string[] {
  return Object.freeze(
    distinctiveOutreachSearchTokens(query, scope).filter(
      (token) => !OUTREACH_MATCHING_GENERIC_TOKENS.has(token),
    ),
  );
}

export function pickOutreachMatchingProbeToken(
  query: string,
  scope?: { cityId?: string; districtId?: string },
): string | undefined {
  return pickInstitutionSearchProbeToken(matchingOutreachSearchTokens(query, scope));
}

export function resolveOutreachMatchSearchScope(input: {
  readonly recipientSource?: string;
  readonly recipientMatchScope?: { cityId?: string; districtId?: string };
  readonly segmentFilters?: { cityId?: string; districtId?: string };
}): { cityId?: string; districtId?: string } | null {
  const useCampaignScope =
    (input.recipientSource === "external_import" || input.recipientSource === "manual") &&
    Boolean(
      input.recipientMatchScope?.cityId?.trim() || input.recipientMatchScope?.districtId?.trim(),
    );
  const raw = useCampaignScope ? input.recipientMatchScope : input.segmentFilters;
  const cityId = raw?.cityId?.trim() || undefined;
  const districtId = normalizeOutreachDistrictId(cityId, raw?.districtId);
  if (!cityId && !districtId) return null;
  return {
    ...(cityId ? { cityId } : {}),
    ...(districtId ? { districtId } : {}),
  };
}

export function scoreOutreachInstitutionHit(
  query: string,
  institution: Pick<Institution, "name">,
  scope?: { cityId?: string; districtId?: string },
): number {
  return scoreInstitutionNameSearch(
    query,
    {
      name: institution.name,
      nameFolded: foldTurkishText(institution.name),
    },
    scope,
  );
}

function toHit(institution: Institution, score: number): OutreachInstitutionSearchHit {
  return Object.freeze({
    id: institutionIdAsString(institution.id),
    name: institution.name,
    cityId: institution.location.cityId,
    districtId: institution.location.districtId,
    email: institution.contact.email ?? "",
    score,
  });
}

/**
 * Bounded admin institution search for outreach matching.
 * Never calls institutionRepository.list(). Search hits do not persist institutionId.
 */
export async function searchOutreachInstitutions(
  input: OutreachInstitutionSearchInput,
  institutionRepository: InstitutionRepository,
): Promise<OutreachInstitutionSearchResult> {
  const query = input.query.trim();
  const limit = Math.min(
    OUTREACH_SEARCH_LIMIT,
    Math.max(1, input.limit ?? OUTREACH_SEARCH_LIMIT),
  );
  const cityId = input.cityId?.trim() || undefined;
  const districtId = normalizeOutreachDistrictId(cityId, input.districtId);
  let documentsRead = 0;
  const byId = new Map<string, OutreachInstitutionSearchHit>();
  const geoScope = { cityId, districtId };

  const addAll = (rows: readonly Institution[]) => {
    documentsRead += rows.length;
    for (const institution of rows) {
      const score = scoreOutreachInstitutionHit(query, institution, geoScope);
      const hit = toHit(institution, score);
      const existing = byId.get(hit.id);
      if (!existing || hit.score > existing.score) {
        byId.set(hit.id, hit);
      }
    }
  };

  if (!query || query.length < 2) {
    return Object.freeze({ items: [], documentsRead: 0, usedList: false as const });
  }

  if (query.includes("@") && institutionRepository.findByContactEmail) {
    const byEmail = await institutionRepository.findByContactEmail(query, {
      limit: OUTREACH_SEARCH_QUERY_CAP,
    });
    addAll(byEmail);
  }

  if (institutionRepository.findByExactName) {
    const exactScoped = await institutionRepository.findByExactName(query, {
      limit: OUTREACH_SEARCH_QUERY_CAP,
      ...(cityId ? { cityId } : {}),
      ...(districtId ? { districtId } : {}),
    });
    addAll(exactScoped);
    if (byId.size === 0 && !cityId && !districtId) {
      const exactAny = await institutionRepository.findByExactName(query, {
        limit: OUTREACH_SEARCH_QUERY_CAP,
      });
      addAll(exactAny);
    }
  }

  const probe = pickOutreachMatchingProbeToken(query, { cityId, districtId });
  if (probe && institutionRepository.findBySearchKeyword && (cityId || districtId)) {
    if (districtId) {
      const keywordDistrict = await institutionRepository.findBySearchKeyword(probe, {
        limit: OUTREACH_SEARCH_QUERY_CAP,
        districtId,
      });
      addAll(keywordDistrict);
    } else if (cityId) {
      const keywordCity = await institutionRepository.findBySearchKeyword(probe, {
        limit: OUTREACH_SEARCH_QUERY_CAP,
        cityId,
      });
      addAll(keywordCity);
    }
  }

  const items = [...byId.values()]
    .filter((hit) => hit.score > 0 || query.includes("@"))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "tr"))
    .slice(0, limit);

  return Object.freeze({
    items: Object.freeze(items),
    documentsRead,
    usedList: false as const,
  });
}
