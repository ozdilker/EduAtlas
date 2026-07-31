import { AdminOperationsPage } from "@eduatlas/ui";
import type { Metadata } from "next";
import { getAdminOperationsView } from "@/server/admin/get-admin-operations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Veri operasyonları | EduAtlas Admin",
  robots: { index: false, follow: false },
};

/**
 * Data Operations Workspace — read-only composition of existing
 * application services. Repository-backed; no Firestore in UI.
 */
export default async function AdminOperationsRoute() {
  const data = await getAdminOperationsView();
  return <AdminOperationsPage data={data} />;
}
