import {
  createAiWorkforceOrchestrator,
  getInstitutionAcquisitionDashboard,
  summarizeAiWorkforceFoundation,
} from "@eduatlas/application";
import {
  ClaimRequestStatus,
  InstitutionStatus,
  institutionIdAsString,
  RecommendationPriority,
  RecommendationType,
} from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import {
  ADMIN_OVERVIEW_QUICK_ACTIONS,
  type AdminOverviewAiRecommendationView,
  type AdminOverviewViewData,
  getAdminAcquisitionStatusLabel,
} from "@eduatlas/ui";
import { getClaimRequestRepository } from "../claims/claim-request-repository";
import { getInstitutionRepository } from "../institutions/repository";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";

const ACTIVITY_LIMIT = 6;
const AI_LIMIT = 8;

/**
 * Admin Overview landing view — pure composition of existing acquisition,
 * claim_requests, and AI workforce foundation services.
 * Status badge counts use Firestore count aggregation when available (no second full catalog read).
 */
export async function getAdminOverviewView(): Promise<AdminOverviewViewData> {
  const [institutionRepository, claimRequestRepository] = await Promise.all([
    getInstitutionRepository(),
    getClaimRequestRepository(),
  ]);
  const deps = {
    institutionRepository,
    resolveCityLabel: (id: string) => resolveGeoLabels(id, "dist_unknown").cityName,
    resolveDistrictLabel: (cId: string, dId: string) => resolveGeoLabels(cId, dId).districtName,
  };

  const statusCountsPromise = institutionRepository.countAdmin
    ? Promise.all([
        institutionRepository.countAdmin({ status: InstitutionStatus.Draft }),
        institutionRepository.countAdmin({ status: InstitutionStatus.PendingReview }),
        institutionRepository.countAdmin({ status: InstitutionStatus.Published }),
      ]).then(([draftCount, pendingReviewCount, publishedCount]) => ({
        draftCount,
        pendingReviewCount,
        publishedCount,
      }))
    : Promise.resolve({ draftCount: 0, pendingReviewCount: 0, publishedCount: 0 });

  const recentSamplePromise = institutionRepository.listAdminPage
    ? institutionRepository.listAdminPage({
        pageSize: ACTIVITY_LIMIT,
        sort: "created_desc",
        // Equality filter uses existing lifecycleStatus+createdAt index (bare createdAt+__name__ is unavailable).
        filters: { status: InstitutionStatus.Published },
      })
    : Promise.resolve({ items: [] as const });
  const draftSamplePromise = institutionRepository.listAdminPage
    ? institutionRepository.listAdminPage({
        pageSize: ACTIVITY_LIMIT,
        sort: "created_desc",
        filters: { status: InstitutionStatus.Draft },
      })
    : Promise.resolve({ items: [] as const });

  const [acquisition, statusCounts, pendingClaims, recentSample, draftSample] = await Promise.all([
    getInstitutionAcquisitionDashboard(
      { queue: "all", lightweight: true },
      { ...deps, resolveTypeLabel: getInstitutionTypeLabel },
    ),
    statusCountsPromise,
    claimRequestRepository.listRecent({
      status: ClaimRequestStatus.Pending,
      limit: 200,
    }),
    recentSamplePromise,
    draftSamplePromise,
  ]);

  const workforce = createAiWorkforceOrchestrator();
  const foundation = summarizeAiWorkforceFoundation(workforce);

  const dateTimeFormat = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const dateFormat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });

  const total = acquisition.statistics.totalInstitutions;
  const queueCounts = acquisition.statistics.queueCounts;
  const quality = acquisition.statistics.qualityDistribution;
  const claimsAwaitingReview = Math.max(
    pendingClaims.length,
    Math.max(0, queueCounts.claimed - queueCounts.verified),
  );
  const pendingReviewCount = statusCounts.pendingReviewCount;
  const draftCount = statusCounts.draftCount;
  const publishedCount = statusCounts.publishedCount;

  const institutions = [...recentSample.items];
  const institutionsById = new Map(
    institutions.map((institution) => [institutionIdAsString(institution.id), institution]),
  );

  const latestPendingClaims = pendingClaims.slice(0, ACTIVITY_LIMIT);

  // Fill names for claim rows that may sit outside the acquisition page slice.
  await Promise.all(
    latestPendingClaims.map(async (claim) => {
      const id = claim.institutionId.value;
      if (institutionsById.has(id)) return;
      const institution = await institutionRepository.getById(claim.institutionId);
      if (institution) {
        institutionsById.set(id, institution);
      }
    }),
  );

  const latestInstitutions = [...institutions]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, ACTIVITY_LIMIT)
    .map((institution) =>
      Object.freeze({
        id: institutionIdAsString(institution.id),
        title: institution.name,
        meta: `${getAdminAcquisitionStatusLabel(institution.status)} · ${dateTimeFormat.format(new Date(institution.updatedAt))}`,
        href: `/admin/review?selected=${encodeURIComponent(institutionIdAsString(institution.id))}`,
      }),
    );

  const latestClaims = latestPendingClaims.map((claim) => {
    const institution = institutionsById.get(claim.institutionId.value);
    const institutionName = institution?.name ?? claim.institutionId.value;
    // Include city scope when available so overview clicks never trigger unscoped q → listAll().
    const href = institution
      ? `/admin/acquisition?queue=claimed&cityId=${encodeURIComponent(institution.location.cityId)}&q=${encodeURIComponent(institution.name)}`
      : `/admin/acquisition?queue=claimed`;
    return Object.freeze({
      id: claim.id.value,
      title: institutionName,
      meta: `${claim.applicantName} · ${claim.email} · ${dateTimeFormat.format(new Date(claim.createdAt))}`,
      href,
    });
  });

  const latestImports = draftSample.items.slice(0, ACTIVITY_LIMIT).map((institution) =>
    Object.freeze({
      id: `import_${institutionIdAsString(institution.id)}`,
      title: institution.name,
      meta: `Taslak · ${dateFormat.format(new Date(institution.createdAt ?? institution.updatedAt))}`,
      href: `/admin/review?queue=draft&selected=${encodeURIComponent(institutionIdAsString(institution.id))}`,
    }),
  );

  const healthStats = Object.freeze([
    Object.freeze({
      id: "total",
      label: "Toplam kurum",
      value: total,
      href: "/admin/acquisition",
    }),
    Object.freeze({
      id: "published",
      label: "Yayında",
      value: publishedCount,
      href: "/admin/review?queue=published",
    }),
    Object.freeze({
      id: "draft",
      label: "Taslak",
      value: draftCount,
      href: "/admin/review?queue=draft",
    }),
    Object.freeze({
      id: "pending_review",
      label: "İnceleme bekleyen",
      value: pendingReviewCount,
      href: "/admin/review?queue=needs_review",
    }),
    Object.freeze({
      id: "claims",
      label: "Sahiplenme bekleyen",
      value: claimsAwaitingReview,
      hint: "Bekleyen sahiplenme talepleri",
      href: "/admin/acquisition?queue=claimed",
    }),
    Object.freeze({
      id: "quality",
      label: "Ortalama kalite",
      value: quality.averageScore,
      hint: "İç kalite skoru (Growth Score değil)",
      href: "/admin/acquisition?sort=lowest",
    }),
  ]);

  return Object.freeze({
    title: "Genel bakış",
    subtitle:
      "Platform sağlığı, son etkinlik ve salt okunur AI önerileri. Otomasyon yok — kararlar insan incelemesine aittir.",
    generatedAtLabel: dateTimeFormat.format(new Date(acquisition.generatedAt)),
    health: Object.freeze({
      totalInstitutions: total,
      publishedCount,
      draftCount,
      pendingReviewCount,
      claimsAwaitingReview,
      averageQualityScore: quality.averageScore,
    }),
    healthStats,
    latestInstitutions: Object.freeze(latestInstitutions),
    latestClaims: Object.freeze(latestClaims),
    latestImports: Object.freeze(latestImports),
    quickActions: ADMIN_OVERVIEW_QUICK_ACTIONS,
    aiRecommendations: Object.freeze(
      buildAiRecommendations({
        acquisition,
        pendingReviewCount,
        claimsAwaitingReview,
        lowQualityCount: quality.low,
      }),
    ),
    aiPanel: Object.freeze({
      title: "AI Asistan",
      description:
        "Mevcut kalite / işgücü altyapısından üretilen salt okunur öneriler. Yazma, otomatik onay veya yayın yok.",
      agentCount: foundation.agentCount,
    }),
    navBadges: Object.freeze({
      review: pendingReviewCount > 0 ? pendingReviewCount : undefined,
      acquisition: total > 0 ? total : undefined,
    }),
  });
}

function buildAiRecommendations(input: {
  acquisition: Awaited<ReturnType<typeof getInstitutionAcquisitionDashboard>>;
  pendingReviewCount: number;
  claimsAwaitingReview: number;
  lowQualityCount: number;
}): readonly AdminOverviewAiRecommendationView[] {
  const items: AdminOverviewAiRecommendationView[] = [];

  const missingLogoCount = input.acquisition.rows.filter((row) =>
    row.recommendations.some((item) => item.type === RecommendationType.UploadPhotos),
  ).length;
  if (missingLogoCount > 0) {
    items.push(
      Object.freeze({
        id: "ai_missing_logos",
        title: "Logosu / görseli eksik kurumlar",
        message: `${missingLogoCount} kurumda fotoğraf veya logo yükleme önerisi var.`,
        priorityLabel: priorityLabel(RecommendationPriority.Medium),
        agentLabel: "Enrichment Agent",
        href: "/admin/acquisition?sort=missing_fields",
        ruleId: "quality_upload_photos",
      }),
    );
  }

  const duplicateGroups = input.acquisition.duplicateCandidates.length;
  if (duplicateGroups > 0) {
    items.push(
      Object.freeze({
        id: "ai_duplicates",
        title: "Yinelenen kurum adayları",
        message: `${duplicateGroups} yinelenme grubu inceleme bekliyor.`,
        priorityLabel: priorityLabel(RecommendationPriority.High),
        agentLabel: "Discovery Agent",
        href: "/admin/acquisition?queue=duplicates",
        ruleId: "duplicate_candidates",
      }),
    );
  }

  if (input.lowQualityCount > 0) {
    items.push(
      Object.freeze({
        id: "ai_low_quality",
        title: "Düşük kaliteli kurumlar",
        message: `${input.lowQualityCount} kurum düşük kalite bandında (0–39).`,
        priorityLabel: priorityLabel(RecommendationPriority.High),
        agentLabel: "Quality Agent",
        href: "/admin/acquisition?sort=lowest",
        ruleId: "quality_low_band",
      }),
    );
  }

  if (input.claimsAwaitingReview > 0) {
    items.push(
      Object.freeze({
        id: "ai_claim_backlog",
        title: "Sahiplenme birikimi",
        message: `${input.claimsAwaitingReview} sahiplenme doğrulama bekliyor.`,
        priorityLabel: priorityLabel(RecommendationPriority.High),
        agentLabel: "Validation Agent",
        href: "/admin/acquisition?queue=claimed",
        ruleId: "claim_backlog",
      }),
    );
  }

  if (input.pendingReviewCount > 0) {
    items.push(
      Object.freeze({
        id: "ai_review_backlog",
        title: "İnceleme birikimi",
        message: `${input.pendingReviewCount} kurum insan incelemesi bekliyor.`,
        priorityLabel: priorityLabel(RecommendationPriority.High),
        agentLabel: "Quality Agent",
        href: "/admin/review?queue=needs_review",
        ruleId: "review_backlog",
      }),
    );
  }

  // Surface a sample of live row-level recommendations (existing quality engine output).
  for (const row of input.acquisition.rows) {
    for (const recommendation of row.recommendations) {
      if (items.length >= AI_LIMIT) {
        break;
      }
      const institutionId = institutionIdAsString(row.institution.id);
      const already = items.some(
        (item) => item.id === `ai_row_${institutionId}_${recommendation.ruleId}`,
      );
      if (already) {
        continue;
      }
      items.push(
        Object.freeze({
          id: `ai_row_${institutionId}_${recommendation.ruleId}`,
          title: recommendation.title,
          message: `${row.institution.name}: ${recommendation.message}`,
          priorityLabel: priorityLabel(recommendation.priority),
          agentLabel: "Quality Engine",
          href: `/admin/review?selected=${encodeURIComponent(institutionId)}`,
          ruleId: recommendation.ruleId,
        }),
      );
    }
    if (items.length >= AI_LIMIT) {
      break;
    }
  }

  return Object.freeze(items.slice(0, AI_LIMIT));
}

function priorityLabel(priority: RecommendationPriority): string {
  switch (priority) {
    case RecommendationPriority.High:
      return "Yüksek";
    case RecommendationPriority.Medium:
      return "Orta";
    default:
      return "Düşük";
  }
}
