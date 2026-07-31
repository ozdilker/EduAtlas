import { AdminPublishedPage } from "@eduatlas/ui";
import type { Metadata } from "next";
import {
  getAdminPublishedInstitutionsView,
  type PublishedSearchParams,
} from "@/server/admin/get-admin-published-institutions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yayındaki kurumlar | EduAtlas Admin",
  robots: { index: false, follow: false },
};

type AdminPublishedRouteProps = {
  searchParams: Promise<PublishedSearchParams>;
};

/**
 * Published institutions list — verify Excel imports landed in Firebase.
 */
export default async function AdminPublishedRoute({ searchParams }: AdminPublishedRouteProps) {
  const params = await searchParams;
  const data = await getAdminPublishedInstitutionsView(params);
  return <AdminPublishedPage data={data} />;
}
