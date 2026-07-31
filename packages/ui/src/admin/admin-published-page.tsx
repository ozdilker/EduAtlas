import { Button } from "../components/button";
import {
  type AdminPublishedInstitutionsViewData,
  buildAdminPublishedHref,
} from "./admin-published-content";
import { buildAdminNavItems } from "./admin-nav";
import { AdminShell } from "./admin-shell";

export type AdminPublishedPageProps = {
  data: AdminPublishedInstitutionsViewData;
};

/**
 * Admin list of published institutions — verify imports and filter by city.
 */
export function AdminPublishedPage({ data }: AdminPublishedPageProps) {
  const { pagination } = data;

  return (
    <AdminShell
      activeNavId="published"
      navItems={buildAdminNavItems({ published: data.totalCount })}
    >
      <header className="ea-admin-page-header">
        <div>
          <h1 className="ea-admin-page-header__title">{data.title}</h1>
          <p className="ea-admin-page-header__subtitle">{data.subtitle}</p>
        </div>
      </header>

      <section className="ea-admin-stats" aria-labelledby="published-stats-heading">
        <h2 id="published-stats-heading" className="ea-sr-only">
          Özet
        </h2>
        <div className="ea-admin-stats__grid">
          <article className="ea-admin-stat">
            <h3>Toplam yayında</h3>
            <p className="ea-admin-stat__value">{data.totalCount}</p>
          </article>
          <article className="ea-admin-stat">
            <h3>Filtrelenen</h3>
            <p className="ea-admin-stat__value">{data.filteredCount}</p>
          </article>
          <article className="ea-admin-stat">
            <h3>Sayfa</h3>
            <p className="ea-admin-stat__value">
              {pagination.page}/{pagination.totalPages}
            </p>
          </article>
        </div>
      </section>

      <section className="ea-admin-filters" aria-labelledby="published-filters-heading">
        <h2 id="published-filters-heading" className="ea-admin-section-title">
          Filtreler
        </h2>
        <form className="ea-admin-filters__form" method="get" action="/admin/published">
          <input type="hidden" name="page" value="1" />
          <div className="ea-admin-field">
            <label htmlFor="admin-published-city">Şehir (il)</label>
            <select id="admin-published-city" name="cityId" defaultValue={data.cityId}>
              <option value="">Tüm iller</option>
              {data.cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>
          <div className="ea-admin-field">
            <label htmlFor="admin-published-search">Ara</label>
            <input
              id="admin-published-search"
              name="q"
              type="search"
              defaultValue={data.query}
              placeholder="Kurum adı veya slug…"
            />
          </div>
          <div className="ea-admin-filters__actions">
            <Button type="submit" size="sm" variant="primary">
              Uygula
            </Button>
            <a className="ea-admin-link-reset" href={buildAdminPublishedHref({})}>
              Sıfırla
            </a>
          </div>
        </form>
      </section>

      <section className="ea-admin-results" aria-labelledby="published-results-heading">
        <div className="ea-admin-results__header">
          <h2 id="published-results-heading" className="ea-admin-section-title">
            Yayındaki kurumlar ({data.filteredCount})
          </h2>
          {data.filteredCount > 0 ? (
            <p className="ea-admin-muted" aria-live="polite">
              {pagination.from}–{pagination.to} / {pagination.totalItems}
            </p>
          ) : null}
        </div>

        {data.rows.length === 0 ? (
          <p className="ea-admin-muted" role="status">
            {data.emptyMessage}
          </p>
        ) : (
          <>
            <div className="ea-admin-table-wrap">
              <table className="ea-admin-table">
                <caption className="ea-sr-only">Yayınlanmış kurum listesi</caption>
                <thead>
                  <tr>
                    <th scope="col">Kurum</th>
                    <th scope="col">Tür</th>
                    <th scope="col">İl / İlçe</th>
                    <th scope="col">Durum</th>
                    <th scope="col">Kalite</th>
                    <th scope="col">Yayın</th>
                    <th scope="col">Bağlantılar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="ea-admin-table__name">{row.name}</div>
                        <code className="ea-admin-muted">{row.slug}</code>
                      </td>
                      <td>{row.typeLabel}</td>
                      <td>
                        {row.cityLabel}
                        {row.districtLabel ? ` / ${row.districtLabel}` : ""}
                      </td>
                      <td>
                        <span className="ea-admin-pill">{row.statusLabel}</span>
                      </td>
                      <td>
                        <span className="ea-admin-score">{row.qualityScore}</span>
                      </td>
                      <td>{row.publishedAtLabel}</td>
                      <td>
                        <div className="ea-admin-published__links">
                          <a href={row.publicHref} target="_blank" rel="noreferrer">
                            Site
                          </a>
                          <a href={row.profileHref}>İnceleme</a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 ? (
              <nav className="ea-admin-published__pager" aria-label="Yayındaki kurum sayfaları">
                {pagination.page <= 1 ? (
                  <span className="ea-admin-published__pager-link ea-admin-published__pager-link--disabled">
                    Önceki
                  </span>
                ) : (
                  <a
                    className="ea-admin-published__pager-link"
                    href={buildAdminPublishedHref({
                      cityId: data.cityId,
                      q: data.query,
                      page: pagination.page - 1,
                    })}
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
                        href={buildAdminPublishedHref({
                          cityId: data.cityId,
                          q: data.query,
                          page: pageNumber,
                        })}
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
                    href={buildAdminPublishedHref({
                      cityId: data.cityId,
                      q: data.query,
                      page: pagination.page + 1,
                    })}
                  >
                    Sonraki
                  </a>
                )}
              </nav>
            ) : null}
          </>
        )}
      </section>
    </AdminShell>
  );
}
