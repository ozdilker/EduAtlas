import {
  getInstitutionAcquisitionDashboard,
  getInstitutionReviewQueue,
} from "@eduatlas/application";
import { InstitutionStatus, institutionIdAsString } from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import {
  ADMIN_OPERATIONS_QUICK_ACTIONS,
  type AdminOperationsViewData,
  adminOperationsPercent,
  getAdminAcquisitionStatusLabel,
} from "@eduatlas/ui";
import { getInstitutionRepository } from "../institutions/repository";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";

const TOP_BUCKET_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 8;
const LATEST_PUBLISHED_LIMIT = 5;

/**
 * Data Operations Workspace view — pure composition of the existing
 * acquisition and review application services. No new business logic,
 * no repository changes, no mutations.
 */
export async function getAdminOperationsView(): Promise<AdminOperationsViewData> {
  const institutionRepository = await getInstitutionRepository();
  const deps = {
    institutionRepository,
    resolveCityLabel: (id: string) => resolveGeoLabels(id, "dist_unknown").cityName,
    resolveDistrictLabel: (cId: string, dId: string) => resolveGeoLabels(cId, dId).districtName,
  };

  const recentSamplePromise = institutionRepository.listAdminPage
    ? institutionRepository.listAdminPage({
        pageSize: RECENT_ACTIVITY_LIMIT,
        sort: "created_desc",
        // Equality filter uses existing lifecycleStatus+createdAt index (bare createdAt+__name__ is unavailable).
        filters: { status: InstitutionStatus.Published },
      })
    : Promise.resolve({ items: [] as const });
  const publishedSamplePromise = institutionRepository.listAdminPage
    ? institutionRepository.listAdminPage({
        pageSize: LATEST_PUBLISHED_LIMIT,
        sort: "created_desc",
        filters: { status: InstitutionStatus.Published },
      })
    : Promise.resolve({ items: [] as const });

  const [acquisition, review, recentSample, publishedSample] = await Promise.all([
    getInstitutionAcquisitionDashboard(
      { queue: "all", lightweight: true },
      { ...deps, resolveTypeLabel: getInstitutionTypeLabel },
    ),
    getInstitutionReviewQueue({ queue: "draft" }, deps),
    recentSamplePromise,
    publishedSamplePromise,
  ]);

  const total = acquisition.statistics.totalInstitutions;
  const quality = acquisition.statistics.qualityDistribution;
  const queueCounts = acquisition.statistics.queueCounts;

  const dateFormat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });
  const dateTimeFormat = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const recentActivity = recentSample.items.map((institution) =>
    Object.freeze({
      id: institutionIdAsString(institution.id),
      name: institution.name,
      statusLabel: getAdminAcquisitionStatusLabel(institution.status),
      updatedAtLabel: dateTimeFormat.format(new Date(institution.updatedAt)),
      href: `/admin/review?selected=${encodeURIComponent(institutionIdAsString(institution.id))}`,
    }),
  );

  const latestPublished = publishedSample.items.map((institution) =>
    Object.freeze({
      id: institutionIdAsString(institution.id),
      name: institution.name,
      cityLabel: resolveGeoLabels(institution.location.cityId, "dist_unknown").cityName,
      publishedAtLabel: dateFormat.format(
        new Date(institution.publishedAt ?? institution.updatedAt),
      ),
      href: `/institutions/${institution.slug}`,
    }),
  );

  const pendingClaims = Math.max(0, queueCounts.claimed - queueCounts.verified);

  return Object.freeze({
    title: "Veri operasyonları",
    subtitle:
      "Kurum verisi yaşam döngüsü için tek operasyonel çalışma alanı. Salt okunur pano — otomasyon ve AI yoktur.",
    generatedAtLabel: dateTimeFormat.format(new Date(acquisition.generatedAt)),
    health: Object.freeze({
      averageQuality: quality.averageScore,
      draftCount: review.queueCounts.draft,
      publishedCount: review.queueCounts.published,
      claimRatePercent: acquisition.statistics.claimRatePercent,
      duplicateRatePercent: adminOperationsPercent(queueCounts.duplicates, total),
    }),
    acquisition: Object.freeze({
      totalInstitutions: total,
      claimRatePercent: acquisition.statistics.claimRatePercent,
      verificationRatePercent: acquisition.statistics.verificationRatePercent,
      topCities: acquisition.statistics.byCity.slice(0, TOP_BUCKET_LIMIT),
      topTypes: acquisition.statistics.byType.slice(0, TOP_BUCKET_LIMIT),
    }),
    importQueue: Object.freeze({
      draftCount: review.queueCounts.draft,
      readyForReviewCount: review.queueCounts.ready,
    }),
    reviewQueue: Object.freeze({
      draft: review.queueCounts.draft,
      needsReview: review.queueCounts.needs_review,
      ready: review.queueCounts.ready,
      published: review.queueCounts.published,
      rejected: review.queueCounts.rejected,
    }),
    published: Object.freeze({
      count: review.queueCounts.published,
      latest: Object.freeze(latestPublished),
    }),
    quality: Object.freeze({
      averageScore: quality.averageScore,
      low: quality.low,
      medium: quality.medium,
      healthy: quality.healthy,
      excellent: quality.excellent,
      byGrade: quality.byGrade,
    }),
    claims: Object.freeze({
      claimedCount: queueCounts.claimed,
      verifiedCount: queueCounts.verified,
      pendingCount: pendingClaims,
      unclaimedCount: Math.max(0, total - queueCounts.claimed),
      claimRatePercent: acquisition.statistics.claimRatePercent,
      verificationRatePercent: acquisition.statistics.verificationRatePercent,
    }),
    recentActivity: Object.freeze(recentActivity),
    quickActions: ADMIN_OPERATIONS_QUICK_ACTIONS,
  });
}
