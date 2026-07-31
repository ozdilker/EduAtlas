import type {
  ClaimRequestRepository,
  ListRecentClaimRequestsOptions,
} from "@eduatlas/application";
import {
  type ClaimRequest,
  type ClaimRequestId,
  type ClaimRequestStatus,
  claimRequestIdAsString,
  createClaimRequest,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import type { ClaimRequestDocumentStore } from "./claim-request-document-store";
import { FirestoreClaimRequestDocumentStore } from "./firestore-claim-request-document-store";
import { FirestoreClaimRequestMapper } from "./firestore-claim-request-mapper";

export type FirestoreClaimRequestRepositoryOptions = {
  firestore?: Firestore;
  store?: ClaimRequestDocumentStore;
};

/**
 * Firestore adapter for ClaimRequestRepository.
 */
export class FirestoreClaimRequestRepository implements ClaimRequestRepository {
  private readonly store: ClaimRequestDocumentStore;

  constructor(options: FirestoreClaimRequestRepositoryOptions) {
    if (options.store) {
      this.store = options.store;
    } else if (options.firestore) {
      this.store = new FirestoreClaimRequestDocumentStore(options.firestore);
    } else {
      throw new Error("FirestoreClaimRequestRepository requires firestore or store.");
    }
  }

  async getById(id: ClaimRequestId): Promise<ClaimRequest | null> {
    const record = await this.store.getById(claimRequestIdAsString(id));
    return record ? FirestoreClaimRequestMapper.toDomain(record.id, record.data) : null;
  }

  async listByInstitutionId(institutionId: string): Promise<readonly ClaimRequest[]> {
    const records = await this.store.listByInstitutionId(institutionId);
    return Object.freeze(
      records.map((record) => FirestoreClaimRequestMapper.toDomain(record.id, record.data)),
    );
  }

  async listRecent(options: ListRecentClaimRequestsOptions = {}): Promise<readonly ClaimRequest[]> {
    const limit = Math.max(1, options.limit ?? 20);
    const records = await this.store.listAll();
    const filtered = options.status
      ? records.filter((record) => record.data.status === options.status)
      : records;
    return Object.freeze(
      filtered
        .slice(0, limit)
        .map((record) => FirestoreClaimRequestMapper.toDomain(record.id, record.data)),
    );
  }

  async save(claimRequest: ClaimRequest): Promise<ClaimRequest> {
    const id = FirestoreClaimRequestMapper.claimRequestDocId(claimRequest);
    const existing = await this.store.getById(id);
    if (existing) {
      throw new Error(`CLAIM_REQUEST_DOC_EXISTS:${id}`);
    }
    await this.store.create(id, FirestoreClaimRequestMapper.toFirestore(claimRequest));
    return claimRequest;
  }

  async updateStatus(id: ClaimRequestId, status: ClaimRequestStatus): Promise<ClaimRequest> {
    const key = claimRequestIdAsString(id);
    const existing = await this.store.getById(key);
    if (!existing) {
      throw new Error(`CLAIM_REQUEST_NOT_FOUND:${key}`);
    }

    const current = FirestoreClaimRequestMapper.toDomain(existing.id, existing.data);
    const updated = createClaimRequest({
      id: key,
      institutionId: current.institutionId.value,
      applicantName: current.applicantName,
      role: current.role,
      phone: current.phone,
      email: current.email,
      message: current.message,
      status,
      evidenceUrl: current.evidenceUrl,
      userId: current.userId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    });

    await this.store.replace(key, FirestoreClaimRequestMapper.toFirestore(updated));
    return updated;
  }
}

/**
 * Convenience factory for Admin Firestore wiring.
 */
export function createFirestoreClaimRequestRepository(
  firestore: Firestore,
): FirestoreClaimRequestRepository {
  return new FirestoreClaimRequestRepository({ firestore });
}
