import {
  createInstitution,
  createLead,
  InstitutionStatus,
  type Lead,
  LeadRole,
  LeadStatus,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { createInMemoryClaimInviteTokenRepository } from "../claims/in-memory-claim-invite-token-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { LeadRepository } from "../leads/lead-repository";
import { submitLead } from "../leads/submit-lead";
import { ConsoleEmailService } from "./console-email-service";
import { EDUATLAS_MAIL_FROM_DEFAULT } from "./email-service";
import {
  createInMemoryClaimInviteEmailRateLimitStore,
  createInMemoryMailDeliveryLogRepository,
} from "./in-memory-mail-delivery";
import { sendInstitutionClaimInviteEmail } from "./send-institution-claim-invite-email";

function makeInstitution(email?: string) {
  return createInstitution({
    id: "seed_inst_claim_1",
    name: "Örnek Kolej",
    slug: "ornek-kolej-claim",
    primaryType: "private_school",
    status: InstitutionStatus.Published,
    location: {
      cityId: "city_istanbul",
      districtId: "dist_kadikoy",
      address: "Kadıköy",
    },
    contact: email ? { email } : {},
    shortDescription: "Test kurum kısa açıklaması buraya yazılır.",
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    publishedAt: "2026-07-01T09:00:00.000Z",
  });
}

function makeLead(institutionId: string) {
  return createLead({
    id: "lead_claim_invite_1",
    institutionId,
    parentName: "Ayşe Yılmaz",
    phone: "+90 532 000 00 00",
    message: "Bilgi almak istiyorum",
    role: LeadRole.Parent,
    status: LeadStatus.New,
    consentAcceptedAt: "2026-07-29T10:00:00.000Z",
    consentPolicyVersion: "kvkk-lead-v1",
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-07-29T10:00:00.000Z",
  });
}

describe("sendInstitutionClaimInviteEmail", () => {
  it("sends from info@eduatlas.com with claim CTA", async () => {
    const emailService = new ConsoleEmailService();
    const tokens = createInMemoryClaimInviteTokenRepository();
    const logs = createInMemoryMailDeliveryLogRepository();
    const rate = createInMemoryClaimInviteEmailRateLimitStore();
    const institution = makeInstitution("kurum@example.com");
    const lead = makeLead(institution.id.value);

    const result = await sendInstitutionClaimInviteEmail(
      { lead, institution, now: "2026-07-29T12:00:00.000Z", siteBaseUrl: "https://eduatlas.com" },
      {
        emailService,
        claimInviteTokenRepository: tokens,
        mailDeliveryLogRepository: logs,
        rateLimitStore: rate,
      },
    );

    expect(result.status).toBe("sent");
    expect(emailService.sent).toHaveLength(1);
    expect(emailService.sent[0]?.from).toBe(EDUATLAS_MAIL_FROM_DEFAULT);
    expect(emailService.sent[0]?.to).toBe("kurum@example.com");
    expect(emailService.sent[0]?.html).toContain("Kurumumu Sahiplen");
    expect(emailService.sent[0]?.html).toContain("/claim?token=");
    expect(logs.logs[0]?.status).toBe("sent");
  });

  it("skips when institution has no email", async () => {
    const emailService = new ConsoleEmailService();
    const result = await sendInstitutionClaimInviteEmail(
      {
        lead: makeLead("seed_inst_claim_1"),
        institution: makeInstitution(),
        now: "2026-07-29T12:00:00.000Z",
      },
      {
        emailService,
        claimInviteTokenRepository: createInMemoryClaimInviteTokenRepository(),
        mailDeliveryLogRepository: createInMemoryMailDeliveryLogRepository(),
        rateLimitStore: createInMemoryClaimInviteEmailRateLimitStore(),
      },
    );
    expect(result.status).toBe("skipped");
    expect(result.skipReason).toBe("missing_institution_email");
    expect(emailService.sent).toHaveLength(0);
  });

  it("rate limits to one email per 24h", async () => {
    const emailService = new ConsoleEmailService();
    const tokens = createInMemoryClaimInviteTokenRepository();
    const logs = createInMemoryMailDeliveryLogRepository();
    const rate = createInMemoryClaimInviteEmailRateLimitStore();
    const institution = makeInstitution("kurum@example.com");
    const lead = makeLead(institution.id.value);
    const deps = {
      emailService,
      claimInviteTokenRepository: tokens,
      mailDeliveryLogRepository: logs,
      rateLimitStore: rate,
    };

    await sendInstitutionClaimInviteEmail(
      { lead, institution, now: "2026-07-29T12:00:00.000Z" },
      deps,
    );
    const second = await sendInstitutionClaimInviteEmail(
      { lead, institution, now: "2026-07-29T18:00:00.000Z" },
      deps,
    );

    expect(second.status).toBe("skipped");
    expect(second.skipReason).toBe("rate_limited");
    expect(emailService.sent).toHaveLength(1);
  });
});

describe("submitLead claim-invite fail-open", () => {
  it("returns lead even when claim invite throws", async () => {
    const institution = makeInstitution("kurum@example.com");
    const leads = new Map<string, Lead>();

    const leadRepository: LeadRepository = {
      async getById() {
        return null;
      },
      async listByInstitutionId() {
        return [];
      },
      async save(lead) {
        leads.set(lead.id.value, lead);
        return lead;
      },
      async updateStatus() {
        throw new Error("unused");
      },
    };

    const institutionRepository: InstitutionRepository = {
      async getById() {
        return institution;
      },
      async getBySlug() {
        return null;
      },
      async list() {
        return { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };
      },
      async save() {
        throw new Error("unused");
      },
      async update() {
        throw new Error("unused");
      },
      async delete() {
        throw new Error("unused");
      },
    };

    const result = await submitLead(
      {
        institutionId: institution.id.value,
        parentName: "Test Parent",
        phone: "+90 532 111 22 33",
        message: "Merhaba bilgi almak istiyorum",
        consentAccepted: true,
        now: "2026-07-29T12:00:00.000Z",
        leadId: "lead_fail_open_1",
      },
      {
        leadRepository,
        institutionRepository,
        sendClaimInviteEmail: async () => {
          throw new Error("mail boom");
        },
      },
    );

    expect(result.lead.id.value).toBe("lead_fail_open_1");
  });
});
