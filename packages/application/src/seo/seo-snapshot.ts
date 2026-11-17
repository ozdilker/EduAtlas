/**
 * GSC performance snapshot stored at `seo_snapshots/latest`.
 * Written by a controlled CLI; admin dashboard reads only.
 */

export type SeoSnapshotDateRange = Readonly<{
  readonly startDate: string;
  readonly endDate: string;
}>;

export type SeoSnapshotSummary = Readonly<{
  readonly clicks: number;
  readonly impressions: number;
  readonly ctr: number;
  readonly position: number;
}>;

export type SeoSnapshotPageRow = Readonly<{
  readonly url: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctr: number;
  readonly position: number;
}>;

export type SeoSnapshotQueryRow = Readonly<{
  readonly query: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctr: number;
  readonly position: number;
}>;

export type SeoSnapshotOpportunities = Readonly<{
  /** High impressions, low CTR pages. */
  readonly lowCtrPages: readonly SeoSnapshotPageRow[];
  /** Queries with average position between 4 and 20. */
  readonly midPositionQueries: readonly SeoSnapshotQueryRow[];
  /** Institution-path URLs that could not be matched to a catalog slug. */
  readonly unmatchedInstitutionPages: readonly SeoSnapshotPageRow[];
}>;

export type SeoSnapshot = Readonly<{
  readonly updatedAt: string;
  readonly dateRange: SeoSnapshotDateRange;
  readonly summary: SeoSnapshotSummary;
  readonly topPages: readonly SeoSnapshotPageRow[];
  readonly topQueries: readonly SeoSnapshotQueryRow[];
  readonly opportunities: SeoSnapshotOpportunities;
}>;

/** Opportunity thresholds (documented for V1). */
export const SEO_OPPORTUNITY_THRESHOLDS = Object.freeze({
  lowCtrMinImpressions: 100,
  lowCtrMaxCtr: 0.02,
  midPositionMin: 4,
  midPositionMax: 20,
  midPositionMinImpressions: 50,
  topPagesLimit: 50,
  topQueriesLimit: 50,
  opportunityLimit: 25,
});

export type CreateSeoSnapshotInput = Readonly<{
  readonly updatedAt: string;
  readonly dateRange: SeoSnapshotDateRange;
  readonly pages: readonly SeoSnapshotPageRow[];
  readonly queries: readonly SeoSnapshotQueryRow[];
}>;

function sumMetric(rows: readonly { clicks: number; impressions: number }[]): {
  clicks: number;
  impressions: number;
} {
  let clicks = 0;
  let impressions = 0;
  for (const row of rows) {
    clicks += row.clicks;
    impressions += row.impressions;
  }
  return { clicks, impressions };
}

function weightedPosition(
  rows: readonly { impressions: number; position: number }[],
): number {
  let weight = 0;
  let sum = 0;
  for (const row of rows) {
    if (row.impressions <= 0) continue;
    weight += row.impressions;
    sum += row.position * row.impressions;
  }
  return weight > 0 ? sum / weight : 0;
}

/**
 * Builds low-CTR and mid-position opportunity lists from raw GSC rows.
 */
export function buildSeoSnapshotOpportunities(input: Readonly<{
  readonly pages: readonly SeoSnapshotPageRow[];
  readonly queries: readonly SeoSnapshotQueryRow[];
  readonly unmatchedInstitutionPages?: readonly SeoSnapshotPageRow[];
}>): SeoSnapshotOpportunities {
  const lowCtrPages = input.pages
    .filter(
      (row) =>
        row.impressions >= SEO_OPPORTUNITY_THRESHOLDS.lowCtrMinImpressions &&
        row.ctr < SEO_OPPORTUNITY_THRESHOLDS.lowCtrMaxCtr,
    )
    .slice()
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, SEO_OPPORTUNITY_THRESHOLDS.opportunityLimit);

  const midPositionQueries = input.queries
    .filter(
      (row) =>
        row.impressions >= SEO_OPPORTUNITY_THRESHOLDS.midPositionMinImpressions &&
        row.position >= SEO_OPPORTUNITY_THRESHOLDS.midPositionMin &&
        row.position <= SEO_OPPORTUNITY_THRESHOLDS.midPositionMax,
    )
    .slice()
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, SEO_OPPORTUNITY_THRESHOLDS.opportunityLimit);

  return Object.freeze({
    lowCtrPages: Object.freeze([...lowCtrPages]),
    midPositionQueries: Object.freeze([...midPositionQueries]),
    unmatchedInstitutionPages: Object.freeze([
      ...(input.unmatchedInstitutionPages ?? []).slice(
        0,
        SEO_OPPORTUNITY_THRESHOLDS.opportunityLimit,
      ),
    ]),
  });
}

/**
 * Creates a frozen SEO snapshot from GSC page/query rows (no fabricated metrics).
 */
export function createSeoSnapshot(input: CreateSeoSnapshotInput): SeoSnapshot {
  const pages = input.pages
    .slice()
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, SEO_OPPORTUNITY_THRESHOLDS.topPagesLimit);
  const queries = input.queries
    .slice()
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, SEO_OPPORTUNITY_THRESHOLDS.topQueriesLimit);

  const pageTotals = sumMetric(pages);
  const queryTotals = sumMetric(queries);
  // Prefer page totals for site summary when present; else queries.
  const totals = pageTotals.impressions > 0 ? pageTotals : queryTotals;
  const positionSource = pages.length > 0 ? pages : queries;
  const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;

  return Object.freeze({
    updatedAt: input.updatedAt,
    dateRange: Object.freeze({ ...input.dateRange }),
    summary: Object.freeze({
      clicks: totals.clicks,
      impressions: totals.impressions,
      ctr,
      position: weightedPosition(positionSource),
    }),
    topPages: Object.freeze(pages.map((row) => Object.freeze({ ...row }))),
    topQueries: Object.freeze(queries.map((row) => Object.freeze({ ...row }))),
    opportunities: buildSeoSnapshotOpportunities({ pages, queries }),
  });
}
