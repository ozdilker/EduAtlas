export type AdminOperationsBucketView = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly count: number;
}>;

export type AdminOperationsHealthView = Readonly<{
  readonly averageQuality: number;
  readonly draftCount: number;
  readonly publishedCount: number;
  readonly claimRatePercent: number;
  readonly duplicateRatePercent: number;
}>;

export type AdminOperationsQuickAction = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
}>;

export type AdminOperationsActivityView = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly statusLabel: string;
  readonly updatedAtLabel: string;
  readonly href: string;
}>;

export type AdminOperationsPublishedItemView = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly cityLabel: string;
  readonly publishedAtLabel: string;
  readonly href: string;
}>;

export type AdminOperationsViewData = Readonly<{
  readonly title: string;
  readonly subtitle: string;
  readonly generatedAtLabel: string;
  readonly health: AdminOperationsHealthView;
  readonly acquisition: Readonly<{
    readonly totalInstitutions: number;
    readonly claimRatePercent: number;
    readonly verificationRatePercent: number;
    readonly topCities: readonly AdminOperationsBucketView[];
    readonly topTypes: readonly AdminOperationsBucketView[];
  }>;
  readonly importQueue: Readonly<{
    readonly draftCount: number;
    readonly readyForReviewCount: number;
  }>;
  readonly reviewQueue: Readonly<{
    readonly draft: number;
    readonly needsReview: number;
    readonly ready: number;
    readonly published: number;
    readonly rejected: number;
  }>;
  readonly published: Readonly<{
    readonly count: number;
    readonly latest: readonly AdminOperationsPublishedItemView[];
  }>;
  readonly quality: Readonly<{
    readonly averageScore: number;
    readonly low: number;
    readonly medium: number;
    readonly healthy: number;
    readonly excellent: number;
    readonly byGrade: Readonly<Record<string, number>>;
  }>;
  readonly claims: Readonly<{
    readonly claimedCount: number;
    readonly verifiedCount: number;
    readonly pendingCount: number;
    readonly unclaimedCount: number;
    readonly claimRatePercent: number;
    readonly verificationRatePercent: number;
  }>;
  readonly recentActivity: readonly AdminOperationsActivityView[];
  readonly quickActions: readonly AdminOperationsQuickAction[];
}>;

/**
 * Quick actions into the existing operational surfaces.
 * Navigation only — the workspace itself performs no mutations.
 */
export const ADMIN_OPERATIONS_QUICK_ACTIONS: readonly AdminOperationsQuickAction[] = Object.freeze([
  {
    id: "import",
    label: "Kurum içe aktar",
    description: "CSV/XLSX dosyasından kurumları yayına alınmış olarak ekleyin.",
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
    description: "Edinim kuyruklarını ve sahiplik durumunu yönetin.",
    href: "/admin/acquisition",
  },
  {
    id: "published",
    label: "Yayındaki kurumlar",
    description: "Yayındaki kayıtları gözden geçirin.",
    href: "/admin/published",
  },
  {
    id: "quality",
    label: "Kalite çalışması",
    description: "En düşük kaliteli kayıtlardan başlayın.",
    href: "/admin/acquisition?sort=lowest",
  },
]);

/**
 * Percent helper for health indicators (0–100, rounded; 0 when empty).
 */
export function adminOperationsPercent(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((part / total) * 100));
}
