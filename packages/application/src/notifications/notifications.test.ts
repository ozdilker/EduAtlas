import { NotificationChannel, NotificationStatus, NotificationType } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { createConsoleEmailService } from "./console-email-service";
import { renderEmailTemplate, renderNotificationEmail } from "./email-templates";
import { emitLeadReceived, emitWelcome } from "./emit-notification-events";
import { createInMemoryNotificationRepository } from "./in-memory-notification-repository";
import { createNotificationService } from "./notification-service";

describe("NotificationService", () => {
  it("creates in-app notification and sends email", async () => {
    const notificationRepository = createInMemoryNotificationRepository();
    const emailService = createConsoleEmailService();
    const service = createNotificationService({ notificationRepository, emailService });

    const result = await emitLeadReceived(service, {
      userId: "owner_1",
      email: "owner@eduatlas.dev",
      institutionId: "inst_1",
      institutionName: "Demo Koleji",
      leadId: "lead_1",
      now: "2026-07-15T12:00:00.000Z",
    });

    expect(result.inAppCreated).toBe(true);
    expect(result.emailSent).toBe(true);
    expect(result.notification?.type).toBe(NotificationType.LeadReceived);
    expect(emailService.sent).toHaveLength(1);
    expect(emailService.sent[0]?.text).toContain("Demo Koleji");
    expect(await service.countUnread("owner_1")).toBe(1);
  });

  it("respects preference channel disables", async () => {
    const notificationRepository = createInMemoryNotificationRepository();
    const emailService = createConsoleEmailService();
    const service = createNotificationService({ notificationRepository, emailService });

    await service.updatePreferences({
      userId: "owner_1",
      emailEnabled: false,
      inAppEnabled: true,
      now: "2026-07-15T12:00:00.000Z",
    });

    const result = await emitWelcome(service, {
      userId: "owner_1",
      email: "owner@eduatlas.dev",
      now: "2026-07-15T12:01:00.000Z",
    });

    expect(result.inAppCreated).toBe(true);
    expect(result.emailSent).toBe(false);
    expect(result.notification?.channels).toEqual([NotificationChannel.InApp]);
    expect(emailService.sent).toHaveLength(0);
  });

  it("marks notifications as read", async () => {
    const notificationRepository = createInMemoryNotificationRepository();
    const emailService = createConsoleEmailService();
    const service = createNotificationService({ notificationRepository, emailService });

    const emitted = await emitWelcome(service, {
      userId: "owner_1",
      email: "owner@eduatlas.dev",
    });
    const id = emitted.notification?.id.value;
    expect(id).toBeTruthy();

    const read = await service.markAsRead("owner_1", id as string);
    expect(read?.status).toBe(NotificationStatus.Read);
    expect(await service.countUnread("owner_1")).toBe(0);
  });
});

describe("email templates", () => {
  it("renders EMDS HTML and plain-text fallback", () => {
    const rendered = renderEmailTemplate({
      title: "Test subject",
      preview: "Preview text",
      bodyLines: ["Line one", "Line two"],
      ctaLabel: "Open",
      ctaHref: "https://eduatlas.example/owner",
    });

    expect(rendered.subject).toBe("Test subject");
    expect(rendered.html).toContain("<!DOCTYPE html>");
    expect(rendered.html).toContain('lang="tr"');
    expect(rendered.html).toContain('role="presentation"');
    expect(rendered.html).toContain("max-width:600px");
    expect(rendered.html).toContain("#e62846");
    expect(rendered.html).not.toContain("#0f766e");
    expect(rendered.html).not.toContain("Georgia");
    expect(rendered.text).toContain("Line one");
    expect(rendered.text).toContain("https://eduatlas.example/owner");
  });

  it("maps notification types to subjects", () => {
    const rendered = renderNotificationEmail({
      type: NotificationType.ClaimApproved,
      title: "Sahiplenme onaylandı",
      body: "Kurumunuz onaylandı.",
      href: "/owner",
    });
    expect(rendered.subject).toContain("Sahiplenme");
  });
});

describe("resolveEmailCtaHref", () => {
  it("joins relative paths to a valid origin", async () => {
    const { resolveEmailCtaHref } = await import("./resolve-email-cta-href");
    expect(resolveEmailCtaHref("/owner/onboarding", "https://eduatlas.com.tr")).toBe(
      "https://eduatlas.com.tr/owner/onboarding",
    );
  });

  it("falls back when site base is malformed like http://", async () => {
    const { resolveEmailCtaHref } = await import("./resolve-email-cta-href");
    expect(resolveEmailCtaHref("/owner/onboarding", "http://")).toBe(
      "https://eduatlas.com.tr/owner/onboarding",
    );
  });
});
