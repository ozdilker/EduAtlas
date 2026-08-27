import {
  campaignIdAsString,
  type Campaign,
  type CampaignLog,
  type CampaignRecipient,
  type CampaignSegment,
  type CampaignTemplate,
} from "@eduatlas/domain";
import type { CampaignLogRepository } from "./campaign-log-repository";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import type { CampaignRepository } from "./campaign-repository";
import type { CampaignSegmentRepository } from "./campaign-segment-repository";
import type { CampaignTemplateRepository } from "./campaign-template-repository";

export class InMemoryCampaignRepository implements CampaignRepository {
  private readonly items = new Map<string, Campaign>();

  async getById(id: string): Promise<Campaign | null> {
    return this.items.get(id.trim()) ?? null;
  }

  async save(campaign: Campaign): Promise<Campaign> {
    const key = campaignIdAsString(campaign.id);
    if (this.items.has(key)) {
      throw new Error(`Campaign already exists: ${key}`);
    }
    this.items.set(key, campaign);
    return campaign;
  }

  async update(campaign: Campaign): Promise<Campaign> {
    const key = campaignIdAsString(campaign.id);
    if (!this.items.has(key)) {
      throw new Error(`Campaign not found: ${key}`);
    }
    this.items.set(key, campaign);
    return campaign;
  }

  async list(): Promise<readonly Campaign[]> {
    return Object.freeze([...this.items.values()]);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id.trim());
  }
}

export class InMemoryCampaignRecipientRepository implements CampaignRecipientRepository {
  private readonly items = new Map<string, CampaignRecipient>();

  async getById(id: string): Promise<CampaignRecipient | null> {
    return this.items.get(id.trim()) ?? null;
  }

  async save(recipient: CampaignRecipient): Promise<CampaignRecipient> {
    if (this.items.has(recipient.id)) {
      throw new Error(`CampaignRecipient already exists: ${recipient.id}`);
    }
    this.items.set(recipient.id, recipient);
    return recipient;
  }

  async update(recipient: CampaignRecipient): Promise<CampaignRecipient> {
    if (!this.items.has(recipient.id)) {
      throw new Error(`CampaignRecipient not found: ${recipient.id}`);
    }
    this.items.set(recipient.id, recipient);
    return recipient;
  }

  async listByCampaignId(campaignId: string): Promise<readonly CampaignRecipient[]> {
    const id = campaignId.trim();
    return Object.freeze([...this.items.values()].filter((r) => r.campaignId === id));
  }

  async listByInstitutionId(institutionId: string): Promise<readonly CampaignRecipient[]> {
    const id = institutionId.trim();
    return Object.freeze([...this.items.values()].filter((r) => r.institutionId === id));
  }

  async deleteByCampaignId(campaignId: string): Promise<number> {
    const id = campaignId.trim();
    let count = 0;
    for (const [key, recipient] of this.items) {
      if (recipient.campaignId === id) {
        this.items.delete(key);
        count += 1;
      }
    }
    return count;
  }
}

export class InMemoryCampaignSegmentRepository implements CampaignSegmentRepository {
  private readonly items = new Map<string, CampaignSegment>();

  async getById(id: string): Promise<CampaignSegment | null> {
    return this.items.get(id.trim()) ?? null;
  }

  async save(segment: CampaignSegment): Promise<CampaignSegment> {
    if (this.items.has(segment.id)) {
      throw new Error(`CampaignSegment already exists: ${segment.id}`);
    }
    this.items.set(segment.id, segment);
    return segment;
  }

  async update(segment: CampaignSegment): Promise<CampaignSegment> {
    if (!this.items.has(segment.id)) {
      throw new Error(`CampaignSegment not found: ${segment.id}`);
    }
    this.items.set(segment.id, segment);
    return segment;
  }

  async list(): Promise<readonly CampaignSegment[]> {
    return Object.freeze([...this.items.values()]);
  }
}

export class InMemoryCampaignTemplateRepository implements CampaignTemplateRepository {
  private readonly items = new Map<string, CampaignTemplate>();

  async getById(id: string): Promise<CampaignTemplate | null> {
    return this.items.get(id.trim()) ?? null;
  }

  async save(template: CampaignTemplate): Promise<CampaignTemplate> {
    if (this.items.has(template.id)) {
      throw new Error(`CampaignTemplate already exists: ${template.id}`);
    }
    this.items.set(template.id, template);
    return template;
  }

  async update(template: CampaignTemplate): Promise<CampaignTemplate> {
    if (!this.items.has(template.id)) {
      throw new Error(`CampaignTemplate not found: ${template.id}`);
    }
    this.items.set(template.id, template);
    return template;
  }

  async list(): Promise<readonly CampaignTemplate[]> {
    return Object.freeze([...this.items.values()]);
  }
}

export class InMemoryCampaignLogRepository implements CampaignLogRepository {
  private readonly items: CampaignLog[] = [];

  async save(log: CampaignLog): Promise<CampaignLog> {
    this.items.push(log);
    return log;
  }

  async listByCampaignId(campaignId: string): Promise<readonly CampaignLog[]> {
    const id = campaignId.trim();
    return Object.freeze(this.items.filter((log) => log.campaignId === id));
  }

  async deleteByCampaignId(campaignId: string): Promise<number> {
    const id = campaignId.trim();
    const before = this.items.length;
    const kept = this.items.filter((log) => log.campaignId !== id);
    this.items.length = 0;
    this.items.push(...kept);
    return before - kept.length;
  }
}

export function createInMemoryOutreachStores(): Readonly<{
  campaignRepository: InMemoryCampaignRepository;
  recipientRepository: InMemoryCampaignRecipientRepository;
  segmentRepository: InMemoryCampaignSegmentRepository;
  templateRepository: InMemoryCampaignTemplateRepository;
  logRepository: InMemoryCampaignLogRepository;
}> {
  return Object.freeze({
    campaignRepository: new InMemoryCampaignRepository(),
    recipientRepository: new InMemoryCampaignRecipientRepository(),
    segmentRepository: new InMemoryCampaignSegmentRepository(),
    templateRepository: new InMemoryCampaignTemplateRepository(),
    logRepository: new InMemoryCampaignLogRepository(),
  });
}
