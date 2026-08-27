import type { Campaign } from "@eduatlas/domain";

export interface CampaignRepository {
  getById(id: string): Promise<Campaign | null>;
  save(campaign: Campaign): Promise<Campaign>;
  update(campaign: Campaign): Promise<Campaign>;
  list(): Promise<readonly Campaign[]>;
  delete(id: string): Promise<void>;
}
