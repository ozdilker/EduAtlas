/**
 * GA4 institution_view performance snapshot stored at `ga4_snapshots/latest`.
 * Written by a controlled CLI; admin dashboard reads only.
 */

export type Ga4SnapshotDateRange = Readonly<{
  readonly startDate: string;
  readonly endDate: string;
}>;

export type Ga4InstitutionViewRow = Readonly<{
  readonly institutionId: string;
  readonly eventCount: number;
}>;

export type Ga4SnapshotSummary = Readonly<{
  readonly totalInstitutionViews: number;
  readonly distinctInstitutionIds: number;
}>;

export type Ga4Snapshot = Readonly<{
  readonly updatedAt: string;
  readonly dateRange: Ga4SnapshotDateRange;
  readonly summary: Ga4SnapshotSummary;
  readonly topInstitutionViews: readonly Ga4InstitutionViewRow[];
}>;

export const GA4_SNAPSHOT_LIMITS = Object.freeze({
  topInstitutionViews: 50,
  dashboardTopViews: 20,
});

export type CreateGa4SnapshotInput = Readonly<{
  readonly updatedAt: string;
  readonly dateRange: Ga4SnapshotDateRange;
  readonly institutionViews: readonly Ga4InstitutionViewRow[];
}>;

/**
 * Creates a frozen GA4 snapshot from institution_view rows (no fabricated metrics).
 */
export function createGa4Snapshot(input: CreateGa4SnapshotInput): Ga4Snapshot {
  const rows = input.institutionViews
    .filter((row) => row.institutionId.trim() && row.eventCount > 0)
    .map((row) =>
      Object.freeze({
        institutionId: row.institutionId.trim(),
        eventCount: row.eventCount,
      }),
    )
    .sort((a, b) => b.eventCount - a.eventCount || a.institutionId.localeCompare(b.institutionId))
    .slice(0, GA4_SNAPSHOT_LIMITS.topInstitutionViews);

  const totalInstitutionViews = rows.reduce((sum, row) => sum + row.eventCount, 0);

  return Object.freeze({
    updatedAt: input.updatedAt,
    dateRange: Object.freeze({ ...input.dateRange }),
    summary: Object.freeze({
      totalInstitutionViews,
      distinctInstitutionIds: rows.length,
    }),
    topInstitutionViews: Object.freeze(rows),
  });
}
