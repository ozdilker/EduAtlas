import { getInstitutionTypeSlug, institutionIdAsString } from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import { buildInstitutionPageSeo } from "@eduatlas/seo";
import {
  Container,
  InstitutionAbout,
  InstitutionAmenities,
  InstitutionBreadcrumb,
  InstitutionFaqs,
  InstitutionGallery,
  InstitutionHero,
  InstitutionHighlights,
  InstitutionLocation,
  InstitutionPrograms,
  InstitutionQuickInfo,
  InstitutionRelated,
  InstitutionTrustStrip,
  InstitutionWorkingHours,
  PublicNextSteps,
} from "@eduatlas/ui";
import type { InstitutionCardViewData, InstitutionProfileViewData } from "@eduatlas/ui";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { getSeoSiteConfig } from "@/lib/seo-site";
import {
  getPublicInstitutionProfileAboveFoldBySlug,
  loadRelatedInstitutions,
} from "@/server/institutions/get-public-institution-profile";
import { getInstitutionTypeLabel } from "@/server/institutions/to-profile-view";
import { getInstitutionRepository } from "@/server/institutions/repository";
import { submitInstitutionClaimAction } from "@/server/claims/submit-institution-claim-action";
import { submitInstitutionLeadAction } from "@/server/leads/submit-institution-lead-action";
import { InstitutionProfileSidebarLeadDialog } from "./institution-profile-sidebar-lead-dialog";
import { Suspense } from "react";
import { assertFirestoreReadsBudget, runWithFirestoreCounters } from "@eduatlas/firebase/monitoring";

type InstitutionProfileRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: InstitutionProfileRouteProps) {
  const { slug } = await params;
  const result = await getPublicInstitutionProfileAboveFoldBySlug(slug);

  if (!result) {
    return {
      title: "Kurum bulunamadı",
      robots: { index: false, follow: false },
    };
  }

  const { institution, profile } = result;
  const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);

  return buildInstitutionPageSeo(getSeoSiteConfig(), {
    slug: institution.slug,
    name: institution.name,
    typeLabel: getInstitutionTypeLabel(institution.primaryType),
    typeSlug: getInstitutionTypeSlug(institution.primaryType),
    city: geo.cityName,
    citySlug: geo.citySlug,
    district: geo.districtName,
    districtSlug: geo.districtSlug,
    description: profile.summary,
  }).metadata;
}

export default async function InstitutionProfileRoute({ params }: InstitutionProfileRouteProps) {
  return runWithFirestoreCounters(async () => {
    const { slug } = await params;
    const repo = await getInstitutionRepository();
    const result = await getPublicInstitutionProfileAboveFoldBySlug(slug, repo);

    if (!result) {
      notFound();
    }

    const { institution, profile } = result;
    const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);
    const pageSeo = buildInstitutionPageSeo(getSeoSiteConfig(), {
      slug: institution.slug,
      name: institution.name,
      typeLabel: profile.typeLabel,
      typeSlug: getInstitutionTypeSlug(institution.primaryType),
      city: geo.cityName,
      citySlug: geo.citySlug,
      district: geo.districtName,
      districtSlug: geo.districtSlug,
      description: profile.summary,
    });

    const relatedPromise: Promise<readonly InstitutionCardViewData[]> = loadRelatedInstitutions(
      repo,
      institution,
    );

    return (
      <>
        <JsonLd data={pageSeo.jsonLd} />

        <div className="ea-profile-page">
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

              <Suspense fallback={null}>
                <InstitutionBelowFold profile={profile} relatedPromise={relatedPromise} />
              </Suspense>
            </div>

            <InstitutionProfileSidebarLeadDialog
              profile={profile}
              institutionId={institutionIdAsString(institution.id)}
              leadAction={submitInstitutionLeadAction}
              claimAction={submitInstitutionClaimAction}
            />
          </Container>
        </div>
      </>
    );
  });
}

async function InstitutionBelowFold({
  profile,
  relatedPromise,
}: {
  profile: InstitutionProfileViewData;
  relatedPromise: Promise<readonly InstitutionCardViewData[]>;
}) {
  const related = await relatedPromise;
  assertFirestoreReadsBudget("detail");

  return (
    <>
      <InstitutionGallery items={profile.gallery} />
      <InstitutionLocation
        address={profile.address}
        city={profile.city}
        district={profile.district}
        googleMapsUrl={profile.googleMapsUrl}
        latitude={profile.latitude}
        longitude={profile.longitude}
      />
      <InstitutionRelated institutions={[...related]} />
      <PublicNextSteps
        title="Keşfe devam"
        links={[
          { id: "city", label: `${profile.city} hub`, href: profile.cityHref },
          { id: "type", label: profile.typeLabel, href: profile.typeHref },
          { id: "search", label: "Arama", href: "/search" },
          { id: "cities", label: "Tüm şehirler", href: "/cities" },
        ]}
      />
    </>
  );
}
