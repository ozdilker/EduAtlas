import { createInstitutionId, type InstitutionId } from "../institution/institution-id";
import { ClaimApplicantRole, parseClaimApplicantRole } from "./claim-applicant-role";
import { type ClaimRequestId, createClaimRequestId } from "./claim-request-id";
import { ClaimRequestStatus, parseClaimRequestStatus } from "./claim-request-status";

/**
 * Canonical ClaimRequest aggregate — ownership request for an institution profile.
 */
export type ClaimRequest = Readonly<{
  readonly id: ClaimRequestId;
  readonly institutionId: InstitutionId;
  readonly applicantName: string;
  readonly role: ClaimApplicantRole;
  readonly phone: string;
  readonly email: string;
  readonly message: string;
  readonly status: ClaimRequestStatus;
  readonly evidenceUrl?: string;
  /**
   * Optional Firebase Auth uid when the applicant is authenticated.
   * Prepared for claim → owner binding; never auto-binds on submit.
   */
  readonly userId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}>;

export type CreateClaimRequestInput = {
  id: string;
  institutionId: string;
  applicantName: string;
  role?: ClaimApplicantRole | string;
  phone: string;
  email: string;
  message: string;
  status?: ClaimRequestStatus | string;
  evidenceUrl?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
};

const PHONE_PATTERN = /^[+0-9()\s-]{7,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/.+/i;

/**
 * Creates an immutable ClaimRequest entity.
 */
export function createClaimRequest(input: CreateClaimRequestInput): ClaimRequest {
  const applicantName = input.applicantName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();
  const evidenceUrl = input.evidenceUrl?.trim();
  const userId = input.userId?.trim();
  const role =
    typeof input.role === "string" || input.role === undefined
      ? parseClaimApplicantRole(input.role ?? ClaimApplicantRole.Owner)
      : input.role;
  const status =
    typeof input.status === "string" || input.status === undefined
      ? parseClaimRequestStatus(input.status ?? ClaimRequestStatus.Pending)
      : input.status;

  if (!applicantName) {
    throw new Error("ClaimRequest.applicantName is required.");
  }

  if (applicantName.length > 120) {
    throw new Error("ClaimRequest.applicantName must be at most 120 characters.");
  }

  if (!phone || !PHONE_PATTERN.test(phone)) {
    throw new Error("ClaimRequest.phone must be a valid phone number.");
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new Error("ClaimRequest.email must be a valid email address.");
  }

  if (!message) {
    throw new Error("ClaimRequest.message is required.");
  }

  if (message.length > 2000) {
    throw new Error("ClaimRequest.message must be at most 2000 characters.");
  }

  if (evidenceUrl) {
    if (evidenceUrl.length > 2000) {
      throw new Error("ClaimRequest.evidenceUrl must be at most 2000 characters.");
    }
    if (!URL_PATTERN.test(evidenceUrl)) {
      throw new Error("ClaimRequest.evidenceUrl must be an http(s) URL.");
    }
  }

  if (userId !== undefined && !userId) {
    throw new Error("ClaimRequest.userId must be non-empty when provided.");
  }

  assertIsoTimestamp(input.createdAt, "createdAt");
  assertIsoTimestamp(input.updatedAt, "updatedAt");

  return Object.freeze({
    id: createClaimRequestId(input.id),
    institutionId: createInstitutionId(input.institutionId),
    applicantName,
    role,
    phone,
    email,
    message,
    status,
    ...(evidenceUrl ? { evidenceUrl } : {}),
    ...(userId ? { userId } : {}),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

function assertIsoTimestamp(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`ClaimRequest.${field} must be a valid ISO timestamp.`);
  }
}
