/**
 * National geography coverage placeholders (institutions not linked yet).
 */
export type GeographyStatisticsPlaceholder = Readonly<{
  readonly cityCount: number;
  readonly districtCount: number;
  readonly priorityCityCount: number;
  readonly institutionCount: number;
  readonly publishedInstitutionCount: number;
  readonly claimedInstitutionCount: number;
  readonly coverageNote: string;
}>;

export type BuildGeographyStatisticsPlaceholderInput = {
  cityCount: number;
  districtCount: number;
  priorityCityCount: number;
};

export function buildGeographyStatisticsPlaceholder(
  input: BuildGeographyStatisticsPlaceholderInput,
): GeographyStatisticsPlaceholder {
  return Object.freeze({
    cityCount: input.cityCount,
    districtCount: input.districtCount,
    priorityCityCount: input.priorityCityCount,
    institutionCount: 0,
    publishedInstitutionCount: 0,
    claimedInstitutionCount: 0,
    coverageNote:
      "Geography-only catalog seed. Institution coverage statistics remain zero until institutions attach.",
  });
}
