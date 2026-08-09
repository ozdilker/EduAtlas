import type {
  Institution,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
} from "@eduatlas/domain";

/**
 * Firestore-backed admin list sort modes (orderBy before limit).
 * Maps to existing admin UI defaults (published = name asc, review = newest).
 */
export type InstitutionAdminListSort =
  | "name_asc"
  | "name_desc"
  | "created_desc"
  | "quality_desc"
  | "quality_asc";

/**
 * Equality filters applied in Firestore before limit/count.
 * Free-text `query` is intentionally excluded — substring search is a separate path.
 */
export type InstitutionAdminListFilters = Readonly<{
  readonly status?: InstitutionStatus;
  readonly cityId?: string;
  readonly districtId?: string;
  readonly primaryType?: InstitutionType;
  readonly verification?: InstitutionVerification;
  /** Firestore `in` on claimStatus (mapped from verification). Max 10 values. */
  readonly verifications?: readonly InstitutionVerification[];
  readonly isPremium?: boolean;
  /** Inclusive lower bound on stored qualityScore. */
  readonly qualityScoreMin?: number;
  /** Exclusive upper bound on stored qualityScore. */
  readonly qualityScoreMaxExclusive?: number;
}>;

export type InstitutionAdminListPageInput = Readonly<{
  readonly filters?: InstitutionAdminListFilters;
  readonly sort?: InstitutionAdminListSort;
  readonly pageSize: number;
  readonly cursor?: string | null;
}>;

/**
 * Bounded admin institution page — never a full-catalog download.
 */
export type InstitutionAdminListPage = Readonly<{
  readonly items: readonly Institution[];
  readonly pageSize: number;
  readonly nextCursor: string | null;
  readonly hasNextPage: boolean;
  readonly totalItems: number;
}>;
