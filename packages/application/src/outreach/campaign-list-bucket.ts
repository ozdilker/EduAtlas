import { CampaignStatus } from "@eduatlas/domain";

/** UI list filter ids (not domain statuses). */
export const CampaignListFilter = Object.freeze({
  Draft: "draft",
  Prepared: "prepared",
  Ready: "ready",
  Running: "running",
  Completed: "completed",
  Cancelled: "cancelled",
  Archive: "archive",
  All: "all",
} as const);

export type CampaignListFilter =
  (typeof CampaignListFilter)[keyof typeof CampaignListFilter];

/** Primary display bucket for a campaign row. */
export const CampaignListBucket = Object.freeze({
  Draft: "draft",
  Prepared: "prepared",
  Ready: "ready",
  Running: "running",
  Completed: "completed",
  Cancelled: "cancelled",
  Failed: "failed",
} as const);

export type CampaignListBucket =
  (typeof CampaignListBucket)[keyof typeof CampaignListBucket];

const BUCKET_LABELS: Record<CampaignListBucket, string> = {
  draft: "Taslak",
  prepared: "Hazırlandı",
  ready: "Hazır",
  running: "Çalışıyor",
  completed: "Tamamlandı",
  cancelled: "İptal",
  failed: "Başarısız",
};

/**
 * Derives the primary UI bucket from domain status + recipient count.
 * Does not invent domain statuses — Prepare leaves status as draft.
 */
export function resolveCampaignListBucket(
  status: string,
  recipientCount: number,
): CampaignListBucket {
  const count = Math.max(0, recipientCount);
  switch (status) {
    case CampaignStatus.Draft:
      return count > 0 ? CampaignListBucket.Prepared : CampaignListBucket.Draft;
    case CampaignStatus.Ready:
      return CampaignListBucket.Ready;
    case CampaignStatus.Running:
    case CampaignStatus.Paused:
      return CampaignListBucket.Running;
    case CampaignStatus.Completed:
      return CampaignListBucket.Completed;
    case CampaignStatus.Cancelled:
      return CampaignListBucket.Cancelled;
    case CampaignStatus.Failed:
      return CampaignListBucket.Failed;
    default:
      return CampaignListBucket.Draft;
  }
}

export function campaignListBucketLabel(bucket: CampaignListBucket): string {
  return BUCKET_LABELS[bucket];
}

/**
 * Whether a campaign belongs in a left-panel filter.
 * Archive is UI-only: completed | cancelled | failed.
 */
export function campaignMatchesListFilter(
  filter: CampaignListFilter,
  status: string,
  recipientCount: number,
): boolean {
  if (filter === CampaignListFilter.All) return true;
  if (filter === CampaignListFilter.Archive) {
    return (
      status === CampaignStatus.Completed ||
      status === CampaignStatus.Cancelled ||
      status === CampaignStatus.Failed
    );
  }
  const bucket = resolveCampaignListBucket(status, recipientCount);
  switch (filter) {
    case CampaignListFilter.Draft:
      return bucket === CampaignListBucket.Draft;
    case CampaignListFilter.Prepared:
      return bucket === CampaignListBucket.Prepared;
    case CampaignListFilter.Ready:
      return bucket === CampaignListBucket.Ready;
    case CampaignListFilter.Running:
      return bucket === CampaignListBucket.Running;
    case CampaignListFilter.Completed:
      return bucket === CampaignListBucket.Completed;
    case CampaignListFilter.Cancelled:
      return bucket === CampaignListBucket.Cancelled;
    default:
      return true;
  }
}
