import {
  DeliveryJobStatus,
  type DeliveryJob,
} from "@eduatlas/domain";
import type { DeliveryJobRepository } from "../delivery/delivery-job-repository";

export type CampaignProgress = Readonly<{
  readonly total: number;
  readonly sent: number;
  readonly queued: number;
  readonly locked: number;
  readonly failed: number;
  readonly bounced: number;
  readonly percent: number;
}>;

/**
 * Aggregates DeliveryJob statuses into admin progress / live-delivery counters.
 * Queued = pending; Locked = locked (shown separately for Live Delivery).
 */
export function computeCampaignProgress(jobs: readonly DeliveryJob[]): CampaignProgress {
  let sent = 0;
  let queued = 0;
  let locked = 0;
  let failed = 0;
  let bounced = 0;
  for (const job of jobs) {
    switch (job.status) {
      case DeliveryJobStatus.Sent:
        sent += 1;
        break;
      case DeliveryJobStatus.Pending:
        queued += 1;
        break;
      case DeliveryJobStatus.Locked:
        locked += 1;
        break;
      case DeliveryJobStatus.Failed:
      case DeliveryJobStatus.Cancelled:
        failed += 1;
        break;
      case DeliveryJobStatus.Bounced:
        bounced += 1;
        break;
      default:
        break;
    }
  }
  const total = jobs.length;
  const percent = total === 0 ? 0 : Math.round((sent / total) * 100);
  return Object.freeze({ total, sent, queued, locked, failed, bounced, percent });
}

export async function getCampaignProgress(
  campaignId: string,
  jobRepository: DeliveryJobRepository,
): Promise<CampaignProgress> {
  const jobs = await jobRepository.listByCampaignId(campaignId);
  return computeCampaignProgress(jobs);
}
