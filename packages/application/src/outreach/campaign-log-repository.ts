import type { CampaignLog } from "@eduatlas/domain";

export interface CampaignLogRepository {
  save(log: CampaignLog): Promise<CampaignLog>;
  listByCampaignId(campaignId: string): Promise<readonly CampaignLog[]>;
}
