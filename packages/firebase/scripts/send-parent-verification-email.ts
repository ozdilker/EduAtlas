/**
 * One-off / ops: send branded parent email-verification mail via Admin SDK + SMTP.
 *
 * Usage (from repo root):
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/send-parent-verification-email.ts oilker1983@gmail.com
 */
import {
  buildNotificationCopy,
  EDUATLAS_MAIL_FROM_DEFAULT,
  renderNotificationEmail,
} from "@eduatlas/application";
import { NotificationType } from "@eduatlas/domain";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import nodemailer from "nodemailer";

const EMAIL = (process.argv[2] ?? "").trim().toLowerCase();
if (!EMAIL || !EMAIL.includes("@")) {
  console.error("Usage: send-parent-verification-email.ts <email>");
  process.exit(1);
}

const PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  "eduatlas-dev";

const SITE_URL = (() => {
  const override = process.env.EMAIL_VERIFICATION_CONTINUE_ORIGIN?.trim().replace(/\/+$/, "");
  if (override && !/localhost|127\.0\.0\.1|firebaseapp\.com|web\.app/i.test(override)) {
    return override;
  }
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") || "";
  if (raw && !/localhost|127\.0\.0\.1|firebaseapp\.com|web\.app/i.test(raw)) {
    return raw;
  }
  return "https://eduatlas.com.tr";
})();

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, "\n");
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY. Use --env-file=apps/web/.env.local",
    );
  }

  return initializeApp({
    credential: cert({
      projectId: PROJECT_ID,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    }),
    projectId: PROJECT_ID,
  });
}

async function main(): Promise<void> {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS?.trim() ?? "";
  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST / SMTP_USER / SMTP_PASS required.");
  }

  const auth = getAuth(getAdminApp());
  const firebaseUser = await auth.getUserByEmail(EMAIL);
  const role =
    firebaseUser.customClaims && typeof firebaseUser.customClaims.role === "string"
      ? firebaseUser.customClaims.role
      : undefined;

  if (role && role !== "parent") {
    throw new Error(`Refusing to send parent verification mail: role=${role}`);
  }
  if (firebaseUser.emailVerified) {
    console.log(`User ${EMAIL} is already emailVerified=true; sending anyway is skipped.`);
    return;
  }

  const continueUrl =
    process.env.EMAIL_VERIFICATION_CONTINUE_URL?.trim() ||
    `${SITE_URL}/veli/giris?notice=email_verified`;

  console.log(`continueUrl=${continueUrl}`);

  const verificationLink = await auth.generateEmailVerificationLink(EMAIL, {
    url: continueUrl,
    handleCodeInApp: false,
  });

  const copy = buildNotificationCopy({
    type: NotificationType.EmailVerification,
    accountRole: "parent",
    verificationLink,
  });

  const rendered = renderNotificationEmail({
    type: NotificationType.EmailVerification,
    title: copy.title,
    body: copy.body,
    href: verificationLink,
    subject: copy.subject,
    ctaLabel: copy.ctaLabel,
  });

  const portRaw = Number.parseInt(process.env.SMTP_PORT?.trim() || "587", 10);
  const port = Number.isFinite(portRaw) && portRaw > 0 ? portRaw : 587;
  const secureFlag = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    secureFlag === "1" ||
    secureFlag === "true" ||
    (secureFlag !== "0" && secureFlag !== "false" && port === 465);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const from = process.env.EDUATLAS_MAIL_FROM?.trim() || EDUATLAS_MAIL_FROM_DEFAULT;
  const info = await transporter.sendMail({
    from,
    to: EMAIL,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        to: EMAIL,
        uid: firebaseUser.uid,
        role: role ?? "unset",
        subject: rendered.subject,
        messageId: info.messageId ?? null,
        accepted: info.accepted,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  if (error && typeof error === "object") {
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2));
  }
  process.exit(1);
});
