import { Container } from "../components/container";
import type { OwnerInsightsViewData } from "./owner-insights-content";
import { OwnerInsightsWidget } from "./owner-insights-widget";
import { OwnerPortalShell } from "./owner-portal-shell";

export type OwnerInsightsPageProps = {
  data: OwnerInsightsViewData;
  className?: string;
};

/**
 * Owner Insights dashboard — student acquisition metrics for institution owners.
 */
export function OwnerInsightsPage({ data, className }: OwnerInsightsPageProps) {
  return (
    <OwnerPortalShell
      institutionName={data.institutionName}
      institutionLogoUrl={data.institutionLogoUrl}
      activeTab="insights"
      className={className}
    >
      <Container size="xl" className="ea-owner-portal">
        <header className="ea-owner-portal__hero">
          <p className="ea-owner-portal__eyebrow">Kurum paneli</p>
          <h1 className="ea-owner-portal__title">İçgörüler</h1>
          <p className="ea-owner-portal__description">
            EduAtlas’ın öğrenci kazanımına katkısını gösteren temel metrikler. CRM, bildirim ve AI
            API’leri bu sprintte yoktur.
          </p>
        </header>
        <OwnerInsightsWidget data={data} />
      </Container>
    </OwnerPortalShell>
  );
}
