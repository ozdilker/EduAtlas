import {
  CampaignChannel,
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaign,
  createCampaignRecipient,
  createCampaignTemplate,
  createDeliveryJob,
  DeliveryJobStatus,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { createConsoleEmailService } from "../notifications/console-email-service";
import { createInMemoryOutreachStores } from "../outreach/in-memory-outreach-stores";
import { classifySmtpError } from "./classify-smtp-error";
import { loadOutreachDeliveryConfig } from "./delivery-config";
import { createInMemoryDeliverySendBudget } from "./delivery-send-budget";
import { createDeliveryWorker } from "./delivery-worker";
import { createEmailDeliveryHandler } from "./email-delivery-handler";
import { createInMemoryDeliveryJobRepository } from "./in-memory-delivery-job-repository";

const NOW = "2026-08-02T18:00:00.000Z";

describe("classifySmtpError", () => {
  it("detects hard bounce and transient", () => {
    expect(classifySmtpError(new Error("550 5.1.1 user unknown"))).toBe("hard_bounce");
    expect(classifySmtpError(new Error("421 try again later"))).toBe("transient");
    expect(classifySmtpError(new Error("weird"))).toBe("unknown");
  });
});

describe("loadOutreachDeliveryConfig", () => {
  it("uses defaults", () => {
    const cfg = loadOutreachDeliveryConfig({});
    expect(cfg.warmupBatchSize).toBe(20);
    expect(cfg.ratePerMinute).toBe(10);
    expect(cfg.dailySendLimit).toBe(100);
    expect(cfg.maxAttempts).toBe(3);
  });
});

describe("DeliveryWorker", () => {
  it("sends one accepted job and completes campaign", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const budget = createInMemoryDeliverySendBudget();
    const email = createConsoleEmailService();
    const config = loadOutreachDeliveryConfig({
      OUTREACH_RATE_PER_MINUTE: "10",
      OUTREACH_DAILY_SEND_LIMIT: "100",
      OUTREACH_WORKER_INSTANCE_ID: "test-worker",
      OUTREACH_RETRY_DELAY_MS: "3600000",
      OUTREACH_MAX_ATTEMPTS: "3",
      OUTREACH_LOCK_TTL_MS: "300000",
    });

    await stores.templateRepository.save(
      createCampaignTemplate({
        id: "tpl_1",
        name: "T",
        subject: "S {{institutionName}}",
        preview: "P",
        bodyLines: ["Hello"],
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const campaign = createCampaign({
      id: "camp_run",
      name: "Run",
      status: CampaignStatus.Running,
      templateId: "tpl_1",
      segmentId: "seg_1",
      createdAt: NOW,
      createdBy: "admin",
      startedAt: NOW,
    });
    await stores.campaignRepository.save(campaign);

    const recipient = createCampaignRecipient({
      id: "rec_1",
      campaignId: "camp_run",
      institutionId: "inst_1",
      email: "school@example.com",
      status: CampaignRecipientStatus.Queued,
      createdAt: NOW,
      updatedAt: NOW,
    });
    await stores.recipientRepository.save(recipient);

    await jobs.save(
      createDeliveryJob({
        id: "job_1",
        campaignId: "camp_run",
        recipientId: "rec_1",
        institutionId: "inst_1",
        channel: CampaignChannel.Email,
        status: DeliveryJobStatus.Pending,
        availableAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const worker = createDeliveryWorker({
      config,
      jobRepository: jobs,
      campaignRepository: stores.campaignRepository,
      recipientRepository: stores.recipientRepository,
      budget,
      handlers: [
        createEmailDeliveryHandler({
          emailService: email,
          templateRepository: stores.templateRepository,
          ctaHref: "https://eduatlas.com.tr/login",
          resolveInstitutionName: async () => "Demo Okul",
        }),
      ],
    });

    const result = await worker.tick(NOW);
    expect(result.processed).toBe(1);
    expect(email.sent).toHaveLength(1);

    const updatedJob = await jobs.getById("job_1");
    expect(updatedJob?.status).toBe(DeliveryJobStatus.Sent);

    const updatedCampaign = await stores.campaignRepository.getById("camp_run");
    expect(updatedCampaign?.status).toBe(CampaignStatus.Completed);
  });

  it("respects rate limit", async () => {
    const stores = createInMemoryOutreachStores();
    const jobs = createInMemoryDeliveryJobRepository();
    const budget = createInMemoryDeliverySendBudget();
    await budget.recordAcceptedSend(NOW);
    await budget.recordAcceptedSend(NOW);

    const config = loadOutreachDeliveryConfig({
      OUTREACH_RATE_PER_MINUTE: "2",
      OUTREACH_WORKER_INSTANCE_ID: "w",
    });

    await stores.campaignRepository.save(
      createCampaign({
        id: "camp_rate",
        name: "Rate",
        status: CampaignStatus.Running,
        templateId: "tpl_1",
        segmentId: "seg_1",
        createdAt: NOW,
        createdBy: "admin",
        startedAt: NOW,
      }),
    );

    await jobs.save(
      createDeliveryJob({
        id: "job_r",
        campaignId: "camp_rate",
        recipientId: "rec_r",
        institutionId: "inst_r",
        availableAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const worker = createDeliveryWorker({
      config,
      jobRepository: jobs,
      campaignRepository: stores.campaignRepository,
      recipientRepository: stores.recipientRepository,
      budget,
      handlers: [],
    });

    const result = await worker.tick(NOW);
    expect(result.processed).toBe(0);
    expect((await jobs.getById("job_r"))?.status).toBe(DeliveryJobStatus.Pending);
  });
});
