import type { OwnerBindingRepository } from "@eduatlas/application";
import { createOwnerBinding, type OwnerBinding } from "@eduatlas/domain";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";

export const INSTITUTION_OWNERS_COLLECTION = "institutionOwners";

export type FirestoreInstitutionOwnerDocument = {
  userId: string;
  institutionId: string;
  status: string;
  requestedAt?: string;
  approvedAt?: string;
};

/**
 * Firestore adapter for approved owner bindings + Admin claim-approval writes.
 */
export class FirestoreOwnerBindingRepository implements OwnerBindingRepository {
  constructor(private readonly firestore: Firestore) {}

  async findApprovedByUserId(userId: string): Promise<OwnerBinding | null> {
    const key = userId.trim();
    if (!key) return null;

    const snapshot = await this.firestore
      .collection(INSTITUTION_OWNERS_COLLECTION)
      .where("userId", "==", key)
      .where("status", "==", "approved")
      .limit(1)
      .get();

    const doc = snapshot.docs[0];
    return doc ? toOwnerBinding(doc) : null;
  }

  async findApprovedByInstitutionId(institutionId: string): Promise<OwnerBinding | null> {
    const key = institutionId.trim();
    if (!key) return null;

    const snapshot = await this.firestore
      .collection(INSTITUTION_OWNERS_COLLECTION)
      .where("institutionId", "==", key)
      .where("status", "==", "approved")
      .limit(1)
      .get();

    const doc = snapshot.docs[0];
    return doc ? toOwnerBinding(doc) : null;
  }

  async listByUserId(userId: string): Promise<readonly OwnerBinding[]> {
    const key = userId.trim();
    if (!key) return Object.freeze([]);

    const snapshot = await this.firestore
      .collection(INSTITUTION_OWNERS_COLLECTION)
      .where("userId", "==", key)
      .get();

    return Object.freeze(snapshot.docs.map((doc) => toOwnerBinding(doc)).filter(Boolean));
  }

  async save(binding: OwnerBinding): Promise<OwnerBinding> {
    const docId = `${binding.userId}__${binding.institutionId}`.replace(/[/\\]/g, "_");
    await this.firestore.collection(INSTITUTION_OWNERS_COLLECTION).doc(docId).set(
      {
        userId: binding.userId,
        institutionId: binding.institutionId,
        status: binding.status,
        requestedAt: binding.requestedAt,
        ...(binding.approvedAt ? { approvedAt: binding.approvedAt } : {}),
      },
      { merge: true },
    );
    return binding;
  }
}

function toOwnerBinding(doc: QueryDocumentSnapshot): OwnerBinding {
  const data = doc.data() as FirestoreInstitutionOwnerDocument;
  const requestedAt =
    typeof data.requestedAt === "string" && data.requestedAt
      ? data.requestedAt
      : new Date(0).toISOString();
  const approvedAt =
    typeof data.approvedAt === "string" && data.approvedAt ? data.approvedAt : undefined;
  const status =
    data.status === "pending" || data.status === "approved" || data.status === "revoked"
      ? data.status
      : "pending";

  return createOwnerBinding({
    userId: data.userId,
    institutionId: data.institutionId,
    status,
    requestedAt,
    approvedAt,
  });
}

export function createFirestoreOwnerBindingRepository(
  firestore: Firestore,
): FirestoreOwnerBindingRepository {
  return new FirestoreOwnerBindingRepository(firestore);
}
