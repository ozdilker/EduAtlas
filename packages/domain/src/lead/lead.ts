import { createInstitutionId, type InstitutionId } from "../institution/institution-id";
import { createLeadId, type LeadId } from "./lead-id";
import { LeadRole, parseLeadRole } from "./lead-role";
import { LeadStatus, parseLeadStatus } from "./lead-status";

/**
 * Canonical Lead aggregate (information request / conversion).
 */
export type Lead = Readonly<{
  readonly id: LeadId;
  readonly institutionId: InstitutionId;
  readonly parentName: string;
  readonly phone: string;
  readonly message: string;
  readonly role: LeadRole;
  readonly status: LeadStatus;
  readonly consentAcceptedAt: string;
  readonly consentPolicyVersion: string;
  readonly email?: string;
  readonly preferredContactTime?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}>;

export type CreateLeadInput = {
  id: string;
  institutionId: string;
  parentName: string;
  phone: string;
  message: string;
  role?: LeadRole | string;
  status?: LeadStatus | string;
  consentAcceptedAt: string;
  consentPolicyVersion?: string;
  email?: string;
  preferredContactTime?: string;
  createdAt: string;
  updatedAt: string;
};

const PHONE_PATTERN = /^[+0-9()\s-]{7,20}$/;
const DEFAULT_CONSENT_POLICY_VERSION = "kvkk-lead-v1";

/**
 * Creates an immutable Lead entity.
 */
export function createLead(input: CreateLeadInput): Lead {
  const parentName = input.parentName.trim();
  const phone = input.phone.trim();
  const message = input.message.trim();
  const email = input.email?.trim();
  const preferredContactTime = input.preferredContactTime?.trim();
  const consentPolicyVersion = (
    input.consentPolicyVersion?.trim() || DEFAULT_CONSENT_POLICY_VERSION
  ).trim();
  const role =
    typeof input.role === "string" || input.role === undefined
      ? parseLeadRole(input.role ?? LeadRole.Parent)
      : input.role;
  const status =
    typeof input.status === "string" || input.status === undefined
      ? parseLeadStatus(input.status ?? LeadStatus.New)
      : input.status;

  if (!parentName) {
    throw new Error("Lead.parentName is required.");
  }

  if (parentName.length > 120) {
    throw new Error("Lead.parentName must be at most 120 characters.");
  }

  if (!phone || !PHONE_PATTERN.test(phone)) {
    throw new Error("Lead.phone must be a valid phone number.");
  }

  if (!message) {
    throw new Error("Lead.message is required.");
  }

  if (message.length > 2000) {
    throw new Error("Lead.message must be at most 2000 characters.");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Lead.email must be a valid email address.");
  }

  assertIsoTimestamp(input.consentAcceptedAt, "consentAcceptedAt");
  assertIsoTimestamp(input.createdAt, "createdAt");
  assertIsoTimestamp(input.updatedAt, "updatedAt");

  return Object.freeze({
    id: createLeadId(input.id),
    institutionId: createInstitutionId(input.institutionId),
    parentName,
    phone,
    message,
    role,
    status,
    consentAcceptedAt: input.consentAcceptedAt,
    consentPolicyVersion,
    ...(email ? { email } : {}),
    ...(preferredContactTime ? { preferredContactTime } : {}),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

function assertIsoTimestamp(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Lead.${field} must be a valid ISO timestamp.`);
  }
}
