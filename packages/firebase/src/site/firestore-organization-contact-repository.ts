import type { OrganizationContactRepository } from "@eduatlas/application";
import {
  createOrganizationContact,
  type OrganizationContact,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { CACHE_TTL_MS, TtlCache } from "../cache";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";
import { SITE_SETTINGS_COLLECTION } from "./firestore-homepage-visuals-repository";

export const ORGANIZATION_CONTACT_DOC_ID = "organization_contact";

type FirestoreOrganizationContactDocument = {
  displayName?: string;
  email?: string;
  phone?: string;
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
  updatedAt: string;
  updatedByUserId?: string;
};

function fromDocument(
  data: FirestoreOrganizationContactDocument | undefined,
): OrganizationContact | null {
  if (!data) return null;
  return createOrganizationContact({
    displayName: data.displayName,
    email: data.email,
    phone: data.phone,
    streetAddress: data.streetAddress,
    addressLocality: data.addressLocality,
    addressRegion: data.addressRegion,
    postalCode: data.postalCode,
    updatedAt: data.updatedAt,
    updatedByUserId: data.updatedByUserId,
  });
}

function toDocument(contact: OrganizationContact): FirestoreOrganizationContactDocument {
  return {
    displayName: contact.displayName,
    email: contact.email,
    phone: contact.phone,
    streetAddress: contact.streetAddress,
    addressLocality: contact.addressLocality,
    addressRegion: contact.addressRegion,
    postalCode: contact.postalCode,
    addressCountry: contact.addressCountry,
    updatedAt: contact.updatedAt,
    ...(contact.updatedByUserId ? { updatedByUserId: contact.updatedByUserId } : {}),
  };
}

export class FirestoreOrganizationContactRepository implements OrganizationContactRepository {
  private readonly cache = new TtlCache<OrganizationContact | null>(CACHE_TTL_MS.settings);

  constructor(private readonly db: Firestore) {}

  private docRef() {
    return this.db.collection(SITE_SETTINGS_COLLECTION).doc(ORGANIZATION_CONTACT_DOC_ID);
  }

  async get(): Promise<OrganizationContact | null> {
    return this.cache.getOrLoad("organization_contact", async () => {
      countFirestoreRead();
      const snap = await this.docRef().get();
      if (!snap.exists) return null;
      return fromDocument(snap.data() as FirestoreOrganizationContactDocument);
    });
  }

  async save(contact: OrganizationContact): Promise<OrganizationContact> {
    countFirestoreWrite();
    await this.docRef().set(toDocument(contact), { merge: false });
    this.cache.clear();
    return contact;
  }
}

export function createFirestoreOrganizationContactRepository(
  db: Firestore,
): OrganizationContactRepository {
  return new FirestoreOrganizationContactRepository(db);
}

export class InMemoryOrganizationContactRepository implements OrganizationContactRepository {
  private current: OrganizationContact | null = null;

  async get() {
    return this.current;
  }

  async save(contact: OrganizationContact) {
    this.current = contact;
    return contact;
  }
}

export function createInMemoryOrganizationContactRepository(): OrganizationContactRepository {
  return new InMemoryOrganizationContactRepository();
}
