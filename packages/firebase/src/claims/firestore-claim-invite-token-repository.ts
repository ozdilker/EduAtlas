import type { ClaimInviteTokenRepository } from "@eduatlas/application";
import {
  createClaimInviteToken,
  type ClaimInviteToken,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";

export const CLAIM_INVITE_TOKENS_COLLECTION = "claim_invite_tokens";

type FirestoreClaimInviteTokenDocument = {
  tokenHash: string;
  institutionId: string;
  leadId: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
};

export class FirestoreClaimInviteTokenRepository implements ClaimInviteTokenRepository {
  constructor(
    private readonly db: Firestore,
    private readonly collectionPath: string = CLAIM_INVITE_TOKENS_COLLECTION,
  ) {}

  async save(token: ClaimInviteToken): Promise<ClaimInviteToken> {
    await this.collection().doc(token.id).set(toDocument(token), { merge: false });
    return token;
  }

  async getByTokenHash(tokenHash: string): Promise<ClaimInviteToken | null> {
    const snap = await this.collection()
      .where("tokenHash", "==", tokenHash.trim().toLowerCase())
      .limit(1)
      .get();
    const doc = snap.docs[0];
    if (!doc) return null;
    return fromDocument(doc.id, doc.data() as FirestoreClaimInviteTokenDocument);
  }

  async getById(id: string): Promise<ClaimInviteToken | null> {
    const snap = await this.collection().doc(id).get();
    if (!snap.exists) return null;
    return fromDocument(snap.id, snap.data() as FirestoreClaimInviteTokenDocument);
  }

  async markUsed(id: string, usedAt: string): Promise<ClaimInviteToken> {
    const ref = this.collection().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error(`CLAIM_INVITE_TOKEN_NOT_FOUND:${id}`);
    }
    await ref.set({ usedAt }, { merge: true });
    const data = snap.data() as FirestoreClaimInviteTokenDocument;
    return fromDocument(id, { ...data, usedAt });
  }

  private collection() {
    return this.db.collection(this.collectionPath);
  }
}

export function createFirestoreClaimInviteTokenRepository(
  firestore: Firestore,
): FirestoreClaimInviteTokenRepository {
  return new FirestoreClaimInviteTokenRepository(firestore);
}

function toDocument(token: ClaimInviteToken): FirestoreClaimInviteTokenDocument {
  return {
    tokenHash: token.tokenHash,
    institutionId: token.institutionId,
    leadId: token.leadId,
    expiresAt: token.expiresAt,
    createdAt: token.createdAt,
    ...(token.usedAt ? { usedAt: token.usedAt } : {}),
  };
}

function fromDocument(
  id: string,
  data: FirestoreClaimInviteTokenDocument,
): ClaimInviteToken {
  return createClaimInviteToken({
    id,
    tokenHash: data.tokenHash,
    institutionId: data.institutionId,
    leadId: data.leadId,
    expiresAt: data.expiresAt,
    createdAt: data.createdAt,
    usedAt: data.usedAt,
  });
}
