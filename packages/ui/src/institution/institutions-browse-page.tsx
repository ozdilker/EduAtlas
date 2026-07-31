"use client";

import { Breadcrumb } from "../city-landing/breadcrumb";
import { FeaturedInstitutions } from "../city-landing/featured-institutions";
import { getButtonClassName } from "../components/button-classes";
import { Container } from "../components/container";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { PublicNextSteps } from "../layout/public-next-steps";
import { cn } from "../lib/cn";

export type InstitutionsBrowsePageProps = {
  institutions?: readonly InstitutionCardViewData[];
  totalCount?: number;
  className?: string;
};

/**
 * Public /institutions browse page — published institution cards + discovery links.
 */
export function InstitutionsBrowsePage({
  institutions = [],
  totalCount,
  className,
}: InstitutionsBrowsePageProps) {
  const count = totalCount ?? institutions.length;
  const searchHref = "/search";

  return (
    <div className={cn("ea-hub-index", className)}>
      <Container size="xl" className="ea-hub-index__inner">
        <Breadcrumb
          items={[
            { id: "home", label: "Ana sayfa", href: "/" },
            { id: "institutions", label: "Kurumlar" },
          ]}
        />
        <header className="ea-hub-index__header">
          <h1 className="ea-hub-index__title">Kurumlar</h1>
          <p className="ea-hub-index__description">
            {count > 0
              ? `Yayınlı ${count.toLocaleString("tr-TR")} kurumdan bir seçki. Tümünü arama sayfasında filtreleyebilirsiniz.`
              : "Henüz yayınlı kurum yok. Arama sayfasından keşfe devam edin veya daha sonra tekrar bakın."}
          </p>
          <div className="ea-hub-index__actions">
            <a
              href={searchHref}
              className={cn(getButtonClassName({ variant: "primary", size: "md" }))}
            >
              Tümünü ara
            </a>
            <a
              href="/cities"
              className={cn(getButtonClassName({ variant: "secondary", size: "md" }))}
            >
              Şehirlere göz at
            </a>
          </div>
        </header>

        <FeaturedInstitutions
          institutions={[...institutions]}
          sectionId="institutions-browse"
          heading={count > 0 ? "Yayınlı kurumlar" : "Kurumlar"}
          emptyHref={searchHref}
          emptyLabel="Arama sayfasına git"
        />

        <PublicNextSteps
          links={[
            { id: "cities", label: "Şehirler", href: "/cities" },
            { id: "categories", label: "Kurum tipleri", href: "/categories" },
            { id: "search", label: "Arama", href: searchHref },
            {
              id: "first",
              label: institutions[0] ? "İlk kurum" : "İstanbul",
              href: institutions[0]?.href ?? "/cities/istanbul",
            },
          ]}
        />
      </Container>
    </div>
  );
}
