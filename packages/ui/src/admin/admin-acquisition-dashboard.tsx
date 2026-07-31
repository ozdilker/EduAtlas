import { Button } from "../components/button";
import { Input } from "../components/input";
import {
  AdminAcquisitionBulkToolbar,
  type ApproveInstitutionClaimAction,
} from "./admin-acquisition-bulk-toolbar";
import {
  type AdminAcquisitionDashboardViewData,
  buildAdminAcquisitionQueueHref,
} from "./admin-acquisition-content";
import { buildAdminNavItems } from "./admin-nav";
import { AdminShell } from "./admin-shell";

export type AdminAcquisitionDashboardProps = {
  data: AdminAcquisitionDashboardViewData;
  approveClaimAction?: ApproveInstitutionClaimAction;
};

/**
 * Institution Acquisition Dashboard — operational foundation (read + UI-only bulk).
 */
export function AdminAcquisitionDashboard({
  data,
  approveClaimAction,
}: AdminAcquisitionDashboardProps) {
  const stats = data.statistics;
  const { pagination } = data;

  return (
    <AdminShell
      activeNavId="acquisition"
      navItems={buildAdminNavItems({ acquisition: stats.totalInstitutions })}
    >
      <header className="ea-admin-page-header">
        <div>
          <h1 className="ea-admin-page-header__title">{data.title}</h1>
          <p className="ea-admin-page-header__subtitle">{data.subtitle}</p>
        </div>
        <p className="ea-admin-page-header__meta">Güncellendi: {data.generatedAtLabel}</p>
      </header>

      <section className="ea-admin-progress" aria-labelledby="acquisition-progress-heading">
        <div className="ea-admin-progress__head">
          <h2 id="acquisition-progress-heading" className="ea-admin-section-title">
            Edinim ilerlemesi
          </h2>
          <p className="ea-admin-muted">
            Doğrulama %{stats.verificationRatePercent} · Sahiplenme %{stats.claimRatePercent}
          </p>
        </div>
        <div
          className="ea-admin-progress__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stats.progressPercent}
          aria-label="Edinim ilerleme oranı"
        >
          <span style={{ width: `${stats.progressPercent}%` }} />
        </div>
      </section>

      <section className="ea-admin-stats" aria-labelledby="acquisition-stats-heading">
        <h2 id="acquisition-stats-heading" className="ea-admin-section-title">
          İstatistikler
        </h2>
        <div className="ea-admin-stats__grid">
          <article className="ea-admin-stat">
            <h3>Toplam kurum</h3>
            <p className="ea-admin-stat__value">{stats.totalInstitutions}</p>
          </article>
          <article className="ea-admin-stat">
            <h3>Sahiplenme oranı</h3>
            <p className="ea-admin-stat__value">%{stats.claimRatePercent}</p>
          </article>
          <article className="ea-admin-stat">
            <h3>Doğrulama oranı</h3>
            <p className="ea-admin-stat__value">%{stats.verificationRatePercent}</p>
          </article>
          <article className="ea-admin-stat">
            <h3>Ortalama kalite</h3>
            <p className="ea-admin-stat__value">{stats.averageQualityScore}</p>
            <p className="ea-admin-muted">İç kalite skoru (Growth Score değil)</p>
          </article>
          <article className="ea-admin-stat">
            <h3>Kalite dağılımı</h3>
            <ul className="ea-admin-stat__list">
              <li>Kritik/Düşük: {stats.qualityDistribution.low}</li>
              <li>Orta: {stats.qualityDistribution.medium}</li>
              <li>İyi: {stats.qualityDistribution.healthy}</li>
              <li>Mükemmel: {stats.qualityDistribution.excellent}</li>
              <li>A notu: {stats.qualityDistribution.byGrade.A ?? 0}</li>
              <li>F notu: {stats.qualityDistribution.byGrade.F ?? 0}</li>
            </ul>
          </article>
        </div>

        <div className="ea-admin-stats__columns">
          <div>
            <h3 className="ea-admin-subsection-title">Şehire göre</h3>
            <ul className="ea-admin-bucket-list">
              {stats.byCity.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="ea-admin-subsection-title">Türe göre</h3>
            <ul className="ea-admin-bucket-list">
              {stats.byType.map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </div>
          {data.duplicateCandidates.length > 0 ? (
            <div>
              <h3 className="ea-admin-subsection-title">Yinelenen adaylar</h3>
              <ul className="ea-admin-bucket-list">
                {data.duplicateCandidates.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="ea-admin-queues" aria-labelledby="acquisition-queues-heading">
        <h2 id="acquisition-queues-heading" className="ea-admin-section-title">
          Kuyruklar
        </h2>
        <div className="ea-admin-queues__tabs" role="tablist" aria-label="Edinim kuyrukları">
          {data.queueTabs.map((tab) => {
            const selected = tab.id === data.activeQueue;
            return (
              <a
                key={tab.id}
                href={tab.href}
                role="tab"
                aria-selected={selected}
                className={
                  selected
                    ? "ea-admin-queues__tab ea-admin-queues__tab--active"
                    : "ea-admin-queues__tab"
                }
              >
                {tab.label}
                <span className="ea-admin-shell__badge">{tab.count}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="ea-admin-filters" aria-labelledby="acquisition-filters-heading">
        <h2 id="acquisition-filters-heading" className="ea-admin-section-title">
          Filtreler
        </h2>
        <form className="ea-admin-filters__form" method="get" action="/admin/acquisition">
          <input type="hidden" name="page" value="1" />
          {data.activeQueue !== "all" ? (
            <input type="hidden" name="queue" value={data.activeQueue} />
          ) : null}

          <div className="ea-admin-field">
            <label htmlFor="admin-acquisition-sort">Sıralama</label>
            <select
              id="admin-acquisition-sort"
              name="sort"
              defaultValue={data.activeSort}
              className="ea-admin-select"
            >
              {data.sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ea-admin-field">
            <label htmlFor="admin-acquisition-search">Ara</label>
            <Input
              id="admin-acquisition-search"
              name="q"
              type="search"
              defaultValue={data.searchQuery}
              placeholder="Kurum adı veya slug"
              autoComplete="off"
            />
          </div>

          <div className="ea-admin-field">
            <label htmlFor="admin-acquisition-city">Şehir</label>
            <select
              id="admin-acquisition-city"
              name="cityId"
              defaultValue={data.filters.cityId}
              className="ea-admin-select"
            >
              <option value="">Tümü</option>
              {data.cityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ea-admin-field">
            <label htmlFor="admin-acquisition-district">İlçe</label>
            <select
              id="admin-acquisition-district"
              name="districtId"
              defaultValue={data.filters.districtId}
              className="ea-admin-select"
              disabled={!data.filters.cityId && data.districtOptions.length === 0}
            >
              <option value="">Tümü</option>
              {data.districtOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ea-admin-field">
            <label htmlFor="admin-acquisition-type">Kurum türü</label>
            <select
              id="admin-acquisition-type"
              name="primaryType"
              defaultValue={data.filters.primaryType}
              className="ea-admin-select"
            >
              <option value="">Tümü</option>
              {data.typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ea-admin-field">
            <label htmlFor="admin-acquisition-verification">Doğrulama durumu</label>
            <select
              id="admin-acquisition-verification"
              name="verification"
              defaultValue={data.filters.verification}
              className="ea-admin-select"
            >
              <option value="">Tümü</option>
              {data.verificationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ea-admin-field">
            <label htmlFor="admin-acquisition-ownership">Sahiplik durumu</label>
            <select
              id="admin-acquisition-ownership"
              name="ownership"
              defaultValue={data.filters.ownership}
              className="ea-admin-select"
            >
              <option value="">Tümü</option>
              {data.ownershipOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ea-admin-field">
            <label htmlFor="admin-acquisition-status">Yayın durumu</label>
            <select
              id="admin-acquisition-status"
              name="status"
              defaultValue={data.filters.status}
              className="ea-admin-select"
            >
              <option value="">Tümü</option>
              {data.statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ea-admin-filters__actions">
            <Button type="submit" size="sm">
              Uygula
            </Button>
            <a className="ea-admin-link-reset" href="/admin/acquisition">
              Temizle
            </a>
          </div>
        </form>
      </section>

      <section className="ea-admin-results" aria-labelledby="acquisition-results-heading">
        <div className="ea-admin-results__header">
          <h2 id="acquisition-results-heading" className="ea-admin-section-title">
            Kurum listesi ({data.filteredCount})
          </h2>
          {data.filteredCount > 0 ? (
            <p className="ea-admin-muted" aria-live="polite">
              {pagination.from}–{pagination.to} / {pagination.totalItems}
            </p>
          ) : null}
        </div>
        <AdminAcquisitionBulkToolbar
          rows={data.rows}
          note={data.bulkActionsNote}
          approveClaimAction={approveClaimAction}
        />
        {pagination.totalPages > 1 ? (
          <nav className="ea-admin-published__pager" aria-label="Kurum edinimi sayfaları">
            {pagination.page <= 1 ? (
              <span className="ea-admin-published__pager-link ea-admin-published__pager-link--disabled">
                Önceki
              </span>
            ) : (
              <a
                className="ea-admin-published__pager-link"
                href={buildAdminAcquisitionQueueHref(
                  data.activeQueue,
                  data.filters,
                  data.searchQuery,
                  data.activeSort,
                  pagination.page - 1,
                )}
              >
                Önceki
              </a>
            )}
            <ol className="ea-admin-published__pager-pages">
              {pagination.pageNumbers.map((pageNumber) => (
                <li key={pageNumber}>
                  <a
                    className={
                      pageNumber === pagination.page
                        ? "ea-admin-published__pager-link ea-admin-published__pager-link--current"
                        : "ea-admin-published__pager-link"
                    }
                    href={buildAdminAcquisitionQueueHref(
                      data.activeQueue,
                      data.filters,
                      data.searchQuery,
                      data.activeSort,
                      pageNumber,
                    )}
                    aria-current={pageNumber === pagination.page ? "page" : undefined}
                  >
                    {pageNumber}
                  </a>
                </li>
              ))}
            </ol>
            {pagination.page >= pagination.totalPages ? (
              <span className="ea-admin-published__pager-link ea-admin-published__pager-link--disabled">
                Sonraki
              </span>
            ) : (
              <a
                className="ea-admin-published__pager-link"
                href={buildAdminAcquisitionQueueHref(
                  data.activeQueue,
                  data.filters,
                  data.searchQuery,
                  data.activeSort,
                  pagination.page + 1,
                )}
              >
                Sonraki
              </a>
            )}
          </nav>
        ) : null}
      </section>
    </AdminShell>
  );
}
