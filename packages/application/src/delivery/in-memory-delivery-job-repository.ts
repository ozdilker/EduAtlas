import {
  createDeliveryJob,
  DeliveryJobStatus,
  type DeliveryJob,
} from "@eduatlas/domain";
import type { DeliveryJobRepository } from "./delivery-job-repository";

/**
 * In-memory DeliveryJobRepository for unit tests.
 */
export class InMemoryDeliveryJobRepository implements DeliveryJobRepository {
  private readonly byId = new Map<string, DeliveryJob>();
  private readonly byKey = new Map<string, string>();

  async getById(id: string): Promise<DeliveryJob | null> {
    return this.byId.get(id.trim()) ?? null;
  }

  async getByIdempotencyKey(key: string): Promise<DeliveryJob | null> {
    const id = this.byKey.get(key.trim());
    return id ? (this.byId.get(id) ?? null) : null;
  }

  async save(job: DeliveryJob): Promise<DeliveryJob> {
    if (this.byId.has(job.id)) {
      throw new Error(`DeliveryJob already exists: ${job.id}`);
    }
    if (this.byKey.has(job.idempotencyKey)) {
      throw new Error(`DeliveryJob idempotency conflict: ${job.idempotencyKey}`);
    }
    this.byId.set(job.id, job);
    this.byKey.set(job.idempotencyKey, job.id);
    return job;
  }

  async update(job: DeliveryJob): Promise<DeliveryJob> {
    if (!this.byId.has(job.id)) {
      throw new Error(`DeliveryJob not found: ${job.id}`);
    }
    this.byId.set(job.id, job);
    this.byKey.set(job.idempotencyKey, job.id);
    return job;
  }

  async listByCampaignId(campaignId: string): Promise<readonly DeliveryJob[]> {
    const id = campaignId.trim();
    return Object.freeze([...this.byId.values()].filter((j) => j.campaignId === id));
  }

  async claimNext(input: {
    now: string;
    lockedBy: string;
    lockTtlMs: number;
    campaignId: string;
  }): Promise<DeliveryJob | null> {
    const nowMs = Date.parse(input.now);
    const campaignId = input.campaignId.trim();
    const candidates = [...this.byId.values()]
      .filter((job) => job.campaignId === campaignId)
      .sort((a, b) => Date.parse(a.availableAt) - Date.parse(b.availableAt));

    for (const job of candidates) {
      const available = Date.parse(job.availableAt) <= nowMs;
      if (job.status === DeliveryJobStatus.Pending && available) {
        const locked = createDeliveryJob({
          ...job,
          status: DeliveryJobStatus.Locked,
          lockedAt: input.now,
          lockedBy: input.lockedBy,
          updatedAt: input.now,
        });
        this.byId.set(locked.id, locked);
        return locked;
      }

      if (job.status === DeliveryJobStatus.Locked && job.lockedAt) {
        const lockedMs = Date.parse(job.lockedAt);
        if (nowMs - lockedMs >= input.lockTtlMs && available) {
          const locked = createDeliveryJob({
            ...job,
            status: DeliveryJobStatus.Locked,
            lockedAt: input.now,
            lockedBy: input.lockedBy,
            updatedAt: input.now,
          });
          this.byId.set(locked.id, locked);
          return locked;
        }
      }
    }
    return null;
  }
}

export function createInMemoryDeliveryJobRepository(): InMemoryDeliveryJobRepository {
  return new InMemoryDeliveryJobRepository();
}
