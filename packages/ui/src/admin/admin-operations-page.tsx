import { buildAdminNavItems } from "./admin-nav";
import type { AdminOperationsViewData } from "./admin-operations-content";
import { AdminShell } from "./admin-shell";

export type AdminOperationsPageProps = {
  data: AdminOperationsViewData;
};

/**
 * Data Operations Workspace — read-only operational dashboard composing
 * acquisition, import, review, quality, and claim views. No mutations here.
 */
export function AdminOperationsPage({ data }: AdminOperationsPageProps) {
  return (
    <AdminShell activeNavId="operations" navItems={buildAdminNavItems()}>
      <header className="ea-admin-page-header">
        <div>
          <h1 className="ea-admin-page-header__title">{data.title}</h1>
          <p className="ea-admin-page-header__subtitle">{data.subtitle}</p>
        </div>
        <p className="ea-admin-page-header__meta">Güncellendi: {data.generatedAtLabel}</p>
      </header>

      <section className="ea-admin-ops__health" aria-labelledby="ops-health-heading">
        <h2 id="ops-health-heading" className="ea-admin-section-title">
          Platform sağlığı
        </h2>
        <div className="ea-admin-stats__grid">
          <article className="ea-admin-stat">
            <h3>Ortalama kalite</h3>
            <p className="ea-admin-stat__value">{data.health.averageQuality}</p>
            <p className="ea-admin-muted">İç kalite skoru (Growth Score değil)</p>
          </article>
          <article className="ea-admin-stat">
            <h3>Taslak</h3>
            <p className="ea-admin-stat__value">{data.health.draftCount}</p>
          </article>
          <article className="ea-admin-stat">
            <h3>Yayında</h3>
            <p className="ea-admin-stat__value">{data.health.publishedCount}</p>
          </article>
          <article className="ea-admin-stat">
            <h3>Sahiplenme oranı</h3>
            <p className="ea-admin-stat__value">%{data.health.claimRatePercent}</p>
          </article>
          <article className="ea-admin-stat">
            <h3>Yinelenme oranı</h3>
            <p className="ea-admin-stat__value">%{data.health.duplicateRatePercent}</p>
          </article>
        </div>
      </section>

      <section className="ea-admin-ops__actions" aria-labelledby="ops-actions-heading">
        <h2 id="ops-actions-heading" className="ea-admin-section-title">
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

      <div className="ea-admin-ops__grid">
        <section className="ea-admin-ops__card" aria-labelledby="ops-acquisition-heading">
          <h2 id="ops-acquisition-heading" className="ea-admin-section-title">
            Edinim özeti
          </h2>
          <ul className="ea-admin-stat__list">
            <li>
              Toplam kurum: <strong>{data.acquisition.totalInstitutions}</strong>
            </li>
            <li>
              Sahiplenme: <strong>%{data.acquisition.claimRatePercent}</strong>
            </li>
            <li>
              Doğrulama: <strong>%{data.acquisition.verificationRatePercent}</strong>
            </li>
          </ul>
          <h3 className="ea-admin-subsection-title">Şehire göre</h3>
          <ul className="ea-admin-bucket-list">
            {data.acquisition.topCities.map((item) => (
              <li key={item.id}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
          <h3 className="ea-admin-subsection-title">Türe göre</h3>
          <ul className="ea-admin-bucket-list">
            {data.acquisition.topTypes.map((item) => (
              <li key={item.id}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
          <a href="/admin/acquisition">Edinim panosuna git</a>
        </section>

        <section className="ea-admin-ops__card" aria-labelledby="ops-import-heading">
          <h2 id="ops-import-heading" className="ea-admin-section-title">
            İçe aktarma kuyruğu
          </h2>
          <ul className="ea-admin-stat__list">
            <li>
              Taslak (içe aktarım kuyruğu): <strong>{data.importQueue.draftCount}</strong>
            </li>
            <li>
              Yayına hazır bekleyen: <strong>{data.importQueue.readyForReviewCount}</strong>
            </li>
          </ul>
          <p className="ea-admin-muted">
            İçe aktarılan kurumlar doğrudan yayına alınır; inceleme kuyruğu isteğe bağlıdır.
          </p>
          <a href="/admin/import">İçe aktarma aracına git</a>
        </section>

        <section className="ea-admin-ops__card" aria-labelledby="ops-review-heading">
          <h2 id="ops-review-heading" className="ea-admin-section-title">
            İnceleme kuyruğu özeti
          </h2>
          <ul className="ea-admin-stat__list">
            <li>
              Taslak kuyruğu: <strong>{data.reviewQueue.draft}</strong>
            </li>
            <li>
              İnceleme bekleyen: <strong>{data.reviewQueue.needsReview}</strong>
            </li>
            <li>
              Yayına hazır: <strong>{data.reviewQueue.ready}</strong>
            </li>
            <li>
              Yayında: <strong>{data.reviewQueue.published}</strong>
            </li>
            <li>
              Reddedilen: <strong>{data.reviewQueue.rejected}</strong>
            </li>
          </ul>
          <a href="/admin/review">İnceleme kuyruğuna git</a>
        </section>

        <section className="ea-admin-ops__card" aria-labelledby="ops-published-heading">
          <h2 id="ops-published-heading" className="ea-admin-section-title">
            Yayındaki kurumlar
          </h2>
          <p>
            <span className="ea-admin-stat__value">{data.published.count}</span>
          </p>
          {data.published.latest.length > 0 ? (
            <>
              <h3 className="ea-admin-subsection-title">Son yayınlananlar</h3>
              <ul className="ea-admin-bucket-list">
                {data.published.latest.map((item) => (
                  <li key={item.id}>
                    <span>
                      <a href={item.href}>{item.name}</a>
                      <span className="ea-admin-muted"> · {item.cityLabel}</span>
                    </span>
                    <strong>{item.publishedAtLabel}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="ea-admin-muted">Henüz yayınlanan kurum yok.</p>
          )}
        </section>

        <section className="ea-admin-ops__card" aria-labelledby="ops-quality-heading">
          <h2 id="ops-quality-heading" className="ea-admin-section-title">
            Kalite dağılımı
          </h2>
          <ul className="ea-admin-stat__list">
            <li>
              Ortalama: <strong>{data.quality.averageScore}</strong>
            </li>
            <li>
              Düşük (0–39): <strong>{data.quality.low}</strong>
            </li>
            <li>
              Orta (40–69): <strong>{data.quality.medium}</strong>
            </li>
            <li>
              İyi (70–84): <strong>{data.quality.healthy}</strong>
            </li>
            <li>
              Mükemmel (85+): <strong>{data.quality.excellent}</strong>
            </li>
          </ul>
          <h3 className="ea-admin-subsection-title">Nota göre</h3>
          <ul className="ea-admin-bucket-list">
            {Object.entries(data.quality.byGrade).map(([grade, count]) => (
              <li key={grade}>
                <span>{grade}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
          <a href="/admin/acquisition?sort=lowest">En düşük kaliteden başla</a>
        </section>

        <section className="ea-admin-ops__card" aria-labelledby="ops-claims-heading">
          <h2 id="ops-claims-heading" className="ea-admin-section-title">
            Sahiplenme istatistikleri
          </h2>
          <ul className="ea-admin-stat__list">
            <li>
              Sahiplenilmiş / talepte: <strong>{data.claims.claimedCount}</strong>
            </li>
            <li>
              Doğrulanmış sahip: <strong>{data.claims.verifiedCount}</strong>
            </li>
            <li>
              Bekleyen talep: <strong>{data.claims.pendingCount}</strong>
            </li>
            <li>
              Sahipsiz: <strong>{data.claims.unclaimedCount}</strong>
            </li>
            <li>
              Sahiplenme oranı: <strong>%{data.claims.claimRatePercent}</strong>
            </li>
            <li>
              Doğrulama oranı: <strong>%{data.claims.verificationRatePercent}</strong>
            </li>
          </ul>
        </section>

        <section
          className="ea-admin-ops__card ea-admin-ops__card--wide"
          aria-labelledby="ops-activity-heading"
        >
          <h2 id="ops-activity-heading" className="ea-admin-section-title">
            Son etkinlik
          </h2>
          {data.recentActivity.length === 0 ? (
            <p className="ea-admin-muted">Kayıtlı etkinlik yok.</p>
          ) : (
            <div className="ea-admin-table-wrap">
              <table className="ea-admin-table">
                <caption className="ea-sr-only">Son güncellenen kurumlar</caption>
                <thead>
                  <tr>
                    <th scope="col">Kurum</th>
                    <th scope="col">Durum</th>
                    <th scope="col">Güncellendi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity.map((item) => (
                    <tr key={item.id}>
                      <td className="ea-admin-table__name">
                        <a href={item.href}>{item.name}</a>
                      </td>
                      <td>
                        <span className="ea-admin-pill">{item.statusLabel}</span>
                      </td>
                      <td>{item.updatedAtLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
