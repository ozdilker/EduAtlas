import { Container } from "../components/container";
import { OwnerInstitutionSummaryWidget } from "./owner-institution-summary-widget";
import { OwnerLeadSummaryWidget } from "./owner-lead-summary-widget";
import { OwnerLeadTrendPlaceholder } from "./owner-lead-trend-placeholder";
import type { OwnerPortalViewData } from "./owner-portal-content";
import { OwnerPortalShell } from "./owner-portal-shell";
import type { OwnerPortalTabId } from "./owner-portal-tabs";
import { OwnerProfileCompletenessCard } from "./owner-profile-completeness-card";
import { OwnerRecommendationsWidget } from "./owner-recommendations-widget";

export type OwnerPortalPageProps = {
  data: OwnerPortalViewData;
  /** Dashboard section — overview only; Talepler lives at `/owner/leads`. */
  activeTab?: Extract<OwnerPortalTabId, "overview" | "leads">;
  className?: string;
};

/**
 * Institution owner dashboard — repository-backed widgets, read-only.
 */
export function OwnerPortalPage({ data, activeTab = "overview", className }: OwnerPortalPageProps) {
  const section: Extract<OwnerPortalTabId, "overview" | "leads"> =
    activeTab === "leads" ? "leads" : "overview";

  if (section === "leads") {
    // Legacy `/owner?tab=leads` renders a calm redirect cue; route layer should redirect.
    return (
      <OwnerPortalShell
        institutionName={data.institutionName}
        institutionLogoUrl={data.institutionLogoUrl}
        activeTab="leads"
        className={className}
      >
        <Container size="xl" className="ea-owner-portal">
          <header className="ea-owner-portal__hero">
            <p className="ea-owner-portal__eyebrow">Kurum paneli</p>
            <h1 className="ea-owner-portal__title">Talepler</h1>
            <p className="ea-owner-portal__description">
              Talep çalışma alanına geçiliyor.{" "}
              <a href="/owner/leads" className="ea-owner-portal__public-link">
                Talepler’i aç
              </a>
            </p>
          </header>
        </Container>
      </OwnerPortalShell>
    );
  }

  return (
    <OwnerPortalShell
      institutionName={data.institutionName}
      institutionLogoUrl={data.institutionLogoUrl}
      activeTab="overview"
      className={className}
    >
      <Container size="2xl" className="ea-owner-portal">
        <header className="ea-owner-portal__hero">
          <p className="ea-owner-portal__eyebrow">Kurum paneli</p>
          <h1 className="ea-owner-portal__title">Gösterge paneli</h1>
          <p className="ea-owner-portal__description">
            {data.institutionName} için talep özeti ve öneriler. Yeni sahiplenme için{" "}
            <a href="/owner/onboarding">kurulum kontrol listesine</a> bakın.
          </p>
          <p className="ea-owner-portal__shortcuts">
            <a href="/owner/leads" className="ea-owner-portal__public-link">
              Talepler
            </a>
            <span aria-hidden="true"> · </span>
            <a href="/owner/leads?view=pipeline" className="ea-owner-portal__public-link">
              Pipeline
            </a>
            <span aria-hidden="true"> · </span>
            <a href="/owner/insights" className="ea-owner-portal__public-link">
              İçgörüler
            </a>
          </p>
        </header>

        <div className="ea-owner-dashboard__grid">
          <div className="ea-owner-dashboard__column">
            <OwnerInstitutionSummaryWidget summary={data.institutionSummary} />
            <OwnerProfileCompletenessCard completeness={data.profileCompleteness} />
          </div>
          <div className="ea-owner-dashboard__column">
            <OwnerLeadSummaryWidget summary={data.leadSummary} />
            <OwnerLeadTrendPlaceholder trend={data.leadTrend} />
          </div>
          <div className="ea-owner-dashboard__column ea-owner-dashboard__column--recommendations">
            <OwnerRecommendationsWidget recommendations={data.recommendations} />
          </div>
        </div>
      </Container>
    </OwnerPortalShell>
  );
}
