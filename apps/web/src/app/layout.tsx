import { AppRole } from "@eduatlas/domain";
import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/app-providers";
import { PublicShell } from "@/components/public-shell";
import { getSeoSiteConfig, toFooterContact } from "@/lib/seo-site";
import { logoutAction } from "@/server/auth/auth-actions";
import { getCurrentSession } from "@/server/auth/current-session";
import { getPublicOrganizationContact } from "@/server/site/get-public-organization-contact";
import "@eduatlas/ui/styles.css";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const site = getSeoSiteConfig();

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: site.siteName,
    template: `%s | ${site.siteName}`,
  },
  description: site.defaultDescription,
  applicationName: site.siteName,
};

function accountLabel(
  role: AppRole,
  displayName: string | undefined,
  email: string,
): string {
  if (role === AppRole.Admin) {
    return "admin";
  }
  const named = displayName?.trim();
  if (named) {
    const withoutDemo = named.replace(/^Demo\s+/i, "").trim();
    return withoutDemo || named;
  }
  const local = email.split("@")[0]?.trim();
  return local || email;
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [session, organizationContact] = await Promise.all([
    getCurrentSession(),
    getPublicOrganizationContact().catch(() => null),
  ]);
  const isParentLoggedIn =
    session?.user.role === AppRole.Parent && Boolean(session.user.emailVerified);
  const authAccount =
    session && session.user.emailVerified
      ? {
          label: accountLabel(session.user.role, session.user.displayName, session.user.email),
          href:
            session.user.role === AppRole.Admin
              ? "/admin"
              : session.user.role === AppRole.Parent
                ? "/veli"
                : "/owner",
          roleLabel:
            session.user.role === AppRole.Admin
              ? "Yönetici"
              : session.user.role === AppRole.Parent
                ? "Veli"
                : "Kurum",
        }
      : null;

  return (
    <html
      lang="tr"
      className={`${plusJakartaSans.variable} ${fraunces.variable} h-full antialiased`}
      data-theme="light"
    >
      <body className="flex min-h-full flex-col font-sans">
        <AppProviders>
          <PublicShell
            appName={site.siteName}
            isParentLoggedIn={isParentLoggedIn}
            authAccount={authAccount}
            logoutAction={logoutAction}
            {...(organizationContact
              ? { organizationContact: toFooterContact(organizationContact) }
              : {})}
          >
            {children}
          </PublicShell>
        </AppProviders>
      </body>
    </html>
  );
}
