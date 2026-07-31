import { AdminOverviewPage } from "@eduatlas/ui";
import type { Metadata } from "next";
import { getAdminOverviewView } from "@/server/admin/get-admin-overview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Genel bakış | EduAtlas Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin landing — executive Overview dashboard.
 * Composes existing acquisition / review / AI workforce services.
 */
export default async function AdminHomePage() {
  const data = await getAdminOverviewView();
  return <AdminOverviewPage data={data} />;
}
