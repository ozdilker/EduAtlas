import type { CampaignChannel } from "@eduatlas/domain";

export type OutreachQueueJob = Readonly<{
  readonly id: string;
  readonly campaignId: string;
  readonly recipientId: string;
  readonly channel: CampaignChannel;
  readonly createdAt: string;
  readonly availableAt: string;
}>;

export type EnqueueOutreachJobInput = Readonly<{
  readonly id?: string;
  readonly campaignId: string;
  readonly recipientId: string;
  readonly channel: CampaignChannel;
  readonly createdAt: string;
  readonly availableAt: string;
}>;

/**
 * Outreach job queue port — enqueue/list only; never sends mail.
 */
export interface OutreachQueue {
  enqueue(job: EnqueueOutreachJobInput): Promise<OutreachQueueJob>;
  listReady(nowIso: string): Promise<readonly OutreachQueueJob[]>;
  acknowledge(jobId: string): Promise<void>;
}

export class InMemoryOutreachQueue implements OutreachQueue {
  private readonly jobs = new Map<string, OutreachQueueJob>();
  private seq = 0;

  async enqueue(input: EnqueueOutreachJobInput): Promise<OutreachQueueJob> {
    this.seq += 1;
    const id = input.id?.trim() || `job_${this.seq}`;
    const job = Object.freeze({
      id,
      campaignId: input.campaignId.trim(),
      recipientId: input.recipientId.trim(),
      channel: input.channel,
      createdAt: input.createdAt,
      availableAt: input.availableAt,
    });
    this.jobs.set(id, job);
    return job;
  }

  async listReady(nowIso: string): Promise<readonly OutreachQueueJob[]> {
    const now = Date.parse(nowIso);
    return Object.freeze(
      [...this.jobs.values()].filter((job) => Date.parse(job.availableAt) <= now),
    );
  }

  async acknowledge(jobId: string): Promise<void> {
    this.jobs.delete(jobId.trim());
  }
}

export function createInMemoryOutreachQueue(): InMemoryOutreachQueue {
  return new InMemoryOutreachQueue();
}
