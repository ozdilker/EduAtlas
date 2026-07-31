import { OwnerPortalPage } from "@eduatlas/ui";
import { redirect } from "next/navigation";
import { getOwnerPortalSnapshot } from "@/server/owner/get-owner-portal";
import { requireOwnerContext } from "@/server/owner/require-owner-context";

export const dynamic = "force-dynamic";

type OwnerHomePageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

/**
 * Institution owner dashboard — application service + repositories, read-only.
 */
export default async function OwnerHomePage({ searchParams }: OwnerHomePageProps) {
  const params = await searchParams;
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;

  if (tabParam === "leads") {
    redirect("/owner/leads");
  }

  const { institutionId } = await requireOwnerContext();
  const snapshot = await getOwnerPortalSnapshot({ institutionId });

  if (!snapshot) {
    redirect("/owner/onboarding?reason=missing_institution");
  }

  return <OwnerPortalPage data={snapshot.data} activeTab="overview" />;
}
