import type { CampaignSegment } from "@eduatlas/domain";

export interface CampaignSegmentRepository {
  getById(id: string): Promise<CampaignSegment | null>;
  save(segment: CampaignSegment): Promise<CampaignSegment>;
  update(segment: CampaignSegment): Promise<CampaignSegment>;
  list(): Promise<readonly CampaignSegment[]>;
}
