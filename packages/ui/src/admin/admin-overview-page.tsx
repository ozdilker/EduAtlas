import { buildAdminNavItems } from "./admin-nav";
import type { AdminOverviewViewData } from "./admin-overview-content";
import { AdminShell } from "./admin-shell";

export type AdminOverviewPageProps = {
  data: AdminOverviewViewData;
};

/**
 * Admin Overview — executive landing dashboard. Read-only presentation.
 */
export function AdminOverviewPage({ data }: AdminOverviewPageProps) {
  return (
    <AdminShell activeNavId="overview" navItems={buildAdminNavItems(data.navBadges)}>
      <header className="ea-admin-page-header">
        <div>
          <h1 className="ea-admin-page-header__title">{data.title}</h1>
          <p className="ea-admin-page-header__subtitle">{data.subtitle}</p>
        </div>
        <p className="ea-admin-page-header__meta">Güncellendi: {data.generatedAtLabel}</p>
      </header>

      <section
        className="ea-admin-overview__health"
        aria-labelledby="admin-overview-health-heading"
      >
        <h2 id="admin-overview-health-heading" className="ea-admin-section-title">
          Platform sağlığı
        </h2>
        <ul className="ea-admin-overview__stat-grid">
          {data.healthStats.map((stat) => (
            <li key={stat.id}>
              <article className="ea-admin-stat">
                <h3>{stat.label}</h3>
                <p className="ea-admin-stat__value">
                  {stat.href ? <a href={stat.href}>{stat.value}</a> : stat.value}
                </p>
                {stat.hint ? <p className="ea-admin-muted">{stat.hint}</p> : null}
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="ea-admin-overview__actions"
        aria-labelledby="admin-overview-actions-heading"
      >
        <h2 id="admin-overview-actions-heading" className="ea-admin-section-title">
          Hızlı işlemler
        </h2>
        <div className="ea-admin-ops__actions-grid">
          {data.quickActions.map((action) => (
            <a key={action.id} className="ea-admin-ops__action" href={action.href}>
              <strong>{action.label}</strong>
              <span className="ea-admin-muted">{action.description}</span>
            </a>
          ))}
        </div>
      </section>

      <div className="ea-admin-overview__layout">
        <div className="ea-admin-overview__activity">
          <h2 id="admin-overview-activity-heading" className="ea-sr-only">
            Son etkinlik
          </h2>
          <ActivityCard
            headingId="admin-overview-latest-institutions"
            title="Son kurumlar"
            empty="Henüz kurum kaydı yok."
            items={data.latestInstitutions}
            footerHref="/admin/acquisition"
            footerLabel="Tüm kurumlara git"
          />
          <ActivityCard
            headingId="admin-overview-latest-claims"
            title="Son sahiplenme talepleri"
            empty="Bekleyen sahiplenme sinyali yok."
            items={data.latestClaims}
            footerHref="/admin/acquisition?queue=claimed"
            footerLabel="Sahiplenme kuyruğuna git"
          />
          <ActivityCard
            headingId="admin-overview-latest-imports"
            title="Son içe aktarımlar"
            empty="Yakın zamanda içe aktarım kaydı yok."
            items={data.latestImports}
            footerHref="/admin/import"
            footerLabel="İçe aktarma aracına git"
          />
        </div>

        <aside className="ea-admin-overview__ai" aria-labelledby="admin-overview-ai-heading">
          <header className="ea-admin-overview__ai-header">
            <div>
              <h2 id="admin-overview-ai-heading" className="ea-admin-section-title">
                {data.aiPanel.title}
              </h2>
              <p className="ea-admin-muted">{data.aiPanel.description}</p>
            </div>
            <p className="ea-admin-overview__ai-meta">
              {data.aiPanel.agentCount} ajan · yalnızca öneri
            </p>
          </header>

          {data.aiRecommendations.length === 0 ? (
            <p className="ea-admin-muted" role="status">
              Şu an için AI önerisi yok. Kuyruklar ve kalite kuralları tetiklendiğinde burada
              görünür.
            </p>
          ) : (
            <ul className="ea-admin-overview__ai-list">
              {data.aiRecommendations.map((item) => (
                <li key={item.id} className="ea-admin-overview__ai-item">
                  <div className="ea-admin-overview__ai-item-top">
                    <h3 className="ea-admin-overview__ai-item-title">{item.title}</h3>
                    <span className="ea-admin-pill">{item.priorityLabel}</span>
                  </div>
                  <p className="ea-admin-overview__ai-item-message">{item.message}</p>
                  <div className="ea-admin-overview__ai-item-meta">
                    <span>{item.agentLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.ruleId}</span>
                  </div>
                  <a href={item.href} className="ea-admin-overview__ai-link">
                    İncele
                  </a>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}

function ActivityCard({
  headingId,
  title,
  empty,
  items,
  footerHref,
  footerLabel,
}: {
  headingId: string;
  title: string;
  empty: string;
  items: AdminOverviewViewData["latestInstitutions"];
  footerHref: string;
  footerLabel: string;
}) {
  return (
    <section className="ea-admin-ops__card" aria-labelledby={headingId}>
      <h2 id={headingId} className="ea-admin-section-title">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="ea-admin-muted" role="status">
          {empty}
        </p>
      ) : (
        <ul className="ea-admin-bucket-list">
          {items.map((item) => (
            <li key={item.id}>
              <span>
                <a href={item.href}>{item.title}</a>
                <span className="ea-admin-muted"> · {item.meta}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <a href={footerHref}>{footerLabel}</a>
    </section>
  );
}
