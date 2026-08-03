import { AppRole } from "@eduatlas/domain";
import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/app-providers";
import { PublicShell } from "@/components/public-shell";
import { getSeoSiteConfig, toFooterContact } from "@/lib/seo-site";
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

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [session, organizationContact] = await Promise.all([
    getCurrentSession(),
    getPublicOrganizationContact().catch(() => null),
  ]);
  const isParentLoggedIn = session?.user.role === AppRole.Parent;

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
