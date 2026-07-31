import {
  createAiWorkforceOrchestrator,
  getInstitutionAcquisitionDashboard,
  getInstitutionReviewQueue,
  summarizeAiWorkforceFoundation,
} from "@eduatlas/application";
import {
  InstitutionStatus,
  InstitutionVerification,
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
import { getInstitutionRepository } from "../institutions/repository";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";

const ACTIVITY_LIMIT = 6;
const AI_LIMIT = 8;

/**
 * Admin Overview landing view — pure composition of existing acquisition,
 * review, and AI workforce foundation services. No new business rules,
 * no repository writes, no AI automation.
 */
export async function getAdminOverviewView(): Promise<AdminOverviewViewData> {
  const institutionRepository = await getInstitutionRepository();
  const deps = {
    institutionRepository,
    resolveCityLabel: (id: string) => resolveGeoLabels(id, "dist_unknown").cityName,
    resolveDistrictLabel: (cId: string, dId: string) => resolveGeoLabels(cId, dId).districtName,
  };

  const [acquisition, review] = await Promise.all([
    getInstitutionAcquisitionDashboard(
      { queue: "all" },
      { ...deps, resolveTypeLabel: getInstitutionTypeLabel },
    ),
    getInstitutionReviewQueue({ queue: "draft" }, deps),
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
  const claimsAwaitingReview = Math.max(0, queueCounts.claimed - queueCounts.verified);
  const pendingReviewCount = review.queueCounts.needs_review;

  const institutions = acquisition.rows.map((row) => row.institution);

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

  const latestClaims = institutions
    .filter(
      (institution) =>
        institution.verification === InstitutionVerification.Pending ||
        institution.verification === InstitutionVerification.Verified,
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, ACTIVITY_LIMIT)
    .map((institution) =>
      Object.freeze({
        id: `claim_${institutionIdAsString(institution.id)}`,
        title: institution.name,
        meta: `${institution.verification === InstitutionVerification.Pending ? "Doğrulama bekliyor" : "Doğrulanmış sahip"} · ${dateTimeFormat.format(new Date(institution.updatedAt))}`,
        href: `/admin/acquisition?queue=claimed&q=${encodeURIComponent(institution.name)}`,
      }),
    );

  const latestImports = institutions
    .filter((institution) => institution.status === InstitutionStatus.Draft)
    .sort((left, right) =>
      (right.createdAt ?? right.updatedAt).localeCompare(left.createdAt ?? left.updatedAt),
    )
    .slice(0, ACTIVITY_LIMIT)
    .map((institution) =>
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
      value: review.queueCounts.published,
      href: "/admin/review?queue=published",
    }),
    Object.freeze({
      id: "draft",
      label: "Taslak",
      value: review.queueCounts.draft,
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
      hint: "Doğrulama bekleyen sahiplenmeler",
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
      publishedCount: review.queueCounts.published,
      draftCount: review.queueCounts.draft,
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
