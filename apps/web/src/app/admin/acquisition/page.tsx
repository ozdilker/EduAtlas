import { AdminAcquisitionDashboard } from "@eduatlas/ui";
import {
  type AcquisitionSearchParams,
  getAdminAcquisitionDashboardView,
} from "@/server/admin/get-admin-acquisition-dashboard";

export const dynamic = "force-dynamic";

type AdminAcquisitionPageProps = {
  searchParams: Promise<AcquisitionSearchParams>;
};

/**
 * Institution Acquisition Dashboard — repository-backed ops foundation.
 */
export default async function AdminAcquisitionPage({ searchParams }: AdminAcquisitionPageProps) {
  const params = await searchParams;
  const data = await getAdminAcquisitionDashboardView(params);
  return <AdminAcquisitionDashboard data={data} />;
}
