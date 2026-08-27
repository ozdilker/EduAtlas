import type { CampaignLog } from "@eduatlas/domain";

export interface CampaignLogRepository {
  save(log: CampaignLog): Promise<CampaignLog>;
  listByCampaignId(campaignId: string): Promise<readonly CampaignLog[]>;
  /** Removes all logs for a campaign. Returns deleted count. */
  deleteByCampaignId(campaignId: string): Promise<number>;
}
