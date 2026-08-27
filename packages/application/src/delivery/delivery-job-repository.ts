import type { DeliveryJob } from "@eduatlas/domain";

export interface DeliveryJobRepository {
  getById(id: string): Promise<DeliveryJob | null>;
  getByIdempotencyKey(key: string): Promise<DeliveryJob | null>;
  save(job: DeliveryJob): Promise<DeliveryJob>;
  update(job: DeliveryJob): Promise<DeliveryJob>;
  listByCampaignId(campaignId: string): Promise<readonly DeliveryJob[]>;
  /** Removes all delivery jobs for a campaign. Returns deleted count. */
  deleteByCampaignId(campaignId: string): Promise<number>;
  claimNext(input: {
    now: string;
    lockedBy: string;
    lockTtlMs: number;
    campaignId: string;
  }): Promise<DeliveryJob | null>;
}
