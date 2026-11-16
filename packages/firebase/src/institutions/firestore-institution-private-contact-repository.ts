import type {
  InstitutionPrivateContact,
  InstitutionPrivateContactRepository,
} from "@eduatlas/application";
import { createInstitutionPrivateContact } from "@eduatlas/application";
import type { Firestore } from "firebase-admin/firestore";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

export const INSTITUTION_PRIVATE_CONTACTS_COLLECTION = "institution_private_contacts";

type PrivateContactDocument = {
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  updatedAt?: string;
};

export class FirestoreInstitutionPrivateContactRepository
  implements InstitutionPrivateContactRepository
{
  constructor(private readonly db: Firestore) {}

  private collection() {
    return this.db.collection(INSTITUTION_PRIVATE_CONTACTS_COLLECTION);
  }

  async getByInstitutionId(institutionId: string): Promise<InstitutionPrivateContact | null> {
    const id = institutionId.trim();
    if (!id) return null;
    countFirestoreRead();
    const snap = await this.collection().doc(id).get();
    if (!snap.exists) return null;
    return fromDocument(id, snap.data() as PrivateContactDocument | undefined);
  }

  async getByInstitutionIds(
    institutionIds: readonly string[],
  ): Promise<ReadonlyMap<string, InstitutionPrivateContact>> {
    const unique = [
      ...new Set(institutionIds.map((value) => value.trim()).filter(Boolean)),
    ];
    const result = new Map<string, InstitutionPrivateContact>();
    if (unique.length === 0) return result;

    for (let i = 0; i < unique.length; i += 100) {
      const chunk = unique.slice(i, i + 100);
      const refs = chunk.map((id) => this.collection().doc(id));
      countFirestoreRead();
      const snaps = await this.db.getAll(...refs);
      for (const snap of snaps) {
        if (!snap.exists) continue;
        const contact = fromDocument(snap.id, snap.data() as PrivateContactDocument);
        if (contact) result.set(snap.id, contact);
      }
    }
    return result;
  }

  async upsert(contact: InstitutionPrivateContact): Promise<InstitutionPrivateContact> {
    countFirestoreWrite();
    await this.collection().doc(contact.institutionId).set(toDocument(contact), {
      merge: false,
    });
    return contact;
  }
}

function fromDocument(
  institutionId: string,
  data: PrivateContactDocument | undefined,
): InstitutionPrivateContact | null {
  if (!data?.updatedAt) return null;
  try {
    return createInstitutionPrivateContact({
      institutionId,
      phone: data.phone ?? null,
      email: data.email ?? null,
      whatsappNumber: data.whatsappNumber ?? null,
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

function toDocument(contact: InstitutionPrivateContact): PrivateContactDocument {
  return {
    ...(contact.phone ? { phone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.whatsappNumber ? { whatsappNumber: contact.whatsappNumber } : {}),
    updatedAt: contact.updatedAt,
  };
}

export function createFirestoreInstitutionPrivateContactRepository(
  db: Firestore,
): FirestoreInstitutionPrivateContactRepository {
  return new FirestoreInstitutionPrivateContactRepository(db);
}

export class InMemoryInstitutionPrivateContactRepository
  implements InstitutionPrivateContactRepository
{
  private readonly byId = new Map<string, InstitutionPrivateContact>();

  async getByInstitutionId(institutionId: string): Promise<InstitutionPrivateContact | null> {
    return this.byId.get(institutionId.trim()) ?? null;
  }

  async getByInstitutionIds(
    institutionIds: readonly string[],
  ): Promise<ReadonlyMap<string, InstitutionPrivateContact>> {
    const result = new Map<string, InstitutionPrivateContact>();
    for (const id of institutionIds) {
      const contact = this.byId.get(id.trim());
      if (contact) result.set(contact.institutionId, contact);
    }
    return result;
  }

  async upsert(contact: InstitutionPrivateContact): Promise<InstitutionPrivateContact> {
    this.byId.set(contact.institutionId, contact);
    return contact;
  }
}

export function createInMemoryInstitutionPrivateContactRepository(): InMemoryInstitutionPrivateContactRepository {
  return new InMemoryInstitutionPrivateContactRepository();
}
