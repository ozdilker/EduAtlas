import type { InstitutionStatus, InstitutionType, InstitutionVerification } from "@eduatlas/domain";

/**
 * Seed vertical labels (includes future university).
 */
export type InstitutionSeedType = InstitutionType | "university";

/**
 * Development seed record for an institution.
 * Richer than the domain aggregate so search keywords and future flags can live here.
 */
export type InstitutionSeedRecord = Readonly<{
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly type: InstitutionSeedType;
  readonly city: string;
  readonly cityId: string;
  readonly district: string;
  readonly districtId: string;
  readonly verification: InstitutionVerification;
  readonly status: InstitutionStatus;
  readonly published: boolean;
  readonly contact: Readonly<{
    readonly phone?: string;
    readonly email?: string;
    readonly whatsappNumber?: string;
  }>;
  readonly location: Readonly<{
    readonly address: string;
    readonly locationNotes?: string;
    readonly latitude?: number;
    readonly longitude?: number;
  }>;
  readonly searchKeywords: readonly string[];
  readonly shortDescription: string;
  readonly programsSummary?: string;
  readonly ageOrLevelFocus?: string;
  readonly websiteUrl?: string;
  readonly isPremium?: boolean;
  readonly qualityScore?: number;
  /** Marks reserved university vertical entries (SEARCH-ARCHITECTURE future). */
  readonly futureUniversity?: boolean;
}>;

export type InstitutionSeedValidationIssue = Readonly<{
  readonly code: string;
  readonly message: string;
  readonly seedId?: string;
}>;

export type InstitutionSeedValidationResult = Readonly<{
  readonly ok: boolean;
  readonly issues: readonly InstitutionSeedValidationIssue[];
}>;

export const SEED_CITIES = ["Ankara", "İstanbul", "İzmir", "Bursa", "Konya"] as const;

export type SeedCityName = (typeof SEED_CITIES)[number];
