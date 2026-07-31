/**
 * Firestore document shape for `leads` collection.
 */
export type FirestoreLeadDocument = {
  institutionId: string;
  parentName: string;
  phone: string;
  message: string;
  role: string;
  status: string;
  consentAcceptedAt: string;
  consentPolicyVersion: string;
  email?: string;
  preferredContactTime?: string;
  createdAt: string;
  updatedAt: string;
};

export const LEADS_COLLECTION = "leads";
