import { redirect } from "next/navigation";

type OwnerLeadPageProps = {
  params: Promise<{ leadId: string }>;
};

/**
 * Deep link into Talepler — opens the client drawer via query param.
 * Route preserved for notifications and shared URLs.
 */
export default async function OwnerLeadPage({ params }: OwnerLeadPageProps) {
  const { leadId } = await params;
  redirect(`/owner/leads?lead=${encodeURIComponent(leadId)}`);
}
