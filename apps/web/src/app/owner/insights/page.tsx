import { OwnerInsightsPage } from "@eduatlas/ui";
import { redirect } from "next/navigation";
import { getOwnerInsightsView } from "@/server/owner/get-owner-insights";
import { requireOwnerContext } from "@/server/owner/require-owner-context";

export const dynamic = "force-dynamic";

/**
 * Owner Insights dashboard — acquisition metrics via application services.
 */
export default async function OwnerInsightsRoute() {
  const { institutionId } = await requireOwnerContext();
  const data = await getOwnerInsightsView({ institutionId });

  if (!data) {
    redirect("/owner/onboarding?reason=missing_institution");
  }

  return <OwnerInsightsPage data={data} />;
}
