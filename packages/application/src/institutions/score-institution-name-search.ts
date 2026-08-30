import {
  distinctiveSearchTokens,
  type DistinctiveSearchTokenScope,
  foldTurkishText,
  hasExactInstitutionSearchToken,
  hasWordBoundedPhrase,
  isInstitutionVerified,
  type InstitutionVerification,
} from "@eduatlas/domain";

export const PUBLIC_SEARCH_EXACT_CAP = 10;
export const PUBLIC_SEARCH_KEYWORD_CAP = 40;
export const PUBLIC_SEARCH_TYPICAL_MAX_READS = 50;
export const PUBLIC_SEARCH_RETRY_MAX_READS = 90;

export type InstitutionNameSearchSubject = {
  readonly name: string;
  readonly nameFolded?: string;
  readonly searchKeywords?: readonly string[];
  readonly qualityScore?: number;
  readonly verification?: InstitutionVerification;
  readonly isPremium?: boolean;
};

/**
 * Shared name-search ranker for public search and Growth Center.
 * Word-set equality only — no substring `includes` on tokens.
 */
export function scoreInstitutionNameSearch(
  query: string,
  subject: InstitutionNameSearchSubject,
  scope?: DistinctiveSearchTokenScope,
): number {
  const foldedQuery = foldTurkishText(query);
  const nameFolded = (subject.nameFolded ?? foldTurkishText(subject.name)).trim();
  if (!foldedQuery || !nameFolded) {
    return 0;
  }

  const distinctive = distinctiveSearchTokens(query, scope);
  if (distinctive.length === 0) {
    return nameFolded === foldedQuery ? withQualityAdditives(1000, subject) : 0;
  }

  const keywords = subject.searchKeywords ?? [];
  const matched = distinctive.filter((token) =>
    hasExactInstitutionSearchToken(nameFolded, keywords, token),
  );
  if (matched.length === 0) {
    return 0;
  }

  let score = 0;
  if (nameFolded === foldedQuery) {
    score = 1000;
  } else if (nameFolded.startsWith(`${foldedQuery} `)) {
    score = 800;
  } else if (hasWordBoundedPhrase(nameFolded, foldedQuery)) {
    score = 600;
  } else if (matched.length === distinctive.length) {
    score = 400 + 20 * distinctive.length;
  } else if (matched.length >= 2) {
    score = 250 + 15 * matched.length;
  } else {
    score = 100;
  }

  return withQualityAdditives(score, subject);
}

function withQualityAdditives(score: number, subject: InstitutionNameSearchSubject): number {
  if (score <= 0) {
    return 0;
  }

  let next = score + (subject.qualityScore ?? 0);
  if (subject.verification && isInstitutionVerified(subject.verification)) {
    next += 10;
  }
  if (subject.isPremium) {
    next += 5;
  }
  return next;
}
