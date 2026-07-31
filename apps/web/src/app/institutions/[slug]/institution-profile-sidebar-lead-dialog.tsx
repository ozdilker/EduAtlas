"use client";

import { useState } from "react";
import type { InstitutionLeadCTAProps, InstitutionProfileViewData } from "@eduatlas/ui";
import {
  InstitutionLeadCTA,
  InstitutionProfileDialog,
  InstitutionSidebar,
} from "@eduatlas/ui";

export type InstitutionProfileSidebarLeadDialogProps = {
  profile: InstitutionProfileViewData;
  institutionId: string;
  leadAction?: InstitutionLeadCTAProps["action"];
};

/**
 * Client-only wrapper that keeps the lead dialog open/close state.
 * Sidebar + dialog are rendered outside the Suspense deferred sections.
 */
export function InstitutionProfileSidebarLeadDialog({
  profile,
  institutionId,
  leadAction,
}: InstitutionProfileSidebarLeadDialogProps) {
  const [leadOpen, setLeadOpen] = useState(false);

  return (
    <>
      <InstitutionSidebar
        profile={profile}
        onLeadClick={leadAction ? () => setLeadOpen(true) : undefined}
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
    </>
  );
}

