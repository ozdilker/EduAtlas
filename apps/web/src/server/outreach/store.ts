import {
  type CampaignLogRepository,
  type CampaignRecipientRepository,
  type CampaignRepository,
  type CampaignSegmentRepository,
  type CampaignTemplateRepository,
  createDeliveryWorker,
  createEmailDeliveryHandler,
  createInMemoryDeliveryJobRepository,
  createInMemoryDeliverySendBudget,
  createInMemoryOutreachQueue,
  createInMemoryOutreachStores,
  createInMemoryOutreachWarmupSettingsRepository,
  createOutreachService,
  type DeliveryWorker,
  ensureOutreachSeeds,
  loadOutreachDeliveryConfig,
  type OutreachService,
  type OutreachWarmupSettingsRepository,
  resolveMailLogoUrl,
} from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import { createInstitutionId } from "@eduatlas/domain";
import {
  createFirestoreOutreachRepositories,
  createFirestoreOutreachWarmupSettingsRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getBillingProtectionDeps } from "@/server/billing-protection/repository";
import { getInstitutionRepository } from "@/server/institutions/repository";
import { getEmailService } from "@/server/notifications/repository";

type OutreachStores = Readonly<{
  campaignRepository: CampaignRepository;
  recipientRepository: CampaignRecipientRepository;
  templateRepository: CampaignTemplateRepository;
  segmentRepository: CampaignSegmentRepository;
  logRepository: CampaignLogRepository;
}>;

type OutreachRuntime = Readonly<{
  service: OutreachService;
  worker: DeliveryWorker;
  seeded: Promise<void>;
  getStores: () => Promise<OutreachStores>;
  warmupSettingsRepository: OutreachWarmupSettingsRepository;
}>;

declare global {
  // eslint-disable-next-line no-var
  var __eduatlasOutreachDeliveryRuntime: OutreachRuntime | undefined;
}

function canUseFirestoreBackend(): boolean {
  const env = getFirebaseServerEnv();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;
  if (shouldUseFirebaseEmulators(env)) return true;
  return isFirebaseAdminCertConfigured(env) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

async function buildRuntime(): Promise<OutreachRuntime> {
  const config = loadOutreachDeliveryConfig();
  const queue = createInMemoryOutreachQueue();
  const site = getSeoSiteConfig();
  const ctaHref = `${site.siteUrl.replace(/\/+$/, "")}/login`;
  const mailLogoUrl = resolveMailLogoUrl(site.siteUrl);
  const [institutionRepository, billingProtectionDeps] = await Promise.all([
    getInstitutionRepository(),
    getBillingProtectionDeps(),
  ]);

  if (canUseFirestoreBackend()) {
    const db = getAdminFirestore();
    const repos = createFirestoreOutreachRepositories(db);
    const warmupSettingsRepository = createFirestoreOutreachWarmupSettingsRepository(db);
    const emailService = await getEmailService();
    const service = createOutreachService({
      campaignRepository: repos.campaignRepository,
      recipientRepository: repos.recipientRepository,
      templateRepository: repos.templateRepository,
      segmentRepository: repos.segmentRepository,
      logRepository: repos.logRepository,
      queue,
      deliveryJobRepository: repos.deliveryJobRepository,
      institutionRepository,
      deliveryConfig: config,
      mailLogoUrl,
      warmupSettingsRepository,
      billingProtectionRepository: billingProtectionDeps.billingProtectionRepository,
    });
    const worker = createDeliveryWorker({
      config,
      jobRepository: repos.deliveryJobRepository,
      campaignRepository: repos.campaignRepository,
      recipientRepository: repos.recipientRepository,
      budget: repos.deliveryBudget,
      handlers: [
        createEmailDeliveryHandler({
          emailService,
          templateRepository: repos.templateRepository,
          ctaHref,
          mailLogoUrl,
          resolveInstitutionName: async (institutionId) => {
            const inst = await institutionRepository.getById(createInstitutionId(institutionId));
            return inst?.name ?? "Kurumunuz";
          },
        }),
      ],
    });
    const seeded = ensureOutreachSeeds({
      templateRepository: repos.templateRepository,
      segmentRepository: repos.segmentRepository,
      campaignRepository: repos.campaignRepository,
    });
    return {
      service,
      worker,
      seeded,
      warmupSettingsRepository,
      getStores: async () => ({
        campaignRepository: repos.campaignRepository,
        recipientRepository: repos.recipientRepository,
        templateRepository: repos.templateRepository,
        segmentRepository: repos.segmentRepository,
        logRepository: repos.logRepository,
      }),
    };
  }

  const stores = createInMemoryOutreachStores();
  const jobs = createInMemoryDeliveryJobRepository();
  const budget = createInMemoryDeliverySendBudget();
  const warmupSettingsRepository = createInMemoryOutreachWarmupSettingsRepository();
  const emailService = await getEmailService();
  const service = createOutreachService({
    ...stores,
    queue,
    deliveryJobRepository: jobs,
    institutionRepository,
    deliveryConfig: config,
    mailLogoUrl,
    warmupSettingsRepository,
    billingProtectionRepository: billingProtectionDeps.billingProtectionRepository,
  });
  const worker = createDeliveryWorker({
    config,
    jobRepository: jobs,
    campaignRepository: stores.campaignRepository,
    recipientRepository: stores.recipientRepository,
    budget,
    handlers: [
      createEmailDeliveryHandler({
        emailService,
        templateRepository: stores.templateRepository,
        ctaHref,
        mailLogoUrl,
        resolveInstitutionName: async (institutionId) => {
          const inst = await institutionRepository.getById(createInstitutionId(institutionId));
          return inst?.name ?? "Kurumunuz";
        },
      }),
    ],
  });
  const seeded = ensureOutreachSeeds({
    templateRepository: stores.templateRepository,
    segmentRepository: stores.segmentRepository,
    campaignRepository: stores.campaignRepository,
  });
  return {
    service,
    worker,
    seeded,
    warmupSettingsRepository,
    getStores: async () => stores,
  };
}

async function getOutreachRuntime(): Promise<OutreachRuntime> {
  if (!globalThis.__eduatlasOutreachDeliveryRuntime) {
    globalThis.__eduatlasOutreachDeliveryRuntime = await buildRuntime();
  }
  return globalThis.__eduatlasOutreachDeliveryRuntime;
}

export async function getOutreachService(): Promise<OutreachService> {
  const runtime = await getOutreachRuntime();
  await runtime.seeded;
  return runtime.service;
}

export async function getOutreachStores() {
  const runtime = await getOutreachRuntime();
  await runtime.seeded;
  return runtime.getStores();
}

export async function tickOutreachDelivery(now = new Date().toISOString()): Promise<{
  processed: number;
}> {
  const runtime = await getOutreachRuntime();
  await runtime.seeded;
  return runtime.worker.tick(now);
}
