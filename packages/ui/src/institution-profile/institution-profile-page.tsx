"use client";

import { useState } from "react";
import { Container } from "../components/container";
import { PublicNextSteps } from "../layout/public-next-steps";
import { cn } from "../lib/cn";
import { InstitutionAbout } from "./institution-about";
import { InstitutionAmenities } from "./institution-amenities";
import { InstitutionBreadcrumb } from "./institution-breadcrumb";
import { InstitutionClaimCTA, type InstitutionClaimCTAProps } from "./institution-claim-cta";
import { InstitutionFaqs } from "./institution-faqs";
import { InstitutionGallery } from "./institution-gallery";
import { InstitutionHero } from "./institution-hero";
import { InstitutionHighlights } from "./institution-highlights";
import { InstitutionLeadCTA, type InstitutionLeadCTAProps } from "./institution-lead-cta";
import { InstitutionLocation } from "./institution-location";
import {
  getStaticInstitutionProfile,
  type InstitutionProfileViewData,
} from "./institution-profile-content";
import { InstitutionProfileDialog } from "./institution-profile-dialog";
import { InstitutionPrograms } from "./institution-programs";
import { InstitutionQuickInfo } from "./institution-quick-info";
import { InstitutionRelated } from "./institution-related";
import { InstitutionSidebar } from "./institution-sidebar";
import { InstitutionTrustStrip } from "./institution-trust-strip";
import { InstitutionWorkingHours } from "./institution-working-hours";

export type InstitutionProfilePageProps = {
  slug?: string;
  profile?: InstitutionProfileViewData;
  institutionId?: string;
  leadAction?: InstitutionLeadCTAProps["action"];
  claimAction?: InstitutionClaimCTAProps["action"];
  className?: string;
};

/**
 * Institution profile page — lead/claim forms open from the sidebar as popups.
 */
export function InstitutionProfilePage({
  slug = "ornek-anaokulu",
  profile = getStaticInstitutionProfile(slug),
  institutionId = profile.id,
  leadAction,
  claimAction,
  className,
}: InstitutionProfilePageProps) {
  const [leadOpen, setLeadOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);

  return (
    <div className={cn("ea-profile-page", className)}>
      <Container size="xl" className="ea-profile-page__top">
        <InstitutionBreadcrumb items={profile.breadcrumbs} />
        <InstitutionHero profile={profile} />
      </Container>

      <Container size="xl" className="ea-profile-page__layout">
        <div className="ea-profile-page__main">
          <InstitutionTrustStrip profile={profile} />
          <InstitutionQuickInfo facts={profile.quickFacts} />
          <InstitutionAbout description={profile.longDescription} />
          <InstitutionHighlights highlights={profile.highlights} />
          <InstitutionPrograms programs={profile.programs} />
          <InstitutionAmenities items={profile.amenities} />
          <InstitutionWorkingHours days={profile.workingHours} />
          <InstitutionFaqs faqs={profile.faqs} />
          <InstitutionGallery items={profile.gallery} />
          <InstitutionLocation
            address={profile.address}
            city={profile.city}
            district={profile.district}
            googleMapsUrl={profile.googleMapsUrl}
            latitude={profile.latitude}
            longitude={profile.longitude}
          />
          <InstitutionRelated institutions={profile.related} />
          <PublicNextSteps
            title="Keşfe devam"
            links={[
              { id: "city", label: `${profile.city} hub`, href: profile.cityHref },
              { id: "type", label: profile.typeLabel, href: profile.typeHref },
              { id: "search", label: "Arama", href: "/search" },
              { id: "cities", label: "Tüm şehirler", href: "/cities" },
            ]}
          />
        </div>

        <InstitutionSidebar
          profile={profile}
          onLeadClick={leadAction ? () => setLeadOpen(true) : undefined}
          onClaimClick={claimAction ? () => setClaimOpen(true) : undefined}
        />
      </Container>

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
    </div>
  );
}
