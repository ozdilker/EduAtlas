import {
  createInMemoryClaimInviteEmailRateLimitStore,
  createInMemoryMailDeliveryLogRepository,
  EDUATLAS_MAIL_FROM_DEFAULT,
  sendInstitutionClaimInviteEmail,
  type ClaimInviteEmailRateLimitStore,
  type MailDeliveryLogRepository,
} from "@eduatlas/application";
import type { Institution, Lead } from "@eduatlas/domain";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  createFirestoreClaimInviteEmailRateLimitStore,
  createFirestoreMailDeliveryLogRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";
import { getEmailService } from "@/server/notifications/repository";
import { getClaimInviteTokenRepository } from "@/server/claims/claim-invite-token-repository";
import { getSeoSiteConfig } from "@/lib/seo-site";

let mailDeliveryLogRepositoryPromise: Promise<MailDeliveryLogRepository> | undefined;
let rateLimitStorePromise: Promise<ClaimInviteEmailRateLimitStore> | undefined;

function canUseFirebaseBackend(): boolean {
  const env = getFirebaseServerEnv();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return false;
  }
  if (shouldUseFirebaseEmulators(env)) {
    return true;
  }
  return isFirebaseAdminCertConfigured(env) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

export function getMailDeliveryLogRepository(): Promise<MailDeliveryLogRepository> {
  if (!mailDeliveryLogRepositoryPromise) {
    mailDeliveryLogRepositoryPromise = Promise.resolve(
      canUseFirebaseBackend()
        ? createFirestoreMailDeliveryLogRepository(getAdminFirestore())
        : createInMemoryMailDeliveryLogRepository(),
    );
  }
  return mailDeliveryLogRepositoryPromise;
}

export function getClaimInviteEmailRateLimitStore(): Promise<ClaimInviteEmailRateLimitStore> {
  if (!rateLimitStorePromise) {
    rateLimitStorePromise = Promise.resolve(
      canUseFirebaseBackend()
        ? createFirestoreClaimInviteEmailRateLimitStore(getAdminFirestore())
        : createInMemoryClaimInviteEmailRateLimitStore(),
    );
  }
  return rateLimitStorePromise;
}

/**
 * Fail-open claim-invite sender wired for submitLead.
 * From address is always info@eduatlas.com (override via EDUATLAS_MAIL_FROM).
 */
export async function sendClaimInviteEmailAfterLead(input: {
  lead: Lead;
  institution: Institution;
}): Promise<void> {
  const [emailService, claimInviteTokenRepository, mailDeliveryLogRepository, rateLimitStore] =
    await Promise.all([
      getEmailService(),
      getClaimInviteTokenRepository(),
      getMailDeliveryLogRepository(),
      getClaimInviteEmailRateLimitStore(),
    ]);

  const site = getSeoSiteConfig();
  const mailFrom = process.env.EDUATLAS_MAIL_FROM?.trim() || EDUATLAS_MAIL_FROM_DEFAULT;

  await sendInstitutionClaimInviteEmail(
    {
      lead: input.lead,
      institution: input.institution,
      siteBaseUrl: site.siteUrl,
      mailFrom,
    },
    {
      emailService,
      claimInviteTokenRepository,
      mailDeliveryLogRepository,
      rateLimitStore,
    },
  );
}
