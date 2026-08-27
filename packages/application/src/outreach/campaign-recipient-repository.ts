import type { CampaignRecipient } from "@eduatlas/domain";

export interface CampaignRecipientRepository {
  getById(id: string): Promise<CampaignRecipient | null>;
  save(recipient: CampaignRecipient): Promise<CampaignRecipient>;
  update(recipient: CampaignRecipient): Promise<CampaignRecipient>;
  listByCampaignId(campaignId: string): Promise<readonly CampaignRecipient[]>;
  listByInstitutionId(institutionId: string): Promise<readonly CampaignRecipient[]>;
  /** Removes all recipients for a campaign. Returns deleted count. */
  deleteByCampaignId(campaignId: string): Promise<number>;
}
