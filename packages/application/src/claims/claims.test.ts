import {
  type ClaimRequest,
  ClaimRequestStatus,
  claimRequestIdAsString,
  type createInstitutionId,
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { ClaimRequestRepository } from "./claim-request-repository";
import { ClaimSpamRejectedError, ClaimValidationError } from "./errors";
import { submitClaimRequest } from "./submit-claim-request";

class InMemoryClaimRequestRepository implements ClaimRequestRepository {
  private readonly byId = new Map<string, ClaimRequest>();

  async getById(id: Parameters<ClaimRequestRepository["getById"]>[0]) {
    return this.byId.get(claimRequestIdAsString(id)) ?? null;
  }

  async listByInstitutionId(institutionId: string) {
    return [...this.byId.values()].filter((claim) => claim.institutionId.value === institutionId);
  }

  async save(claimRequest: ClaimRequest) {
    this.byId.set(claimRequestIdAsString(claimRequest.id), claimRequest);
    return claimRequest;
  }

  async updateStatus(
    id: Parameters<ClaimRequestRepository["updateStatus"]>[0],
    status: ClaimRequestStatus,
  ) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("missing");
    }
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    this.byId.set(claimRequestIdAsString(id), updated as ClaimRequest);
    return updated as ClaimRequest;
  }
}

class StubInstitutionRepository implements Pick<InstitutionRepository, "getById"> {
  constructor(private readonly exists: boolean) {}

  async getById(id: ReturnType<typeof createInstitutionId>) {
    if (!this.exists) return null;
    return createPublishedInstitution({
      id: id.value,
      name: "Test Kurum",
      slug: "test-kurum",
      primaryType: InstitutionType.Kindergarten,
      verification: InstitutionVerification.Unclaimed,
      location: {
        cityId: "city_istanbul",
        districtId: "dist_kadikoy",
        address: "Test",
      },
      shortDescription: "Test açıklama",
      publishedAt: "2026-07-14T10:00:00.000Z",
      createdAt: "2026-07-14T10:00:00.000Z",
      updatedAt: "2026-07-14T10:00:00.000Z",
    });
  }
}

describe("submitClaimRequest application service", () => {
  it("stores a valid claim request as pending through the repository", async () => {
    const claimRequestRepository = new InMemoryClaimRequestRepository();
    const result = await submitClaimRequest(
      {
        institutionId: "inst_1",
        applicantName: "Ahmet Yılmaz",
        phone: "+90 532 111 22 33",
        email: "ahmet@example.com",
        message: "Kurum sahibi olarak sahiplenmek istiyorum.",
        role: "owner",
        claimRequestId: "claim_test_1",
        now: "2026-07-14T15:00:00.000Z",
      },
      {
        claimRequestRepository,
        institutionRepository: new StubInstitutionRepository(
          true,
        ) as unknown as InstitutionRepository,
      },
    );

    expect(result.claimRequest.status).toBe(ClaimRequestStatus.Pending);
    expect(await claimRequestRepository.getById(result.claimRequest.id)).not.toBeNull();
  });

  it("rejects honeypot spam and invalid payloads", async () => {
    const deps = {
      claimRequestRepository: new InMemoryClaimRequestRepository(),
      institutionRepository: new StubInstitutionRepository(
        true,
      ) as unknown as InstitutionRepository,
    };

    await expect(
      submitClaimRequest(
        {
          institutionId: "inst_1",
          applicantName: "Bot",
          phone: "+90 532 111 22 33",
          email: "bot@example.com",
          message: "spam",
          honeypot: "http://spam.example",
        },
        deps,
      ),
    ).rejects.toBeInstanceOf(ClaimSpamRejectedError);

    await expect(
      submitClaimRequest(
        {
          institutionId: "inst_1",
          applicantName: "Ahmet",
          phone: "+90 532 111 22 33",
          email: "bad-email",
          message: "Merhaba",
        },
        deps,
      ),
    ).rejects.toBeInstanceOf(ClaimValidationError);
  });
});
