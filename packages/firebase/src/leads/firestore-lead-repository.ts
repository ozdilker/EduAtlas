import type { LeadRepository } from "@eduatlas/application";
import {
  createLead,
  type Lead,
  type LeadId,
  type LeadStatus,
  leadIdAsString,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { FirestoreLeadDocumentStore } from "./firestore-lead-document-store";
import { FirestoreLeadMapper } from "./firestore-lead-mapper";
import type { LeadDocumentStore } from "./lead-document-store";

export type FirestoreLeadRepositoryOptions = {
  firestore?: Firestore;
  store?: LeadDocumentStore;
};

/**
 * Firestore adapter for LeadRepository.
 */
export class FirestoreLeadRepository implements LeadRepository {
  private readonly store: LeadDocumentStore;

  constructor(options: FirestoreLeadRepositoryOptions) {
    if (options.store) {
      this.store = options.store;
    } else if (options.firestore) {
      this.store = new FirestoreLeadDocumentStore(options.firestore);
    } else {
      throw new Error("FirestoreLeadRepository requires firestore or store.");
    }
  }

  async getById(id: LeadId): Promise<Lead | null> {
    const record = await this.store.getById(leadIdAsString(id));
    return record ? FirestoreLeadMapper.toDomain(record.id, record.data) : null;
  }

  async listByInstitutionId(institutionId: string): Promise<readonly Lead[]> {
    const records = await this.store.listByInstitutionId(institutionId);
    return Object.freeze(
      records.map((record) => FirestoreLeadMapper.toDomain(record.id, record.data)),
    );
  }

  async save(lead: Lead): Promise<Lead> {
    const id = FirestoreLeadMapper.leadDocId(lead);
    const existing = await this.store.getById(id);
    if (existing) {
      throw new Error(`LEAD_DOC_EXISTS:${id}`);
    }
    await this.store.create(id, FirestoreLeadMapper.toFirestore(lead));
    return lead;
  }

  async updateStatus(id: LeadId, status: LeadStatus): Promise<Lead> {
    const key = leadIdAsString(id);
    const existing = await this.store.getById(key);
    if (!existing) {
      throw new Error(`LEAD_NOT_FOUND:${key}`);
    }

    const current = FirestoreLeadMapper.toDomain(existing.id, existing.data);
    const updated = createLead({
      id: key,
      institutionId: current.institutionId.value,
      parentName: current.parentName,
      phone: current.phone,
      message: current.message,
      role: current.role,
      status,
      consentAcceptedAt: current.consentAcceptedAt,
      consentPolicyVersion: current.consentPolicyVersion,
      email: current.email,
      preferredContactTime: current.preferredContactTime,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    });

    await this.store.replace(key, FirestoreLeadMapper.toFirestore(updated));
    return updated;
  }
}

/**
 * Convenience factory for Admin Firestore wiring.
 */
export function createFirestoreLeadRepository(firestore: Firestore): FirestoreLeadRepository {
  return new FirestoreLeadRepository({ firestore });
}
