import { cn } from "../lib/cn";
import type {
  OwnerInsightsDistributionItemView,
  OwnerInsightsFunnelStepView,
  OwnerInsightsMetricView,
  OwnerInsightsViewData,
} from "./owner-insights-content";
import { OwnerRecommendationsWidget } from "./owner-recommendations-widget";

export type OwnerInsightsWidgetProps = {
  data: OwnerInsightsViewData;
  className?: string;
};

function MetricCard({ metric }: { metric: OwnerInsightsMetricView }) {
  return (
    <section
      className={cn(
        "ea-owner-widget",
        metric.kind === "placeholder" && "ea-owner-widget--placeholder",
      )}
      aria-labelledby={`owner-insight-${metric.id}-heading`}
    >
      <h2 id={`owner-insight-${metric.id}-heading`} className="ea-owner-widget__title">
        {metric.label}
      </h2>
      <p className="ea-owner-completeness__value">{metric.value}</p>
      {metric.description ? (
        <p className="ea-owner-widget__description">{metric.description}</p>
      ) : null}
    </section>
  );
}

function DistributionBars({
  title,
  headingId,
  items,
}: {
  title: string;
  headingId: string;
  items: readonly OwnerInsightsDistributionItemView[] | readonly OwnerInsightsFunnelStepView[];
}) {
  return (
    <section className="ea-owner-widget" aria-labelledby={headingId}>
      <h2 id={headingId} className="ea-owner-widget__title">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="ea-owner-leads-empty" role="status">
          Henüz veri yok.
        </p>
      ) : (
        <ul className="ea-owner-insights-bars">
          {items.map((item) => (
            <li key={item.status} className="ea-owner-insights-bars__item">
              <div className="ea-owner-insights-bars__label-row">
                <span>{item.label}</span>
                <span>
                  {item.count} · %{item.percentage}
                </span>
              </div>
              <div className="ea-owner-completeness__meter" aria-hidden="true">
                <span
                  className="ea-owner-completeness__meter-fill"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Reusable Owner Insights widgets — cards and progress bars only (no chart library).
 */
export function OwnerInsightsWidget({ data, className }: OwnerInsightsWidgetProps) {
  return (
    <div className={cn("ea-owner-insights", className)}>
      <div className="ea-owner-insights__metrics">
        <MetricCard
          metric={{
            id: "total_leads",
            label: "Toplam talep",
            value: data.totalLeads,
            description: "EduAtlas üzerinden alınan tüm talepler.",
            kind: "metric",
          }}
        />
        <MetricCard
          metric={{
            id: "new_leads_30d",
            label: "Yeni talepler (30 gün)",
            value: data.newLeadsLast30Days,
            description: `Önceki 30 gün: ${data.previousPeriodLeads}`,
            kind: "metric",
          }}
        />
        <section
          className="ea-owner-widget ea-owner-widget--completeness"
          aria-labelledby="owner-insights-completeness-heading"
        >
          <header className="ea-owner-widget__header">
            <h2 id="owner-insights-completeness-heading" className="ea-owner-widget__title">
              Profil tamamlanma
            </h2>
            <a href={data.profileCompleteness.profileHref} className="ea-owner-widget__link">
              Profili düzenle
            </a>
          </header>
          <p className="ea-owner-completeness__percent" aria-live="polite">
            <span className="ea-owner-completeness__value">
              {data.profileCompleteness.overallPercentage}%
            </span>
            <span className="ea-owner-completeness__label">tamamlandı</span>
          </p>
          <div className="ea-owner-completeness__meter" aria-hidden="true">
            <span
              className="ea-owner-completeness__meter-fill"
              style={{ width: `${data.profileCompleteness.overallPercentage}%` }}
            />
          </div>
          <p className="ea-owner-widget__description">{data.profileCompleteness.nextActionHint}</p>
        </section>
        <MetricCard metric={data.averageResponseTime} />
        <MetricCard metric={data.topLeadSource} />
        <MetricCard metric={data.growthTrend} />
      </div>

      <div className="ea-owner-insights__charts">
        <DistributionBars
          title="Talep durumu dağılımı"
          headingId="owner-insights-status-heading"
          items={data.statusDistribution}
        />
        <DistributionBars
          title="Dönüşüm hunisi"
          headingId="owner-insights-funnel-heading"
          items={data.conversionFunnel}
        />
      </div>

      <section
        className="ea-owner-widget ea-owner-insights__business"
        aria-labelledby="owner-insights-business-heading"
      >
        <h2 id="owner-insights-business-heading" className="ea-owner-widget__title">
          İş içgörüleri
        </h2>
        <ul className="ea-owner-insights__list">
          {data.businessInsights.map((insight) => (
            <li key={insight.id}>{insight.message}</li>
          ))}
        </ul>
      </section>

      <OwnerRecommendationsWidget
        recommendations={{
          title: "Satış önerileri",
          description:
            "Kurum profiliniz ve detay sayfanız analiz edilerek oluşturuldu. Öneriler salt okunurdur; otomatik işlem yoktur.",
          count: data.recommendations.length,
          items: data.recommendations,
        }}
      />
    </div>
  );
}
