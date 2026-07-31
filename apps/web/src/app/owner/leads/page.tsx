import { OwnerLeadsWorkspace } from "@eduatlas/ui";
import { redirect } from "next/navigation";
import { getOwnerLeadsWorkspaceView } from "@/server/owner/get-owner-portal";
import { requireOwnerContext } from "@/server/owner/require-owner-context";
import { updateOwnerLeadStatusAction } from "@/server/owner/update-owner-lead-status-action";

export const dynamic = "force-dynamic";

type OwnerLeadsPageProps = {
  searchParams: Promise<{ view?: string | string[]; lead?: string | string[] }>;
};

/**
 * Unified Talepler workspace — Liste + Pipeline over the same lead data.
 */
export default async function OwnerLeadsPage({ searchParams }: OwnerLeadsPageProps) {
  const params = await searchParams;
  const viewParam = Array.isArray(params.view) ? params.view[0] : params.view;
  const leadParam = Array.isArray(params.lead) ? params.lead[0] : params.lead;
  const initialView = viewParam === "pipeline" ? "pipeline" : "list";

  const { institutionId } = await requireOwnerContext();
  const data = await getOwnerLeadsWorkspaceView({ institutionId });

  if (!data) {
    redirect("/owner/onboarding?reason=missing_institution");
  }

  const initialLeadId = leadParam && data.leadDetailsById[leadParam] ? leadParam : undefined;

  return (
    <OwnerLeadsWorkspace
      data={data}
      action={updateOwnerLeadStatusAction}
      initialView={initialView}
      initialLeadId={initialLeadId}
    />
  );
}
