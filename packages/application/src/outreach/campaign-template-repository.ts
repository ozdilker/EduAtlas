import type { CampaignTemplate } from "@eduatlas/domain";

export interface CampaignTemplateRepository {
  getById(id: string): Promise<CampaignTemplate | null>;
  save(template: CampaignTemplate): Promise<CampaignTemplate>;
  update(template: CampaignTemplate): Promise<CampaignTemplate>;
  list(): Promise<readonly CampaignTemplate[]>;
}
