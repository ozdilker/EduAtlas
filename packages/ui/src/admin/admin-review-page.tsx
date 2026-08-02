import { Button } from "../components/button";
import { Input } from "../components/input";
import { buildAdminNavItems } from "./admin-nav";
import type { AdminReviewQueueViewData } from "./admin-review-content";
import { AdminShell } from "./admin-shell";

export type AdminReviewPageProps = {
  data: AdminReviewQueueViewData;
  /** Server action: publish / return_to_draft / reject. No Firestore in UI. */
  reviewAction: (formData: FormData) => Promise<void>;
  /** Force-refresh Google Place details. */
  syncGoogleAction?: (formData: FormData) => Promise<void>;
  /** Re-run Text Search match (“Google Eşleşmesini Yeniden Ara”). */
  rematchGoogleAction?: (formData: FormData) => Promise<void>;
};

/**
 * Institution Review Queue — human review before publication.
 * Queue tabs, filters, row list, and a review panel with actions.
 */
export function AdminReviewPage({
  data,
  reviewAction,
  syncGoogleAction,
  rematchGoogleAction,
}: AdminReviewPageProps) {
  const selected = data.selected;

  return (
    <AdminShell
      activeNavId="review"
      navItems={buildAdminNavItems({
        review: (() => {
          const count = data.queueTabs.find((tab) => tab.id === "needs_review")?.count ?? 0;
          return count > 0 ? count : undefined;
        })(),
      })}
    >
      <header className="ea-admin-page-header">
        <div>
          <h1 className="ea-admin-page-header__title">{data.title}</h1>
          <p className="ea-admin-page-header__subtitle">{data.subtitle}</p>
        </div>
        <p className="ea-admin-page-header__meta">Güncellendi: {data.generatedAtLabel}</p>
      </header>

      {data.notice ? (
        <p
          className={
            data.noticeTone === "error"
              ? "ea-admin-import__status ea-admin-import__status--error"
              : "ea-admin-import__status ea-admin-import__status--info"
          }
          role="status"
        >
          {data.notice}
        </p>
      ) : null}

      <section className="ea-admin-queues" aria-labelledby="review-queues-heading">
        <h2 id="review-queues-heading" className="ea-admin-section-title">
          Kuyruklar
        </h2>
        <div className="ea-admin-queues__tabs" role="tablist" aria-label="İnceleme kuyrukları">
          {data.queueTabs.map((tab) => {
            const isSelected = tab.id === data.activeQueue;
            return (
              <a
                key={tab.id}
                href={tab.href}
                role="tab"
                aria-selected={isSelected}
                className={
                  isSelected
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

      <section className="ea-admin-filters" aria-labelledby="review-filters-heading">
        <h2 id="review-filters-heading" className="ea-admin-section-title">
          Filtreler
        </h2>
        <form className="ea-admin-filters__form" method="get" action="/admin/review">
          {data.activeQueue !== "draft" ? (
            <input type="hidden" name="queue" value={data.activeQueue} />
          ) : null}

          <div className="ea-admin-field">
            <label htmlFor="admin-review-search">Ara</label>
            <Input
              id="admin-review-search"
              name="q"
              type="search"
              defaultValue={data.searchQuery}
              placeholder="Kurum adı veya slug"
              autoComplete="off"
            />
          </div>

          <div className="ea-admin-field">
            <label htmlFor="admin-review-sort">Sıralama</label>
            <select
              id="admin-review-sort"
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
            <label htmlFor="admin-review-city">Şehir</label>
            <select
              id="admin-review-city"
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
            <label htmlFor="admin-review-district">İlçe</label>
            <select
              id="admin-review-district"
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
            <label htmlFor="admin-review-type">Kurum türü</label>
            <select
              id="admin-review-type"
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
            <label htmlFor="admin-review-quality">Kalite</label>
            <select
              id="admin-review-quality"
              name="qualityBand"
              defaultValue={data.filters.qualityBand}
              className="ea-admin-select"
            >
              <option value="">Tümü</option>
              {data.qualityBandOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ea-admin-field">
            <label htmlFor="admin-review-status">Yayın durumu</label>
            <select
              id="admin-review-status"
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
            <a className="ea-admin-link-reset" href="/admin/review">
              Temizle
            </a>
          </div>
        </form>
      </section>

      <div className="ea-admin-review__layout">
        <section className="ea-admin-results" aria-labelledby="review-results-heading">
          <h2 id="review-results-heading" className="ea-admin-section-title">
            Kurumlar ({data.rows.length})
          </h2>
          <div className="ea-admin-table-wrap">
            <table className="ea-admin-table">
              <caption className="ea-sr-only">
                İnceleme kuyruğundaki kurumlar; satır seçerek inceleme panelini açın
              </caption>
              <thead>
                <tr>
                  <th scope="col">Kurum</th>
                  <th scope="col">Tür</th>
                  <th scope="col">Konum</th>
                  <th scope="col">Durum</th>
                  <th scope="col">Kalite</th>
                  <th scope="col">Eksik</th>
                  <th scope="col">Eklendi</th>
                  <th scope="col">
                    <span className="ea-sr-only">İncele</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ea-admin-table__empty">
                      Bu kuyrukta kurum yok.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr
                      key={row.id}
                      data-duplicate={row.isDuplicateCandidate}
                      data-selected={selected?.id === row.id}
                    >
                      <td className="ea-admin-table__name">
                        {row.name}
                        <span className="ea-admin-muted">{row.slug}</span>
                      </td>
                      <td>{row.typeLabel}</td>
                      <td>
                        {row.cityLabel} / {row.districtLabel}
                      </td>
                      <td>
                        <span className="ea-admin-pill">{row.statusLabel}</span>
                        {row.publishReady ? (
                          <span className="ea-admin-pill">Yayına hazır</span>
                        ) : null}
                        {row.isDuplicateCandidate ? (
                          <span className="ea-admin-pill ea-admin-pill--warn">Yinelenen?</span>
                        ) : null}
                      </td>
                      <td>
                        <span className="ea-admin-score">{row.qualityScore}</span>
                        <span className="ea-admin-pill">{row.qualityGrade}</span>
                        <span className="ea-admin-muted">{row.qualityLevelLabel}</span>
                      </td>
                      <td>{row.missingFieldCount}</td>
                      <td>{row.createdAtLabel}</td>
                      <td>
                        <a
                          className="ea-admin-review__open"
                          href={row.reviewHref}
                          aria-label={`${row.name} kurumunu incele`}
                        >
                          İncele
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selected ? (
          <aside className="ea-admin-review__panel" aria-labelledby="review-panel-heading">
            <h2 id="review-panel-heading" className="ea-admin-section-title">
              İnceleme paneli
            </h2>

            <article className="ea-admin-review__preview">
              <h3 className="ea-admin-review__name">{selected.name}</h3>
              <p className="ea-admin-muted">
                {selected.typeLabel} · {selected.cityLabel} / {selected.districtLabel} ·{" "}
                <code>{selected.slug}</code>
              </p>
              <p>
                <span className="ea-admin-pill">{selected.statusLabel}</span>
              </p>
              <dl className="ea-admin-review__facts">
                <dt>Adres</dt>
                <dd>{selected.address || "—"}</dd>
                <dt>Telefon</dt>
                <dd>{selected.phone || "—"}</dd>
                <dt>E-posta</dt>
                <dd>{selected.email || "—"}</dd>
                <dt>Web</dt>
                <dd>{selected.websiteUrl || "—"}</dd>
                <dt>Kısa açıklama</dt>
                <dd>{selected.shortDescription || "—"}</dd>
                {selected.programsSummary ? (
                  <>
                    <dt>Programlar</dt>
                    <dd>{selected.programsSummary}</dd>
                  </>
                ) : null}
              </dl>
              {selected.status === "published" ? (
                <p>
                  <a href={selected.profileHref}>Genel profili görüntüle</a>
                </p>
              ) : null}
            </article>

            <section aria-labelledby="review-panel-google">
              <h3 id="review-panel-google" className="ea-admin-subsection-title">
                Google İşletme
              </h3>
              <dl className="ea-admin-review__facts">
                <dt>Durum</dt>
                <dd>{selected.googleSyncStatusLabel || "—"}</dd>
                <dt>Eşleşme</dt>
                <dd>{selected.googleMatchMethodLabel || "—"}</dd>
                <dt>Güven</dt>
                <dd>{selected.googleConfidenceLabel || "—"}</dd>
                <dt>Google adı</dt>
                <dd>{selected.googlePlaceName || "—"}</dd>
                <dt>Google adres</dt>
                <dd>{selected.googleFormattedAddress || "—"}</dd>
                {selected.googleLastError ? (
                  <>
                    <dt>Son hata</dt>
                    <dd>{selected.googleLastError}</dd>
                  </>
                ) : null}
              </dl>
              {selected.googleMapsUrl ? (
                <p>
                  <a href={selected.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    Google Maps’te Gör
                  </a>
                </p>
              ) : null}
              {(syncGoogleAction || rematchGoogleAction) && (
                <div className="ea-admin-review__actions">
                  {syncGoogleAction ? (
                    <form action={syncGoogleAction}>
                      <input type="hidden" name="institutionId" value={selected.id} />
                      <input type="hidden" name="returnTo" value={data.returnTo} />
                      <Button type="submit" size="sm">
                        Google Bilgilerini Güncelle
                      </Button>
                    </form>
                  ) : null}
                  {rematchGoogleAction ? (
                    <form action={rematchGoogleAction}>
                      <input type="hidden" name="institutionId" value={selected.id} />
                      <input type="hidden" name="returnTo" value={data.returnTo} />
                      <Button type="submit" size="sm">
                        Google Eşleşmesini Yeniden Ara
                      </Button>
                    </form>
                  ) : null}
                </div>
              )}
            </section>

            <section aria-labelledby="review-panel-quality">
              <h3 id="review-panel-quality" className="ea-admin-subsection-title">
                Kalite skoru
              </h3>
              <p>
                <span className="ea-admin-score">{selected.qualityScore}</span>
                <span className="ea-admin-pill">{selected.qualityGrade}</span>
                <span className="ea-admin-muted">
                  {selected.qualityLevelLabel} · İç kalite skoru (Growth Score değil)
                </span>
              </p>
            </section>

            {selected.missingFields.length > 0 ? (
              <section aria-labelledby="review-panel-missing">
                <h3 id="review-panel-missing" className="ea-admin-subsection-title">
                  Eksik alanlar
                </h3>
                <ul className="ea-admin-gaps">
                  {selected.missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {selected.duplicateWarnings.length > 0 ? (
              <section aria-labelledby="review-panel-duplicates">
                <h3 id="review-panel-duplicates" className="ea-admin-subsection-title">
                  Yinelenme uyarıları
                </h3>
                <ul className="ea-admin-gaps">
                  {selected.duplicateWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="review-panel-suggestions">
              <h3 id="review-panel-suggestions" className="ea-admin-subsection-title">
                Önerilen işlemler
              </h3>
              {selected.suggestedActions.length === 0 ? (
                <p className="ea-admin-muted">Öneri yok.</p>
              ) : (
                <ul className="ea-admin-gaps">
                  {selected.suggestedActions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="review-panel-actions">
              <h3 id="review-panel-actions" className="ea-admin-subsection-title">
                Kararlar
              </h3>
              {!selected.publishReady && selected.publishBlockers.length > 0 ? (
                <p className="ea-admin-muted">
                  Yayın engelleri: {selected.publishBlockers.join("; ")}
                </p>
              ) : null}
              <div className="ea-admin-review__actions">
                <form action={reviewAction}>
                  <input type="hidden" name="institutionId" value={selected.id} />
                  <input type="hidden" name="reviewActionType" value="publish" />
                  <input type="hidden" name="returnTo" value={data.returnTo} />
                  <Button type="submit" variant="primary" size="sm" disabled={!selected.canPublish}>
                    Yayınla
                  </Button>
                </form>
                <form action={reviewAction}>
                  <input type="hidden" name="institutionId" value={selected.id} />
                  <input type="hidden" name="reviewActionType" value="return_to_draft" />
                  <input type="hidden" name="returnTo" value={data.returnTo} />
                  <Button type="submit" size="sm" disabled={!selected.canReturnToDraft}>
                    Taslağa döndür
                  </Button>
                </form>
                <form action={reviewAction}>
                  <input type="hidden" name="institutionId" value={selected.id} />
                  <input type="hidden" name="reviewActionType" value="reject" />
                  <input type="hidden" name="returnTo" value={data.returnTo} />
                  <Button type="submit" size="sm" disabled={!selected.canReject}>
                    Reddet
                  </Button>
                </form>
                <Button type="button" size="sm" disabled title="Birleştirme yakında eklenecek">
                  Birleştir (yakında)
                </Button>
              </div>
              <p className="ea-admin-muted">
                Tüm kararlar insan onayıyla verilir; otomasyon ve AI yoktur. Birleştirme bu sprintte
                yalnızca yer tutucudur.
              </p>
            </section>
          </aside>
        ) : (
          <aside
            className="ea-admin-review__panel ea-admin-review__panel--empty"
            aria-label="İnceleme paneli"
          >
            <p className="ea-admin-muted">
              İncelemek için listeden bir kurum seçin. Excel ile eklenen kurumlar doğrudan yayına
              alınır; bu kuyruk manuel düzenleme ve kalite kontrolü içindir.
            </p>
          </aside>
        )}
      </div>
    </AdminShell>
  );
}
