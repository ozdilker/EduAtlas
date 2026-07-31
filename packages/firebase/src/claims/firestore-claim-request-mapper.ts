import {
  type ClaimRequest,
  claimRequestIdAsString,
  createClaimRequest,
  parseClaimApplicantRole,
  parseClaimRequestStatus,
} from "@eduatlas/domain";
import type { FirestoreClaimRequestDocument } from "./firestore-claim-request-document";

/**
 * Maps Firestore claim request documents ⇄ domain ClaimRequest models.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: mirrors lead mapper pattern
export class FirestoreClaimRequestMapper {
  static toDomain(id: string, data: FirestoreClaimRequestDocument): ClaimRequest {
    return createClaimRequest({
      id,
      institutionId: data.institutionId,
      applicantName: data.applicantName,
      role: parseClaimApplicantRole(data.role),
      phone: data.phone,
      email: data.email,
      message: data.message,
      status: parseClaimRequestStatus(data.status),
      evidenceUrl: data.evidenceUrl,
      userId: data.userId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  static toFirestore(claimRequest: ClaimRequest): FirestoreClaimRequestDocument {
    const document: FirestoreClaimRequestDocument = {
      institutionId: claimRequest.institutionId.value,
      applicantName: claimRequest.applicantName,
      role: claimRequest.role,
      phone: claimRequest.phone,
      email: claimRequest.email,
      message: claimRequest.message,
      status: claimRequest.status,
      createdAt: claimRequest.createdAt,
      updatedAt: claimRequest.updatedAt,
    };

    if (claimRequest.evidenceUrl) {
      document.evidenceUrl = claimRequest.evidenceUrl;
    }
    if (claimRequest.userId) {
      document.userId = claimRequest.userId;
    }

    return document;
  }

  static parseDocument(data: Record<string, unknown> | undefined): FirestoreClaimRequestDocument {
    if (!data) {
      throw new Error("Firestore claim request document is empty.");
    }

    return {
      institutionId: readRequiredString(data, "institutionId"),
      applicantName: readRequiredString(data, "applicantName"),
      role: readRequiredString(data, "role"),
      phone: readRequiredString(data, "phone"),
      email: readRequiredString(data, "email"),
      message: readRequiredString(data, "message"),
      status: readRequiredString(data, "status"),
      evidenceUrl: readOptionalString(data, "evidenceUrl"),
      userId: readOptionalString(data, "userId"),
      createdAt: readRequiredString(data, "createdAt"),
      updatedAt: readRequiredString(data, "updatedAt"),
    };
  }

  static toDomainFromUnknown(id: string, data: Record<string, unknown> | undefined): ClaimRequest {
    return FirestoreClaimRequestMapper.toDomain(
      id,
      FirestoreClaimRequestMapper.parseDocument(data),
    );
  }

  static claimRequestDocId(claimRequest: ClaimRequest): string {
    return claimRequestIdAsString(claimRequest.id);
  }
}

function readRequiredString(data: Record<string, unknown>, field: string): string {
  const value = data[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Firestore claim request field "${field}" is required.`);
  }
  return value;
}

function readOptionalString(data: Record<string, unknown>, field: string): string | undefined {
  const value = data[field];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`Firestore claim request field "${field}" must be a string.`);
  }
  return value;
}
