import { foldTurkishText, institutionIdAsString, type Institution } from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";

export const OUTREACH_SEARCH_LIMIT = 8;
export const OUTREACH_SEARCH_QUERY_CAP = 20;

/** Generic MEB tokens — too common for array-contains. */
const SEARCH_STOPWORDS = new Set([
  "ozel",
  "ogretim",
  "kursu",
  "kurs",
  "okul",
  "okulu",
  "kolej",
  "koleji",
  "anadolu",
  "lisesi",
  "lise",
  "merkezi",
  "merkez",
  "akademi",
  "ve",
  "the",
  "mah",
  "cad",
  "sk",
  "no",
]);

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
  const folded = foldTurkishText(query);
  if (!folded) return Object.freeze([]);
  const geo = new Set(
    [
      scope?.cityId,
      scope?.districtId,
      normalizeOutreachDistrictId(scope?.cityId, scope?.districtId),
      ...(scope?.districtId?.split("-") ?? []),
    ]
      .filter(Boolean)
      .map((value) => foldTurkishText(String(value))),
  );
  const tokens = folded
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !SEARCH_STOPWORDS.has(token))
    .filter((token) => !geo.has(token));
  if (tokens.length > 0) return Object.freeze([...new Set(tokens)]);
  const fallback = folded
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
  return Object.freeze([...new Set(fallback)]);
}

export function scoreOutreachInstitutionHit(
  query: string,
  institution: Pick<Institution, "name">,
): number {
  const foldedQuery = foldTurkishText(query);
  const foldedName = foldTurkishText(institution.name);
  if (!foldedQuery || !foldedName) return 0;
  if (foldedName === foldedQuery) return 100;
  if (foldedName.startsWith(`${foldedQuery} `) || foldedName.startsWith(foldedQuery)) return 80;
  if (foldedName.includes(foldedQuery)) return 60;
  const tokens = foldedQuery.split(" ").filter((token) => token.length >= 2);
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((token) => foldedName.includes(token)).length;
  if (hits === tokens.length) return 45;
  if (hits > 0) return 20 + hits * 5;
  return 0;
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
 * Never calls institutionRepository.list().
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

  const addAll = (rows: readonly Institution[]) => {
    documentsRead += rows.length;
    for (const institution of rows) {
      const score = scoreOutreachInstitutionHit(query, institution);
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
    const exactCity = await institutionRepository.findByExactName(query, {
      limit: OUTREACH_SEARCH_QUERY_CAP,
      ...(cityId ? { cityId } : {}),
      ...(districtId ? { districtId } : {}),
    });
    addAll(exactCity);
    if (exactCity.length === 0 && districtId && cityId) {
      const exactCityOnly = await institutionRepository.findByExactName(query, {
        limit: OUTREACH_SEARCH_QUERY_CAP,
        cityId,
      });
      addAll(exactCityOnly);
    }
    if (byId.size === 0) {
      const exactAny = await institutionRepository.findByExactName(query, {
        limit: OUTREACH_SEARCH_QUERY_CAP,
      });
      addAll(exactAny);
    }
  }

  if (institutionRepository.findBySearchKeyword) {
    const tokens = distinctiveOutreachSearchTokens(query, { cityId, districtId });
    const token = tokens[0];
    if (token) {
      const keywordCity = await institutionRepository.findBySearchKeyword(token, {
        limit: OUTREACH_SEARCH_QUERY_CAP,
        ...(cityId ? { cityId } : {}),
      });
      addAll(keywordCity);
      if (keywordCity.length === 0 && districtId) {
        const keywordDistrict = await institutionRepository.findBySearchKeyword(token, {
          limit: OUTREACH_SEARCH_QUERY_CAP,
          districtId,
        });
        addAll(keywordDistrict);
      }
      if (byId.size === 0) {
        const keywordAny = await institutionRepository.findBySearchKeyword(token, {
          limit: OUTREACH_SEARCH_QUERY_CAP,
        });
        addAll(keywordAny);
      }
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
