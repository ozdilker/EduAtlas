"use client";

import { useState } from "react";
import type {
  InstitutionClaimCTAProps,
  InstitutionLeadCTAProps,
  InstitutionProfileViewData,
} from "@eduatlas/ui";
import {
  InstitutionClaimCTA,
  InstitutionLeadCTA,
  InstitutionProfileDialog,
  InstitutionSidebar,
} from "@eduatlas/ui";

export type InstitutionProfileSidebarLeadDialogProps = {
  profile: InstitutionProfileViewData;
  institutionId: string;
  leadAction?: InstitutionLeadCTAProps["action"];
  claimAction?: InstitutionClaimCTAProps["action"];
};

/**
 * Client-only wrapper that keeps lead/claim dialog open/close state.
 * Sidebar + dialogs are rendered outside the Suspense deferred sections.
 */
export function InstitutionProfileSidebarLeadDialog({
  profile,
  institutionId,
  leadAction,
  claimAction,
}: InstitutionProfileSidebarLeadDialogProps) {
  const [leadOpen, setLeadOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);

  return (
    <>
      <InstitutionSidebar
        profile={profile}
        onLeadClick={leadAction ? () => setLeadOpen(true) : undefined}
        onClaimClick={claimAction ? () => setClaimOpen(true) : undefined}
      />

      {leadAction ? (
        <InstitutionProfileDialog
          open={leadOpen}
          onClose={() => setLeadOpen(false)}
          title="Bilgi talebi"
        >
          <InstitutionLeadCTA
            institutionName={profile.name}
            institutionId={institutionId}
            action={leadAction}
            variant="panel"
          />
        </InstitutionProfileDialog>
      ) : null}

      {claimAction ? (
        <InstitutionProfileDialog
          open={claimOpen}
          onClose={() => setClaimOpen(false)}
          title="Kurumu sahiplen"
        >
          <InstitutionClaimCTA
            institutionName={profile.name}
            institutionId={institutionId}
            action={claimAction}
            variant="panel"
          />
        </InstitutionProfileDialog>
      ) : null}
    </>
  );
}
