import { OwnerBillingPage } from "@eduatlas/ui";
import { redirect } from "next/navigation";
import { getOwnerBillingView } from "@/server/owner/get-owner-billing-view";
import { requireOwnerContext } from "@/server/owner/require-owner-context";

export const dynamic = "force-dynamic";

export default async function OwnerBillingRoute() {
  const { institutionId } = await requireOwnerContext();
  const data = await getOwnerBillingView(institutionId);
  if (!data) {
    redirect("/owner/onboarding?reason=missing_institution");
  }
  return <OwnerBillingPage data={data} />;
}
