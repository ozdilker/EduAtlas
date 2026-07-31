import type { ClaimRequestRepository } from "@eduatlas/application";
import {
  ClaimApplicantRole,
  ClaimRequestStatus,
  claimRequestIdAsString,
  createClaimRequest,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { FirestoreClaimRequestMapper } from "./firestore-claim-request-mapper";
import { FirestoreClaimRequestRepository } from "./firestore-claim-request-repository";
import { InMemoryClaimRequestDocumentStore } from "./in-memory-claim-request-document-store";

function buildClaimRequest() {
  return createClaimRequest({
    id: "claim_1",
    institutionId: "seed_inst_ist_kolej_1",
    applicantName: "Ahmet Yılmaz",
    role: ClaimApplicantRole.Owner,
    phone: "+90 532 000 11 22",
    email: "ahmet@example.com",
    message: "Kurum sahibi olarak profili sahiplenmek istiyorum.",
    status: ClaimRequestStatus.Pending,
    evidenceUrl: "https://example.com/proof.pdf",
    createdAt: "2026-07-14T15:00:00.000Z",
    updatedAt: "2026-07-14T15:00:00.000Z",
  });
}

describe("FirestoreClaimRequestRepository", () => {
  it("round-trips through mapper and repository contracts", async () => {
    const claimRequest = buildClaimRequest();
    const document = FirestoreClaimRequestMapper.toFirestore(claimRequest);
    expect(document.institutionId).toBe("seed_inst_ist_kolej_1");
    expect(document.status).toBe("pending");

    const repo: ClaimRequestRepository = new FirestoreClaimRequestRepository({
      store: new InMemoryClaimRequestDocumentStore(),
    });

    await repo.save(claimRequest);
    expect((await repo.getById(claimRequest.id))?.applicantName).toBe("Ahmet Yılmaz");

    const listed = await repo.listByInstitutionId("seed_inst_ist_kolej_1");
    expect(listed).toHaveLength(1);
    const first = listed[0];
    expect(first).toBeDefined();
    if (first) {
      expect(claimRequestIdAsString(first.id)).toBe("claim_1");
    }

    const approved = await repo.updateStatus(claimRequest.id, ClaimRequestStatus.Approved);
    expect(approved.status).toBe(ClaimRequestStatus.Approved);
  });
});
