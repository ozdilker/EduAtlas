import { createHash, randomBytes } from "node:crypto";
import {
  createClaimInviteToken,
  createMailDeliveryLog,
  type Institution,
  institutionIdAsString,
  type Lead,
  leadIdAsString,
  MAIL_NOTIFICATION_KIND_CLAIM_INVITE,
} from "@eduatlas/domain";
import type { ClaimInviteTokenRepository } from "../claims/claim-invite-token-repository";
import {
  EDUATLAS_MAIL_FROM_DEFAULT,
  type EmailService,
} from "./email-service";
import { renderEmailTemplate } from "./email-templates";
import type {
  ClaimInviteEmailRateLimitStore,
  MailDeliveryLogRepository,
} from "./mail-delivery-log-repository";

export const CLAIM_INVITE_RATE_LIMIT_MS = 24 * 60 * 60 * 1000;
export const CLAIM_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SendInstitutionClaimInviteEmailInput = {
  lead: Lead;
  institution: Institution;
  now?: string;
  siteBaseUrl?: string;
  mailFrom?: string;
};

export type SendInstitutionClaimInviteEmailDependencies = {
  emailService: EmailService;
  claimInviteTokenRepository: ClaimInviteTokenRepository;
  mailDeliveryLogRepository: MailDeliveryLogRepository;
  rateLimitStore: ClaimInviteEmailRateLimitStore;
};

export type SendInstitutionClaimInviteEmailResult = Readonly<{
  readonly status: "sent" | "failed" | "skipped";
  readonly skipReason?: string;
}>;

/**
 * Fail-open growth email: invite institution contact to claim after a lead is saved.
 * Never throws to the caller for delivery failures (caller should still wrap in try/catch).
 */
export async function sendInstitutionClaimInviteEmail(
  input: SendInstitutionClaimInviteEmailInput,
  deps: SendInstitutionClaimInviteEmailDependencies,
): Promise<SendInstitutionClaimInviteEmailResult> {
  const nowIso = input.now ?? new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const institutionId = institutionIdAsString(input.institution.id);
  const leadId = leadIdAsString(input.lead.id);
  const to = input.institution.contact.email?.trim();
  const from = (input.mailFrom?.trim() || EDUATLAS_MAIL_FROM_DEFAULT).toLowerCase();
  const siteBaseUrl = (input.siteBaseUrl?.trim() || "https://eduatlas.com.tr").replace(/\/+$/, "");
  let origin = siteBaseUrl;
  try {
    const parsed = new URL(siteBaseUrl.includes("://") ? siteBaseUrl : `https://${siteBaseUrl}`);
    origin = parsed.hostname ? `${parsed.protocol}//${parsed.host}` : "https://eduatlas.com.tr";
  } catch {
    origin = "https://eduatlas.com.tr";
  }
  if (!origin || origin === "http:" || origin === "https:" || origin.endsWith("://")) {
    origin = "https://eduatlas.com.tr";
  }
  const provider = deps.emailService.providerName?.trim() || "unknown";

  const persistLog = async (
    status: "sent" | "failed" | "skipped",
    extra?: { skipReason?: string; errorMessage?: string },
  ) => {
    try {
      await deps.mailDeliveryLogRepository.save(
        createMailDeliveryLog({
          id: `mdl_${randomId()}`,
          leadId,
          institutionId,
          status,
          provider,
          attemptedAt: nowIso,
          notificationKind: MAIL_NOTIFICATION_KIND_CLAIM_INVITE,
          skipReason: extra?.skipReason,
          errorMessage: extra?.errorMessage,
          retryCount: 0,
        }),
      );
    } catch {
      // Logging must never break lead flow.
    }
  };

  if (!to) {
    await persistLog("skipped", { skipReason: "missing_institution_email" });
    return Object.freeze({ status: "skipped", skipReason: "missing_institution_email" });
  }

  try {
    const lastSentAt = await deps.rateLimitStore.getLastSentAt(institutionId);
    if (lastSentAt) {
      const lastMs = Date.parse(lastSentAt);
      if (!Number.isNaN(lastMs) && nowMs - lastMs < CLAIM_INVITE_RATE_LIMIT_MS) {
        await persistLog("skipped", { skipReason: "rate_limited" });
        return Object.freeze({ status: "skipped", skipReason: "rate_limited" });
      }
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = hashClaimInviteToken(rawToken);
    const expiresAt = new Date(nowMs + CLAIM_INVITE_TOKEN_TTL_MS).toISOString();
    const token = createClaimInviteToken({
      id: `cit_${randomId()}`,
      tokenHash,
      institutionId,
      leadId,
      expiresAt,
      createdAt: nowIso,
    });
    await deps.claimInviteTokenRepository.save(token);

    const claimHref = `${origin}/claim?token=${encodeURIComponent(rawToken)}`;
    const rendered = renderEmailTemplate({
      title: "EduAtlas — Kurumunuz için yeni bilgi talebi",
      preview: "Veliler kurumunuzu EduAtlas üzerinden arıyor. Profilinizi ücretsiz sahiplenin.",
      bodyLines: [
        "Merhaba,",
        `Bugün EduAtlas üzerinden ${input.institution.name} hakkında bilgi almak isteyen bir veli yeni bir talep oluşturdu.`,
        "Talebi görüntülemek ve profilinizi yönetmek için kurumunuzu ücretsiz sahiplenebilirsiniz.",
        "EduAtlas nedir? Türkiye genelinde eğitim kurumlarını keşfetmek ve iletişime geçmek için kullanılan bir platformdur.",
        "Kurum profilinizi neden sahiplenmelisiniz?",
        "• Profilinizi ücretsiz güncelleyebilirsiniz.",
        "• Doğrulanmış Kurum rozeti alabilirsiniz.",
        "• Velilere güncel bilgiler sunabilirsiniz.",
      ],
      ctaLabel: "Kurumumu Sahiplen",
      ctaHref: claimHref,
    });

    await deps.emailService.send({
      from,
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      messageId: `claim_invite_${leadId}`,
    });

    await deps.rateLimitStore.setLastSentAt(institutionId, nowIso);
    await persistLog("sent");
    return Object.freeze({ status: "sent" as const });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await persistLog("failed", { errorMessage: message });
    return Object.freeze({ status: "failed" as const });
  }
}

export function hashClaimInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken.trim(), "utf8").digest("hex");
}

function randomId(): string {
  return randomBytes(12).toString("hex");
}
