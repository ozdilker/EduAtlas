/**
 * Firestore document shape for `claim_requests` collection.
 */
export type FirestoreClaimRequestDocument = {
  institutionId: string;
  applicantName: string;
  role: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  evidenceUrl?: string;
  /** Optional authenticated applicant uid — binding prep only. */
  userId?: string;
  createdAt: string;
  updatedAt: string;
};

export const CLAIM_REQUESTS_COLLECTION = "claim_requests";
