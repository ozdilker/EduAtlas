import {
  createNotification,
  createNotificationPreference,
  defaultNotificationPreference,
  isChannelEnabled,
  isTypeEnabled,
  markNotificationRead,
  type Notification,
  NotificationChannel,
  type NotificationPreference,
  NotificationStatus,
  type NotificationType,
} from "@eduatlas/domain";
import type { EmailService } from "./email-service";
import { renderNotificationEmail } from "./email-templates";
import { buildNotificationCopy, type NotificationEventPayload } from "./notification-copy";
import type { NotificationRepository } from "./notification-repository";
import { resolveEmailCtaHref } from "./resolve-email-cta-href";

export type EmitNotificationInput = NotificationEventPayload & {
  userId: string;
  email?: string;
  notificationId?: string;
  now?: string;
  metadata?: Readonly<Record<string, string>>;
};

export type EmitNotificationResult = Readonly<{
  readonly notification: Notification | null;
  readonly inAppCreated: boolean;
  readonly emailSent: boolean;
  readonly skippedReason?: string;
}>;

export type NotificationServiceDependencies = {
  notificationRepository: NotificationRepository;
  emailService: EmailService;
  /** Public site origin for absolute email CTA links (e.g. https://eduatlas.com.tr). */
  siteBaseUrl?: string;
};

/**
 * Notification orchestration — preference-aware in-app + email delivery.
 * Provider logic stays behind EmailService.
 */
export class NotificationService {
  constructor(private readonly deps: NotificationServiceDependencies) {}

  async emit(input: EmitNotificationInput): Promise<EmitNotificationResult> {
    const userId = input.userId.trim();
    if (!userId) {
      return Object.freeze({
        notification: null,
        inAppCreated: false,
        emailSent: false,
        skippedReason: "missing_user",
      });
    }

    const now = input.now ?? new Date().toISOString();
    const preference = await this.resolvePreference(userId, now);

    if (!isTypeEnabled(preference, input.type)) {
      return Object.freeze({
        notification: null,
        inAppCreated: false,
        emailSent: false,
        skippedReason: "type_disabled",
      });
    }

    const copy = buildNotificationCopy(input);
    const channels: NotificationChannel[] = [];
    if (isChannelEnabled(preference, NotificationChannel.InApp)) {
      channels.push(NotificationChannel.InApp);
    }
    if (isChannelEnabled(preference, NotificationChannel.Email) && input.email?.trim()) {
      channels.push(NotificationChannel.Email);
    }

    if (channels.length === 0) {
      return Object.freeze({
        notification: null,
        inAppCreated: false,
        emailSent: false,
        skippedReason: "channels_disabled",
      });
    }

    const notificationId = input.notificationId?.trim() || `notif_${createNotificationIdSuffix()}`;

    let notification = createNotification({
      id: notificationId,
      userId,
      type: input.type,
      status: NotificationStatus.Unread,
      channels,
      title: copy.title,
      body: copy.body,
      href: copy.href,
      institutionId: input.institutionId,
      email: input.email,
      createdAt: now,
      metadata: input.metadata,
    });

    let inAppCreated = false;
    if (channels.includes(NotificationChannel.InApp)) {
      notification = await this.deps.notificationRepository.save(notification);
      inAppCreated = true;
    }

    let emailSent = false;
    if (channels.includes(NotificationChannel.Email) && input.email?.trim()) {
      const rendered = renderNotificationEmail({
        type: input.type,
        title: copy.title,
        body: copy.body,
        href: resolveEmailCtaHref(
          input.verificationLink?.trim() || copy.href,
          this.deps.siteBaseUrl,
        ),
        subject: copy.subject,
        ctaLabel: copy.ctaLabel,
      });
      const result = await this.deps.emailService.send({
        to: input.email.trim().toLowerCase(),
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        messageId: notificationId,
      });
      emailSent = result.accepted;

      // Persist email-only events so the owner center still has a trail when in-app is off.
      if (!inAppCreated) {
        notification = await this.deps.notificationRepository.save(notification);
      }
    }

    return Object.freeze({
      notification,
      inAppCreated,
      emailSent,
    });
  }

  async listForUser(
    userId: string,
    options: { status?: NotificationStatus; limit?: number } = {},
  ): Promise<readonly Notification[]> {
    return this.deps.notificationRepository.listForUser({
      userId: userId.trim(),
      status: options.status,
      limit: options.limit,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.deps.notificationRepository.countUnread(userId.trim());
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification | null> {
    const existing = await this.deps.notificationRepository.getById(notificationId);
    if (!existing || existing.userId !== userId.trim()) {
      return null;
    }
    const updated = markNotificationRead(existing);
    return this.deps.notificationRepository.save(updated);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const unread = await this.deps.notificationRepository.listForUser({
      userId: userId.trim(),
      status: NotificationStatus.Unread,
      limit: 200,
    });
    let count = 0;
    for (const item of unread) {
      await this.deps.notificationRepository.save(markNotificationRead(item));
      count += 1;
    }
    return count;
  }

  async getPreferences(userId: string): Promise<NotificationPreference> {
    return this.resolvePreference(userId.trim(), new Date().toISOString());
  }

  async updatePreferences(input: {
    userId: string;
    emailEnabled: boolean;
    inAppEnabled: boolean;
    disabledTypes?: readonly NotificationType[];
    now?: string;
  }): Promise<NotificationPreference> {
    const preference = createNotificationPreference({
      userId: input.userId,
      emailEnabled: input.emailEnabled,
      inAppEnabled: input.inAppEnabled,
      disabledTypes: input.disabledTypes,
      updatedAt: input.now ?? new Date().toISOString(),
    });
    return this.deps.notificationRepository.savePreference(preference);
  }

  private async resolvePreference(userId: string, now: string): Promise<NotificationPreference> {
    const existing = await this.deps.notificationRepository.getPreference(userId);
    if (existing) {
      return existing;
    }
    return defaultNotificationPreference(userId, now);
  }
}

export function createNotificationService(
  deps: NotificationServiceDependencies,
): NotificationService {
  return new NotificationService(deps);
}

function createNotificationIdSuffix(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replaceAll("-", "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
