export type AdminOverviewStatView = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
  readonly hint?: string;
  readonly href?: string;
}>;

export type AdminOverviewActivityItemView = Readonly<{
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly href: string;
}>;

export type AdminOverviewQuickActionView = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
}>;

export type AdminOverviewAiRecommendationView = Readonly<{
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly priorityLabel: string;
  readonly agentLabel: string;
  readonly href: string;
  readonly ruleId: string;
}>;

export type AdminOverviewViewData = Readonly<{
  readonly title: string;
  readonly subtitle: string;
  readonly generatedAtLabel: string;
  readonly health: Readonly<{
    readonly totalInstitutions: number;
    readonly publishedCount: number;
    readonly draftCount: number;
    readonly pendingReviewCount: number;
    readonly claimsAwaitingReview: number;
    readonly averageQualityScore: number;
  }>;
  readonly healthStats: readonly AdminOverviewStatView[];
  readonly latestInstitutions: readonly AdminOverviewActivityItemView[];
  readonly latestClaims: readonly AdminOverviewActivityItemView[];
  readonly latestImports: readonly AdminOverviewActivityItemView[];
  readonly quickActions: readonly AdminOverviewQuickActionView[];
  readonly aiRecommendations: readonly AdminOverviewAiRecommendationView[];
  readonly aiPanel: Readonly<{
    readonly title: string;
    readonly description: string;
    readonly agentCount: number;
  }>;
  readonly navBadges: Readonly<{
    readonly review?: number;
    readonly acquisition?: number;
  }>;
}>;

/**
 * Executive shortcuts — navigation only, no mutations.
 */
export const ADMIN_OVERVIEW_QUICK_ACTIONS: readonly AdminOverviewQuickActionView[] = Object.freeze([
  {
    id: "import",
    label: "Kurum içe aktar",
    description: "CSV/XLSX ile kurumları yayına alınmış olarak ekleyin.",
    href: "/admin/import",
  },
  {
    id: "review",
    label: "İnceleme kuyruğu",
    description: "Yayın öncesi insan incelemesini yürütün.",
    href: "/admin/review",
  },
  {
    id: "acquisition",
    label: "Kurum edinimi",
    description: "Edinim kuyruklarını ve sahipliği yönetin.",
    href: "/admin/acquisition",
  },
  {
    id: "operations",
    label: "Operasyon",
    description: "Veri operasyonları çalışma alanını açın.",
    href: "/admin/operations",
  },
]);
