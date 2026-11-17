import { AdminSeoDashboard } from "@eduatlas/ui";
import { getAdminSeoDashboardView } from "@/server/admin/get-admin-seo-dashboard";
import { updateSeoActionTaskAction } from "@/server/admin/seo-action-task-action";
import { requireAdminSession } from "@/server/auth/current-session";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ notice?: string }>;
};

/**
 * SEO + kurum sahiplik özeti — GSC/GA4 snapshot okur, Google API çağırmaz.
 */
export default async function AdminSeoPage({ searchParams }: Props) {
  const session = await requireAdminSession();
  const params = searchParams ? await searchParams : undefined;
  const data = await getAdminSeoDashboardView();

  return (
    <AdminSeoDashboard
      data={data}
      taskAction={updateSeoActionTaskAction}
      currentAdminUid={session.user.uid}
      {...(params?.notice?.trim() ? { statusMessage: params.notice.trim() } : {})}
    />
  );
}
