import {
  createLead,
  type Lead,
  leadIdAsString,
  parseLeadRole,
  parseLeadStatus,
} from "@eduatlas/domain";
import type { FirestoreLeadDocument } from "./firestore-lead-document";

/**
 * Maps Firestore lead documents ⇄ domain Lead models.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: mirrors institution mapper pattern
export class FirestoreLeadMapper {
  static toDomain(id: string, data: FirestoreLeadDocument): Lead {
    return createLead({
      id,
      institutionId: data.institutionId,
      parentName: data.parentName,
      phone: data.phone,
      message: data.message,
      role: parseLeadRole(data.role),
      status: parseLeadStatus(data.status),
      consentAcceptedAt: data.consentAcceptedAt,
      consentPolicyVersion: data.consentPolicyVersion,
      email: data.email,
      preferredContactTime: data.preferredContactTime,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  static toFirestore(lead: Lead): FirestoreLeadDocument {
    const document: FirestoreLeadDocument = {
      institutionId: lead.institutionId.value,
      parentName: lead.parentName,
      phone: lead.phone,
      message: lead.message,
      role: lead.role,
      status: lead.status,
      consentAcceptedAt: lead.consentAcceptedAt,
      consentPolicyVersion: lead.consentPolicyVersion,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };

    if (lead.email) {
      document.email = lead.email;
    }
    if (lead.preferredContactTime) {
      document.preferredContactTime = lead.preferredContactTime;
    }

    return document;
  }

  static parseDocument(data: Record<string, unknown> | undefined): FirestoreLeadDocument {
    if (!data) {
      throw new Error("Firestore lead document is empty.");
    }

    return {
      institutionId: readRequiredString(data, "institutionId"),
      parentName: readRequiredString(data, "parentName"),
      phone: readRequiredString(data, "phone"),
      message: readRequiredString(data, "message"),
      role: readRequiredString(data, "role"),
      status: readRequiredString(data, "status"),
      consentAcceptedAt: readRequiredString(data, "consentAcceptedAt"),
      consentPolicyVersion: readRequiredString(data, "consentPolicyVersion"),
      email: readOptionalString(data, "email"),
      preferredContactTime: readOptionalString(data, "preferredContactTime"),
      createdAt: readRequiredString(data, "createdAt"),
      updatedAt: readRequiredString(data, "updatedAt"),
    };
  }

  static toDomainFromUnknown(id: string, data: Record<string, unknown> | undefined): Lead {
    return FirestoreLeadMapper.toDomain(id, FirestoreLeadMapper.parseDocument(data));
  }

  static leadDocId(lead: Lead): string {
    return leadIdAsString(lead.id);
  }
}

function readRequiredString(data: Record<string, unknown>, field: string): string {
  const value = data[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Firestore lead field "${field}" is required.`);
  }
  return value;
}

function readOptionalString(data: Record<string, unknown>, field: string): string | undefined {
  const value = data[field];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`Firestore lead field "${field}" must be a string.`);
  }
  return value;
}
