import {
  createConsoleEmailService,
  createInMemoryNotificationRepository,
  createNotificationService,
  type EmailService,
  type NotificationRepository,
  type NotificationService,
} from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  createFirestoreNotificationRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";
import { tryCreateSmtpEmailServiceFromEnv } from "./smtp-email-service";

let notificationRepositoryPromise: Promise<NotificationRepository> | undefined;
let emailServicePromise: Promise<EmailService> | undefined;
let notificationServicePromise: Promise<NotificationService> | undefined;

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

export function getNotificationRepository(): Promise<NotificationRepository> {
  if (!notificationRepositoryPromise) {
    notificationRepositoryPromise = Promise.resolve(
      canUseFirebaseBackend()
        ? createFirestoreNotificationRepository(getAdminFirestore())
        : createInMemoryNotificationRepository(),
    );
  }
  return notificationRepositoryPromise;
}

/**
 * Email provider behind EmailService port.
 * Uses SMTP when SMTP_HOST + SMTP_USER + SMTP_PASS are set; otherwise console.
 */
export function getEmailService(): Promise<EmailService> {
  if (!emailServicePromise) {
    const smtp = tryCreateSmtpEmailServiceFromEnv();
    if (smtp) {
      emailServicePromise = Promise.resolve(smtp);
      if (process.env.NODE_ENV !== "test") {
        console.info("[EmailService] Using SMTP provider", {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || "587",
          user: process.env.SMTP_USER,
        });
      }
    } else {
      emailServicePromise = Promise.resolve(createConsoleEmailService());
      if (process.env.NODE_ENV !== "test") {
        console.info(
          "[EmailService] SMTP not configured (SMTP_HOST/USER/PASS). Using console logger.",
        );
      }
    }
  }
  return emailServicePromise;
}

export async function getNotificationService(): Promise<NotificationService> {
  if (!notificationServicePromise) {
    notificationServicePromise = (async () =>
      createNotificationService({
        notificationRepository: await getNotificationRepository(),
        emailService: await getEmailService(),
      }))();
  }
  return notificationServicePromise;
}

export function resetNotificationServicesForTests(): void {
  notificationRepositoryPromise = undefined;
  emailServicePromise = undefined;
  notificationServicePromise = undefined;
}
