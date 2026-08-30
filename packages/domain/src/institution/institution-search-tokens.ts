import { INSTITUTION_SEARCH_STOPWORDS } from "./institution-search-stopwords";
import { foldTurkishText, tokenizeSearchKeywords } from "./validation";

export type DistinctiveSearchTokenScope = {
  readonly cityId?: string;
  readonly districtId?: string;
};

/**
 * True when the (possibly unfolded) token is a search stopword.
 */
export function isInstitutionSearchStopword(value: string): boolean {
  const folded = foldTurkishText(value);
  return folded.length > 0 && INSTITUTION_SEARCH_STOPWORDS.has(folded);
}

/**
 * Index-time keywords from the institution name only.
 * Does not index address, phone, geo labels, or MEB/numeric codes.
 */
export function tokenizeInstitutionSearchKeywords(name: string): readonly string[] {
  return Object.freeze(tokenizeSearchKeywords(name));
}

export function computeInstitutionSearchIndexFields(name: string): Readonly<{
  readonly nameFolded: string;
  readonly searchKeywords: readonly string[];
}> {
  return Object.freeze({
    nameFolded: foldTurkishText(name),
    searchKeywords: tokenizeInstitutionSearchKeywords(name),
  });
}

/**
 * Query-time distinctive tokens. Never falls back to stopwords.
 * Drops geo fragments copied from active city/district filters.
 */
export function distinctiveSearchTokens(
  query: string,
  scope?: DistinctiveSearchTokenScope,
): readonly string[] {
  const folded = foldTurkishText(query);
  if (!folded) {
    return Object.freeze([]);
  }

  const geo = geoTokensFromScope(scope);
  const tokens = folded
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => isIndexableSearchToken(token))
    .filter((token) => !geo.has(token));

  return Object.freeze([...new Set(tokens)]);
}

/**
 * One Firestore array-contains probe: longest token, then lexicographic.
 */
export function pickInstitutionSearchProbeToken(
  tokens: readonly string[],
): string | undefined {
  if (tokens.length === 0) {
    return undefined;
  }

  return [...tokens].sort((left, right) => right.length - left.length || left.localeCompare(right))[0];
}

export function institutionNameWords(nameFolded: string): readonly string[] {
  return nameFolded.split(" ").filter(Boolean);
}

export function hasExactInstitutionSearchToken(
  nameFolded: string,
  searchKeywords: readonly string[],
  token: string,
): boolean {
  if (institutionNameWords(nameFolded).includes(token)) {
    return true;
  }

  return searchKeywords.some((keyword) => foldTurkishText(keyword) === token);
}

export function hasWordBoundedPhrase(nameFolded: string, phrase: string): boolean {
  if (!phrase) {
    return false;
  }

  return ` ${nameFolded} `.includes(` ${phrase} `);
}

export function isIndexableSearchToken(token: string): boolean {
  if (token.length < 3) {
    return false;
  }

  if (/^\d+$/.test(token)) {
    return false;
  }

  return !INSTITUTION_SEARCH_STOPWORDS.has(token);
}

function geoTokensFromScope(scope?: DistinctiveSearchTokenScope): Set<string> {
  const geo = new Set<string>();
  if (!scope) {
    return geo;
  }

  for (const raw of [scope.cityId, scope.districtId]) {
    const value = raw?.trim();
    if (!value) {
      continue;
    }

    const foldedWhole = foldTurkishText(value);
    if (foldedWhole) {
      geo.add(foldedWhole);
    }

    for (const part of value.split(/[-_]/)) {
      const foldedPart = foldTurkishText(part);
      if (foldedPart) {
        geo.add(foldedPart);
      }
    }
  }

  return geo;
}
