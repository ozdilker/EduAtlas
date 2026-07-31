import { Container } from "../components/container";
import { OwnerLeadDetail } from "./owner-lead-detail";
import type { OwnerLeadDetailView } from "./owner-portal-content";
import { OwnerPortalShell } from "./owner-portal-shell";

export type OwnerLeadDetailPageProps = {
  institutionName: string;
  institutionLogoUrl?: string;
  lead: OwnerLeadDetailView;
  className?: string;
};

/**
 * Full-page lead detail fallback when list context is unavailable.
 */
export function OwnerLeadDetailPage({
  institutionName,
  institutionLogoUrl,
  lead,
  className,
}: OwnerLeadDetailPageProps) {
  return (
    <OwnerPortalShell
      institutionName={institutionName}
      institutionLogoUrl={institutionLogoUrl}
      activeTab="leads"
      className={className}
    >
      <Container size="md" className="ea-owner-lead-page">
        <a href="/owner/leads" className="ea-owner-lead-page__back">
          Taleplere dön
        </a>
        <OwnerLeadDetail lead={lead} />
      </Container>
    </OwnerPortalShell>
  );
}
