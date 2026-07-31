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
import { createInMemoryOwnerBindingRepository } from "../identity/in-memory-owner-binding-repository";
import type { OwnerAccountProvisioner } from "../identity/owner-account-provisioner";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { EmailService } from "../notifications/email-service";
import { approveClaimRequest } from "./approve-claim-request";
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

  async listRecent(options: { status?: ClaimRequestStatus; limit?: number } = {}) {
    let items = [...this.byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (options.status) {
      items = items.filter((claim) => claim.status === options.status);
    }
    return items.slice(0, options.limit ?? 20);
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

class StubInstitutionRepository implements Pick<InstitutionRepository, "getById" | "update"> {
  private institution;

  constructor(exists: boolean) {
    this.institution = exists
      ? createPublishedInstitution({
          id: "inst_1",
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
        })
      : null;
  }

  async getById(id: ReturnType<typeof createInstitutionId>) {
    if (!this.institution || this.institution.id.value !== id.value) return null;
    return this.institution;
  }

  async update(institution: NonNullable<typeof this.institution>) {
    this.institution = institution;
    return institution;
  }
}

describe("submitClaimRequest application service", () => {
  it("stores a valid claim request as pending through the repository", async () => {
    const claimRequestRepository = new InMemoryClaimRequestRepository();
    const institutionRepository = new StubInstitutionRepository(
      true,
    ) as unknown as InstitutionRepository;
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
        institutionRepository,
      },
    );

    expect(result.claimRequest.status).toBe(ClaimRequestStatus.Pending);
    expect(await claimRequestRepository.getById(result.claimRequest.id)).not.toBeNull();
    const updatedInstitution = await institutionRepository.getById(
      result.claimRequest.institutionId,
    );
    expect(updatedInstitution?.verification).toBe(InstitutionVerification.Pending);
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

describe("approveClaimRequest application service", () => {
  it("approves claim, verifies institution, binds owner, and emails credentials", async () => {
    const claimRequestRepository = new InMemoryClaimRequestRepository();
    const institutionRepository = new StubInstitutionRepository(
      true,
    ) as unknown as InstitutionRepository;
    const ownerBindingRepository = createInMemoryOwnerBindingRepository();
    const sent: Array<{ to: string; subject: string; text: string }> = [];
    const emailService: EmailService = {
      async send(input) {
        sent.push({ to: input.to, subject: input.subject, text: input.text });
        return { messageId: input.messageId ?? "msg_1", accepted: true };
      },
    };
    const provisioner: OwnerAccountProvisioner = {
      async provisionOwnerWithPassword(input) {
        return { userId: "uid_owner_1", email: input.email, created: true };
      },
      async changePassword() {},
      async changeEmail() {},
    };

    const submitted = await submitClaimRequest(
      {
        institutionId: "inst_1",
        applicantName: "Ayşe Demir",
        phone: "+90 532 111 22 33",
        email: "ayse@example.com",
        message: "Kurum sahibi olarak sahiplenmek istiyorum.",
        role: "owner",
        claimRequestId: "claim_approve_1",
        now: "2026-07-31T10:00:00.000Z",
      },
      { claimRequestRepository, institutionRepository },
    );

    const result = await approveClaimRequest(
      {
        claimRequestId: claimRequestIdAsString(submitted.claimRequest.id),
        institutionId: "inst_1",
        reviewedBy: "admin_1",
        siteBaseUrl: "https://eduatlas.com.tr",
        now: "2026-07-31T12:00:00.000Z",
      },
      {
        claimRequestRepository,
        institutionRepository,
        ownerBindingRepository,
        ownerAccountProvisioner: provisioner,
        emailService,
      },
    );

    expect(result.claimRequest.status).toBe(ClaimRequestStatus.Approved);
    expect(result.institution.verification).toBe(InstitutionVerification.Verified);
    expect(result.binding.status).toBe("approved");
    expect(result.binding.userId).toBe("uid_owner_1");
    expect(result.ownerEmail).toBe("ayse@example.com");
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(10);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe("ayse@example.com");
    expect(sent[0]?.text).toContain(result.temporaryPassword);
    expect(sent[0]?.text).toContain("https://eduatlas.com.tr/login");
  });

  it("rejects already processed claims", async () => {
    const claimRequestRepository = new InMemoryClaimRequestRepository();
    const institutionRepository = new StubInstitutionRepository(
      true,
    ) as unknown as InstitutionRepository;
    const submitted = await submitClaimRequest(
      {
        institutionId: "inst_1",
        applicantName: "Ayşe Demir",
        phone: "+90 532 111 22 33",
        email: "ayse@example.com",
        message: "Kurum sahibi olarak sahiplenmek istiyorum.",
        claimRequestId: "claim_approve_2",
        now: "2026-07-31T10:00:00.000Z",
      },
      { claimRequestRepository, institutionRepository },
    );
    await claimRequestRepository.updateStatus(
      submitted.claimRequest.id,
      ClaimRequestStatus.Approved,
    );

    await expect(
      approveClaimRequest(
        { claimRequestId: claimRequestIdAsString(submitted.claimRequest.id) },
        {
          claimRequestRepository,
          institutionRepository,
          ownerBindingRepository: createInMemoryOwnerBindingRepository(),
          ownerAccountProvisioner: {
            async provisionOwnerWithPassword(input) {
              return { userId: "uid", email: input.email, created: true };
            },
            async changePassword() {},
            async changeEmail() {},
          },
          emailService: {
            async send() {
              return { messageId: "x", accepted: true };
            },
          },
        },
      ),
    ).rejects.toBeInstanceOf(ClaimValidationError);
  });
});
