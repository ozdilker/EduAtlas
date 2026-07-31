import { Container } from "../components/container";
import { OwnerLeadPipelineBoard } from "./owner-lead-pipeline-board";
import type { OwnerLeadPipelineViewData } from "./owner-portal-content";
import { OwnerPortalShell } from "./owner-portal-shell";

export type OwnerLeadPipelinePageProps = {
  data: OwnerLeadPipelineViewData;
  action: (formData: FormData) => Promise<void> | void;
  className?: string;
};

/**
 * Full-page owner lead pipeline.
 */
export function OwnerLeadPipelinePage({ data, action, className }: OwnerLeadPipelinePageProps) {
  return (
    <OwnerPortalShell
      institutionName={data.institutionName}
      institutionLogoUrl={data.institutionLogoUrl}
      activeTab="leads"
      className={className}
    >
      <Container size="2xl" className="ea-owner-portal ea-owner-portal--pipeline">
        <OwnerLeadPipelineBoard data={data} action={action} />
      </Container>
    </OwnerPortalShell>
  );
}
