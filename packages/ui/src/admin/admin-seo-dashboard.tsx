"use client";

import { useState } from "react";
import { buildAdminNavItems } from "./admin-nav";
import { AdminShell } from "./admin-shell";
import { AdminSeoTaskSubmitButton } from "./admin-seo-task-submit-button";

export type AdminSeoOwnershipSummary = Readonly<{
  readonly unclaimed: number;
  readonly pending: number;
  readonly verified: number;
  readonly revoked: number;
  readonly pendingClaimRequests: number;
}>;

export type AdminSeoMatchedInstitution = Readonly<{
  readonly institutionId: string;
  readonly name: string;
  readonly slug: string;
  readonly cityLabel: string;
  readonly districtLabel: string;
  readonly ownershipLabel: string;
  readonly adminHref: string;
  readonly profileHref: string;
  readonly email: string | null;
}>;

export type AdminSeoPageRow = Readonly<{
  readonly url: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctrLabel: string;
  readonly positionLabel: string;
  readonly matchStatus: string;
  readonly institution: AdminSeoMatchedInstitution | null;
}>;

export type AdminSeoSearchedInstitutionRow = Readonly<{
  readonly institutionId: string;
  readonly name: string;
  readonly cityLabel: string;
  readonly districtLabel: string;
  readonly profileHref: string;
  readonly adminHref: string;
  readonly email: string | null;
  readonly ownershipLabel: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctrLabel: string;
  readonly positionLabel: string;
}>;

export type AdminSeoQueryRow = Readonly<{
  readonly query: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctrLabel: string;
  readonly positionLabel: string;
  readonly matchedInstitutionName: string | null;
}>;

export type AdminSeoGa4InstitutionViewRow = Readonly<{
  readonly institutionId: string;
  readonly eventCount: number;
  readonly matchStatus: string;
  readonly institutionName: string | null;
  readonly ownershipLabel: string;
  readonly adminHref: string | null;
  readonly profileHref: string | null;
}>;

export type AdminSeoActionTaskView = Readonly<{
  readonly status: "pending" | "in_progress" | "done";
  readonly statusLabel: string;
  readonly assigneeUid: string | null;
  readonly note: string | null;
  readonly updatedAtLabel: string | null;
  readonly isPersisted: boolean;
}>;

export type AdminSeoActionItem = Readonly<{
  readonly id: string;
  readonly fingerprint: string;
  readonly sourceKey: string;
  readonly kind: string;
  readonly priority: "high" | "medium" | "low";
  readonly priorityLabel: string;
  readonly title: string;
  readonly recommendation: string;
  readonly targetLabel: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctrLabel: string;
  readonly positionLabel: string;
  readonly institutionName: string | null;
  readonly profileHref: string | null;
  readonly task: AdminSeoActionTaskView;
}>;

export type AdminSeoOrphanedActionItem = Readonly<{
  readonly fingerprint: string;
  readonly sourceKey: string;
  readonly title: string;
  readonly targetLabel: string;
  readonly task: AdminSeoActionTaskView;
}>;

export type AdminSeoDashboardViewData = Readonly<{
  readonly title: string;
  readonly subtitle: string;
  readonly hasSnapshot: boolean;
  readonly updatedAtLabel: string | null;
  readonly dateRangeLabel: string | null;
  readonly summary: Readonly<{
    readonly clicksLabel: string;
    readonly impressionsLabel: string;
    readonly ctrLabel: string;
    readonly positionLabel: string;
  }> | null;
  readonly topSearchedInstitutions: readonly AdminSeoSearchedInstitutionRow[];
  readonly siteSearch: Readonly<{
    readonly available: boolean;
    readonly message: string;
  }>;
  readonly topInstitutionPages: readonly AdminSeoPageRow[];
  readonly topQueries: readonly AdminSeoQueryRow[];
  readonly lowCtrPages: readonly AdminSeoPageRow[];
  readonly midPositionQueries: readonly AdminSeoQueryRow[];
  readonly unmatchedPages: readonly AdminSeoPageRow[];
  readonly actionPlan: Readonly<{
    readonly activeActions: readonly AdminSeoActionItem[];
    readonly completedActions: readonly AdminSeoActionItem[];
    readonly prioritizedActions: readonly AdminSeoActionItem[];
    readonly ctrPageOpportunities: readonly AdminSeoActionItem[];
    readonly rankingPageOpportunities: readonly AdminSeoActionItem[];
    readonly queryOpportunities: readonly AdminSeoActionItem[];
    readonly unmatchedUrlOpportunities: readonly AdminSeoActionItem[];
    readonly orphanedTasks: readonly AdminSeoOrphanedActionItem[];
  }>;
  readonly ownership: AdminSeoOwnershipSummary;
  readonly opportunityThresholdsLabel: string;
  readonly ga4: Readonly<{
    readonly hasSnapshot: boolean;
    readonly updatedAtLabel: string | null;
    readonly dateRangeLabel: string | null;
    readonly totalInstitutionViewsLabel: string | null;
    readonly topInstitutionViews: readonly AdminSeoGa4InstitutionViewRow[];
    readonly unmatchedCount: number;
    readonly searchTermInstrumented: boolean;
    readonly eventsInstrumented: readonly string[];
    readonly analyticsConsoleHref: string;
    readonly searchConsoleHref: string;
    readonly emptyStateMessage: string;
    readonly snapshotCommandHint: string;
  }>;
  readonly emptyStateMessage: string;
  readonly snapshotCommandHint: string;
}>;

export type AdminSeoDashboardProps = {
  data: AdminSeoDashboardViewData;
  taskAction?: (formData: FormData) => Promise<void>;
  currentAdminUid?: string;
  statusMessage?: string;
};

function activeOnly(rows: readonly AdminSeoActionItem[]): readonly AdminSeoActionItem[] {
  return rows.filter((row) => row.task.status !== "done");
}

function formatInt(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}

const SEO_PAGE_SIZES = [10, 20, 50] as const;
type SeoPageSize = (typeof SEO_PAGE_SIZES)[number];
const INSTITUTION_MAIL_SUBJECT = "EduAtlas - Kurum İş Birliği";

function useSeoPagination<T>(rows: readonly T[], resetKey: string) {
  const [pageSize, setPageSize] = useState<SeoPageSize>(10);
  const [page, setPage] = useState(1);
  const [seenKey, setSeenKey] = useState(resetKey);
  const resetPending = seenKey !== resetKey;
  if (resetPending) {
    setSeenKey(resetKey);
    setPage(1);
  }
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = total === 0 || resetPending ? 1 : Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    pageRows: rows.slice(start, start + pageSize),
    pageSize,
    currentPage,
    total,
    totalPages,
    setPageSize(next: SeoPageSize) {
      setPageSize(next);
      setPage(1);
    },
    setPage(next: number) {
      setPage(Math.min(Math.max(1, next), totalPages));
    },
  };
}

function SeoPager({
  total,
  currentPage,
  totalPages,
  pageSize,
  onPageSize,
  onPage,
}: {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: SeoPageSize;
  onPageSize: (next: SeoPageSize) => void;
  onPage: (next: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="ea-admin-seo-pager">
      <p className="ea-admin-seo-pager__status">
        Sayfa {currentPage} / {totalPages} · {formatInt(total)} kayıt
      </p>
      <label className="ea-admin-seo-pager__size">
        Sayfa başına
        <select
          value={pageSize}
          onChange={(event) => onPageSize(Number(event.target.value) as SeoPageSize)}
        >
          {SEO_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <div className="ea-admin-seo-pager__nav">
        <button type="button" onClick={() => onPage(currentPage - 1)} disabled={currentPage <= 1}>
          Önceki
        </button>
        <button
          type="button"
          onClick={() => onPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}

function institutionPageUrl(profileHref: string): string {
  if (profileHref.startsWith("http://") || profileHref.startsWith("https://")) {
    return profileHref;
  }
  const path = profileHref.startsWith("/") ? profileHref : `/${profileHref}`;
  return `https://eduatlas.com.tr${path}`;
}

function institutionOutreachMailto(input: {
  email?: string | null;
  name: string;
  profileHref: string;
}): string {
  const to = input.email?.trim() ?? "";
  const body = `Kurum: ${input.name}\nEduAtlas sayfası: ${institutionPageUrl(input.profileHref)}`;
  const query = new URLSearchParams({
    subject: INSTITUTION_MAIL_SUBJECT,
    body,
  });
  return `mailto:${encodeURIComponent(to)}?${query.toString().replaceAll("+", "%20")}`;
}

function InstitutionMailLink({
  email,
  name,
  profileHref,
}: {
  email?: string | null;
  name: string;
  profileHref: string;
}) {
  return <a href={institutionOutreachMailto({ email, name, profileHref })}>E-posta Gönder</a>;
}

function SearchedInstitutionsSection({ data }: { data: AdminSeoDashboardViewData }) {
  const paging = useSeoPagination(
    data.topSearchedInstitutions,
    data.topSearchedInstitutions.map((row) => row.institutionId).join("\n"),
  );
  return (
    <section aria-labelledby="admin-seo-searched-heading">
      <h2 id="admin-seo-searched-heading" className="ea-admin-section-title">
        En Çok Aranan Kurumlar
      </h2>
      <p className="ea-admin-muted">
        Google Search Console snapshot’ı
        {data.dateRangeLabel ? ` (${data.dateRangeLabel})` : ""}. Kayıt, en yüksek trafikli
        sayfaları tutar; eşleşen kurumlar tıklama, sonra gösterim sırasındadır. Kurum kimliği
        sonraki e-posta kampanyası için listede durur. Gönderim bu ekranda yapılmaz.
      </p>
      {!data.hasSnapshot ? (
        <p className="ea-admin-muted">{data.emptyStateMessage}</p>
      ) : (
        <>
        <div className="ea-admin-table-wrap">
          <table className="ea-admin-table">
            <thead>
              <tr>
                <th>Kurum</th>
                <th>İl / ilçe</th>
                <th>Tıklama</th>
                <th>Gösterim</th>
                <th>CTR</th>
                <th>Ortalama konum</th>
                <th>Sahiplenme</th>
                <th>E-posta</th>
              </tr>
            </thead>
            <tbody>
              {paging.total === 0 ? (
                <tr>
                  <td className="ea-admin-table__empty" colSpan={8}>
                    Eşleşen kurum yok.
                  </td>
                </tr>
              ) : (
                paging.pageRows.map((row) => (
                  <tr key={row.institutionId}>
                    <td className="ea-admin-table__name">
                      <a href={row.profileHref}>{row.name}</a>
                    </td>
                    <td>
                      {row.cityLabel} / {row.districtLabel}
                    </td>
                    <td>{formatInt(row.clicks)}</td>
                    <td>{formatInt(row.impressions)}</td>
                    <td>{row.ctrLabel}</td>
                    <td>{row.positionLabel}</td>
                    <td>{row.ownershipLabel}</td>
                    <td>
                      <InstitutionMailLink
                        email={row.email}
                        name={row.name}
                        profileHref={row.profileHref}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          <SeoPager
            total={paging.total}
            currentPage={paging.currentPage}
            totalPages={paging.totalPages}
            pageSize={paging.pageSize}
            onPageSize={paging.setPageSize}
            onPage={paging.setPage}
          />
        </>
      )}
      <h3 className="ea-admin-subsection-title">İç site araması</h3>
      <p className="ea-admin-muted">{data.siteSearch.message}</p>
    </section>
  );
}

/**
 * Admin SEO + ownership dashboard — presentation only (snapshot-backed).
 */
export function AdminSeoDashboard({
  data,
  taskAction,
  currentAdminUid,
  statusMessage,
}: AdminSeoDashboardProps) {
  return (
    <AdminShell activeNavId="seo" navItems={buildAdminNavItems()}>
      <header className="ea-admin-page-header">
        <div>
          <h1 className="ea-admin-page-header__title">{data.title}</h1>
          <p className="ea-admin-page-header__subtitle">{data.subtitle}</p>
        </div>
        <p className="ea-admin-page-header__meta">
          {data.updatedAtLabel
            ? `Snapshot: ${data.updatedAtLabel}`
            : "Snapshot henüz yok"}
        </p>
      </header>

      {statusMessage ? (
        <p className="ea-admin-notice" role="status">
          {statusMessage}
        </p>
      ) : null}

      <SearchedInstitutionsSection data={data} />

      {!data.hasSnapshot ? (
        <section className="ea-admin-stat" aria-labelledby="admin-seo-empty">
          <h2 id="admin-seo-empty" className="ea-admin-section-title">
            GSC snapshot bulunamadı
          </h2>
          <p className="ea-admin-muted">{data.emptyStateMessage}</p>
          <p className="ea-admin-muted">
            <code>{data.snapshotCommandHint}</code>
          </p>
        </section>
      ) : (
        <>
          <section aria-labelledby="admin-seo-summary-heading">
            <h2 id="admin-seo-summary-heading" className="ea-admin-section-title">
              SEO özeti
            </h2>
            {data.dateRangeLabel ? (
              <p className="ea-admin-muted">Dönem: {data.dateRangeLabel}</p>
            ) : null}
            <ul className="ea-admin-stats__grid">
              <li>
                <article className="ea-admin-stat">
                  <h3>Tıklamalar</h3>
                  <p className="ea-admin-stat__value">{data.summary?.clicksLabel}</p>
                </article>
              </li>
              <li>
                <article className="ea-admin-stat">
                  <h3>Gösterimler</h3>
                  <p className="ea-admin-stat__value">{data.summary?.impressionsLabel}</p>
                </article>
              </li>
              <li>
                <article className="ea-admin-stat">
                  <h3>CTR</h3>
                  <p className="ea-admin-stat__value">{data.summary?.ctrLabel}</p>
                </article>
              </li>
              <li>
                <article className="ea-admin-stat">
                  <h3>Ortalama konum</h3>
                  <p className="ea-admin-stat__value">{data.summary?.positionLabel}</p>
                </article>
              </li>
            </ul>
            <p className="ea-admin-muted">
              Önceki dönem karşılaştırması bu sürümde yok (snapshot tek dönem).
            </p>
          </section>

          <section aria-labelledby="admin-seo-pages-heading">
            <h2 id="admin-seo-pages-heading" className="ea-admin-section-title">
              Kurum sayfası URL’leri
            </h2>
            <p className="ea-admin-muted">
              Aynı Search Console snapshot’ının sayfa satırları. Kurum sıralaması yukarıdaki listededir.
            </p>
            <InstitutionPagesTable rows={data.topInstitutionPages} />
          </section>

          <section aria-labelledby="admin-seo-queries-heading">
            <h2 id="admin-seo-queries-heading" className="ea-admin-section-title">
              Google arama sorguları
            </h2>
            <QueryTable rows={data.topQueries} />
          </section>

          <section aria-labelledby="admin-seo-actions-heading">
            <h2 id="admin-seo-actions-heading" className="ea-admin-section-title">
              Öncelikli aksiyonlar (aktif)
            </h2>
            <p className="ea-admin-muted">{data.opportunityThresholdsLabel}</p>
            <ActionTable
              rows={data.actionPlan.activeActions}
              empty="Aktif öncelikli aksiyon yok."
              showPriority
              showTaskControls
              taskAction={taskAction}
              currentAdminUid={currentAdminUid}
            />
          </section>

          <section aria-labelledby="admin-seo-completed-heading">
            <h2 id="admin-seo-completed-heading" className="ea-admin-section-title">
              Tamamlanan görevler
            </h2>
            <ActionTable
              rows={data.actionPlan.completedActions}
              empty="Tamamlanan görev yok."
              showPriority
              showTaskControls
              taskAction={taskAction}
              currentAdminUid={currentAdminUid}
            />
          </section>

          <section aria-labelledby="admin-seo-opps-heading">
            <h2 id="admin-seo-opps-heading" className="ea-admin-section-title">
              SEO fırsatları
            </h2>

            <h3 className="ea-admin-subsection-title">CTR fırsatları</h3>
            <p className="ea-admin-muted">
              Yüksek gösterim, düşük CTR — birleşik CTR+sıralama kayıtları burada tek
              aksiyon olarak listelenir (önce title/meta, sonra içerik).
            </p>
            <ActionTable
              rows={activeOnly(data.actionPlan.ctrPageOpportunities)}
              empty="CTR fırsatı yok."
            />

            <h3 className="ea-admin-subsection-title">Sıralama fırsatları (sayfa, konum 4–20)</h3>
            <p className="ea-admin-muted">
              Yalnızca CTR eşiğini aşmayan sayfalar — içerik ve dahili link adayları.
            </p>
            <ActionTable
              rows={activeOnly(data.actionPlan.rankingPageOpportunities)}
              empty="Sıralama fırsatı yok."
            />

            <h3 className="ea-admin-subsection-title">Arama sorgusu fırsatları</h3>
            <p className="ea-admin-muted">
              Yüksek gösterimli sorgular — yeni içerik veya landing page adayları.
            </p>
            <ActionTable
              rows={activeOnly(data.actionPlan.queryOpportunities)}
              empty="Sorgu fırsatı yok."
            />

            <h3 className="ea-admin-subsection-title">Konum 4–20 sorgular (özet)</h3>
            <OpportunityQueries
              rows={data.midPositionQueries}
              empty="Eşik altı sorgu yok."
            />

            <h3 className="ea-admin-subsection-title">Eşleşmeyen kurum URL’leri</h3>
            <ActionTable
              rows={activeOnly(data.actionPlan.unmatchedUrlOpportunities)}
              empty="Eşleşmeyen kurum URL’si yok."
            />
          </section>
        </>
      )}

      <section aria-labelledby="admin-seo-orphaned-heading">
        <h2 id="admin-seo-orphaned-heading" className="ea-admin-section-title">
          Güncel olmayan görevler
        </h2>
        <p className="ea-admin-muted">
          Snapshot’ta artık bulunmayan kayıtlı görevler. Silinmez; aktif aksiyonlarla
          karışmaz.
        </p>
        <OrphanTaskTable
          rows={data.actionPlan.orphanedTasks}
          empty="Güncel olmayan görev yok."
          taskAction={taskAction}
          currentAdminUid={currentAdminUid}
        />
      </section>

      <section aria-labelledby="admin-seo-ownership-heading">
        <h2 id="admin-seo-ownership-heading" className="ea-admin-section-title">
          Sahiplik özeti
        </h2>
        <ul className="ea-admin-stats__grid">
          <li>
            <article className="ea-admin-stat">
              <h3>Sahiplenilmiş</h3>
              <p className="ea-admin-stat__value">{formatInt(data.ownership.verified)}</p>
            </article>
          </li>
          <li>
            <article className="ea-admin-stat">
              <h3>Sahiplenilmemiş</h3>
              <p className="ea-admin-stat__value">{formatInt(data.ownership.unclaimed)}</p>
            </article>
          </li>
          <li>
            <article className="ea-admin-stat">
              <h3>Başvuru bekliyor (kurum)</h3>
              <p className="ea-admin-stat__value">{formatInt(data.ownership.pending)}</p>
            </article>
          </li>
          <li>
            <article className="ea-admin-stat">
              <h3>Revoked</h3>
              <p className="ea-admin-stat__value">{formatInt(data.ownership.revoked)}</p>
            </article>
          </li>
          <li>
            <article className="ea-admin-stat">
              <h3>Bekleyen claim_requests</h3>
              <p className="ea-admin-stat__value">
                {formatInt(data.ownership.pendingClaimRequests)}
              </p>
              <p className="ea-admin-muted">Son 100 pending kayıt (bounded)</p>
            </article>
          </li>
        </ul>
        <p>
          <a href="/admin/acquisition?queue=claimed">Kurum edinimi / sahiplenme kuyruğu</a>
        </p>
      </section>

      <section aria-labelledby="admin-seo-ga4-heading">
        <h2 id="admin-seo-ga4-heading" className="ea-admin-section-title">
          Google Analytics (GA4) — kurum görüntülenmeleri
        </h2>
        {!data.ga4.hasSnapshot ? (
          <>
            <p className="ea-admin-muted">{data.ga4.emptyStateMessage}</p>
            <p className="ea-admin-muted">
              <code>{data.ga4.snapshotCommandHint}</code>
            </p>
          </>
        ) : (
          <>
            <p className="ea-admin-muted">
              {data.ga4.dateRangeLabel ? `Dönem: ${data.ga4.dateRangeLabel}` : null}
              {data.ga4.updatedAtLabel
                ? ` · Snapshot: ${data.ga4.updatedAtLabel}`
                : null}
            </p>
            <ul className="ea-admin-stats__grid">
              <li>
                <article className="ea-admin-stat">
                  <h3>Toplam institution_view</h3>
                  <p className="ea-admin-stat__value">
                    {data.ga4.totalInstitutionViewsLabel}
                  </p>
                </article>
              </li>
              <li>
                <article className="ea-admin-stat">
                  <h3>Eşleşmeyen kurum ID</h3>
                  <p className="ea-admin-stat__value">
                    {formatInt(data.ga4.unmatchedCount)}
                  </p>
                </article>
              </li>
            </ul>

            <h3 className="ea-admin-subsection-title">En çok görüntülenen kurumlar</h3>
            <Ga4ViewsTable rows={data.ga4.topInstitutionViews} />
          </>
        )}

        <p className="ea-admin-muted">
          {data.ga4.searchTermInstrumented
            ? "Arama ölçümü: `search` event’ine `search_term` parametresi eklendi (trim + 100 karakter sınırı + PII filtresi). Geçmiş GA4 verilerini geriye dönük doldurmaz."
            : "Arama ölçümü henüz aktif değil."}
        </p>
        <p className="ea-admin-muted">
          Enstrumente event’ler: {data.ga4.eventsInstrumented.join(", ")}
        </p>
        <p>
          <a href={data.ga4.analyticsConsoleHref} rel="noreferrer" target="_blank">
            GA4 konsolu
          </a>
          {" · "}
          <a href={data.ga4.searchConsoleHref} rel="noreferrer" target="_blank">
            Search Console
          </a>
        </p>
      </section>
    </AdminShell>
  );
}

function priorityClass(priority: AdminSeoActionItem["priority"]): string {
  switch (priority) {
    case "high":
      return "ea-admin-seo-priority ea-admin-seo-priority--high";
    case "medium":
      return "ea-admin-seo-priority ea-admin-seo-priority--medium";
    default:
      return "ea-admin-seo-priority ea-admin-seo-priority--low";
  }
}

function InstitutionPagesTable({ rows }: { rows: readonly AdminSeoPageRow[] }) {
  const paging = useSeoPagination(rows, rows.map((row) => row.url).join("\n"));
  return (
    <>
    <div className="ea-admin-table-wrap">
      <table className="ea-admin-table">
        <thead>
          <tr>
            <th>Kurum</th>
            <th>İl / ilçe</th>
            <th>Tıklama</th>
            <th>Gösterim</th>
            <th>CTR</th>
            <th>Konum</th>
            <th>Sahiplik</th>
            <th>E-posta</th>
          </tr>
        </thead>
        <tbody>
          {paging.total === 0 ? (
            <tr>
              <td className="ea-admin-table__empty" colSpan={8}>
                Eşleşen kurum sayfası yok.
              </td>
            </tr>
          ) : (
            paging.pageRows.map((row) => (
              <tr key={row.url}>
                <td className="ea-admin-table__name">
                  {row.institution ? (
                    <a href={row.institution.profileHref}>{row.institution.name}</a>
                  ) : (
                    row.url
                  )}
                </td>
                <td>
                  {row.institution
                    ? `${row.institution.cityLabel} / ${row.institution.districtLabel}`
                    : "—"}
                </td>
                <td>{formatInt(row.clicks)}</td>
                <td>{formatInt(row.impressions)}</td>
                <td>{row.ctrLabel}</td>
                <td>{row.positionLabel}</td>
                <td>{row.institution?.ownershipLabel ?? "—"}</td>
                <td>
                  {row.institution ? (
                    <InstitutionMailLink
                      email={row.institution.email}
                      name={row.institution.name}
                      profileHref={row.institution.profileHref}
                    />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
      <SeoPager
        total={paging.total}
        currentPage={paging.currentPage}
        totalPages={paging.totalPages}
        pageSize={paging.pageSize}
        onPageSize={paging.setPageSize}
        onPage={paging.setPage}
      />
    </>
  );
}

function QueryTable({ rows }: { rows: readonly AdminSeoQueryRow[] }) {
  const paging = useSeoPagination(rows, rows.map((row) => row.query).join("\n"));
  return (
    <>
    <div className="ea-admin-table-wrap">
      <table className="ea-admin-table">
        <thead>
          <tr>
            <th>Sorgu</th>
            <th>Tıklama</th>
            <th>Gösterim</th>
            <th>CTR</th>
            <th>Konum</th>
            <th>Eşleşen kurum</th>
          </tr>
        </thead>
        <tbody>
          {paging.total === 0 ? (
            <tr>
              <td className="ea-admin-table__empty" colSpan={6}>
                Sorgu satırı yok.
              </td>
            </tr>
          ) : (
            paging.pageRows.map((row) => (
              <tr key={row.query}>
                <td>{row.query}</td>
                <td>{formatInt(row.clicks)}</td>
                <td>{formatInt(row.impressions)}</td>
                <td>{row.ctrLabel}</td>
                <td>{row.positionLabel}</td>
                <td>{row.matchedInstitutionName ?? "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
      <SeoPager
        total={paging.total}
        currentPage={paging.currentPage}
        totalPages={paging.totalPages}
        pageSize={paging.pageSize}
        onPageSize={paging.setPageSize}
        onPage={paging.setPage}
      />
    </>
  );
}

function Ga4ViewsTable({ rows }: { rows: readonly AdminSeoGa4InstitutionViewRow[] }) {
  const paging = useSeoPagination(rows, rows.map((row) => row.institutionId).join("\n"));
  return (
    <>
    <div className="ea-admin-table-wrap">
      <table className="ea-admin-table">
        <thead>
          <tr>
            <th>Kurum</th>
            <th>Görüntülenme</th>
            <th>Sahiplik</th>
            <th>Admin</th>
          </tr>
        </thead>
        <tbody>
          {paging.total === 0 ? (
            <tr>
              <td className="ea-admin-table__empty" colSpan={4}>
                Görüntülenme satırı yok.
              </td>
            </tr>
          ) : (
            paging.pageRows.map((row) => (
              <tr key={row.institutionId}>
                <td className="ea-admin-table__name">
                  {row.profileHref && row.institutionName ? (
                    <a href={row.profileHref}>{row.institutionName}</a>
                  ) : (
                    <>
                      Eşleşmeyen ID <code>{row.institutionId}</code>
                    </>
                  )}
                </td>
                <td>{formatInt(row.eventCount)}</td>
                <td>{row.ownershipLabel}</td>
                <td>
                  {row.adminHref ? <a href={row.adminHref}>Kurum edinimi</a> : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
      <SeoPager
        total={paging.total}
        currentPage={paging.currentPage}
        totalPages={paging.totalPages}
        pageSize={paging.pageSize}
        onPageSize={paging.setPageSize}
        onPage={paging.setPage}
      />
    </>
  );
}

function OrphanTaskTable({
  rows,
  empty,
  taskAction,
  currentAdminUid,
}: {
  rows: readonly AdminSeoOrphanedActionItem[];
  empty: string;
  taskAction?: (formData: FormData) => Promise<void>;
  currentAdminUid?: string;
}) {
  const paging = useSeoPagination(rows, rows.map((row) => row.fingerprint).join("\n"));
  if (paging.total === 0) {
    return <p className="ea-admin-muted">{empty}</p>;
  }
  return (
    <>
    <div className="ea-admin-table-wrap">
      <table className="ea-admin-table">
        <thead>
          <tr>
            <th>Başlık</th>
            <th>Hedef / URL</th>
            <th>Kaynak</th>
            <th>Görev</th>
          </tr>
        </thead>
        <tbody>
          {paging.pageRows.map((row) => (
            <tr key={row.fingerprint}>
              <td>{row.title}</td>
              <td className="ea-admin-table__name">{row.targetLabel}</td>
              <td>
                <code>{row.sourceKey}</code>
              </td>
              <td>
                {taskAction ? (
                  <form action={taskAction} className="ea-admin-seo-task-form">
                    <input type="hidden" name="fingerprint" value={row.fingerprint} />
                    <input type="hidden" name="sourceKey" value={row.sourceKey} />
                    <label className="ea-admin-seo-task-form__label">
                      Durum
                      <select name="status" defaultValue={row.task.status}>
                        <option value="pending">Bekliyor</option>
                        <option value="in_progress">Devam ediyor</option>
                        <option value="done">Tamamlandı</option>
                      </select>
                    </label>
                    <label className="ea-admin-seo-task-form__label">
                      Sorumlu UID
                      <input
                        name="assigneeUid"
                        type="text"
                        defaultValue={row.task.assigneeUid ?? ""}
                        placeholder="admin uid"
                      />
                    </label>
                    {currentAdminUid ? (
                      <p className="ea-admin-muted">Sizin UID: {currentAdminUid}</p>
                    ) : null}
                    <label className="ea-admin-seo-task-form__label">
                      Not
                      <input
                        name="note"
                        type="text"
                        defaultValue={row.task.note ?? ""}
                        maxLength={500}
                      />
                    </label>
                    <AdminSeoTaskSubmitButton />
                    <p className="ea-admin-muted">
                      {row.task.statusLabel}
                      {row.task.assigneeUid ? ` · ${row.task.assigneeUid}` : ""}
                      {row.task.updatedAtLabel ? ` · ${row.task.updatedAtLabel}` : ""}
                    </p>
                  </form>
                ) : (
                  <p className="ea-admin-muted">
                    {row.task.statusLabel}
                    {row.task.assigneeUid ? ` · ${row.task.assigneeUid}` : ""}
                    {row.task.note ? ` · ${row.task.note}` : ""}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      <SeoPager
        total={paging.total}
        currentPage={paging.currentPage}
        totalPages={paging.totalPages}
        pageSize={paging.pageSize}
        onPageSize={paging.setPageSize}
        onPage={paging.setPage}
      />
    </>
  );
}

function ActionTable({
  rows,
  empty,
  showPriority = false,
  showTaskControls = false,
  taskAction,
  currentAdminUid,
}: {
  rows: readonly AdminSeoActionItem[];
  empty: string;
  showPriority?: boolean;
  showTaskControls?: boolean;
  taskAction?: (formData: FormData) => Promise<void>;
  currentAdminUid?: string;
}) {
  const paging = useSeoPagination(rows, rows.map((row) => row.id).join("\n"));
  if (paging.total === 0) {
    return <p className="ea-admin-muted">{empty}</p>;
  }
  return (
    <>
    <div className="ea-admin-table-wrap">
      <table className="ea-admin-table">
        <thead>
          <tr>
            {showPriority ? <th>Öncelik</th> : null}
            <th>Fırsat</th>
            <th>Hedef</th>
            <th>Tıklama</th>
            <th>Gösterim</th>
            <th>CTR</th>
            <th>Konum</th>
            <th>Öneri</th>
            {showTaskControls ? <th>Görev</th> : null}
          </tr>
        </thead>
        <tbody>
          {paging.pageRows.map((row) => (
            <tr key={row.id}>
              {showPriority ? (
                <td>
                  <span className={priorityClass(row.priority)}>{row.priorityLabel}</span>
                </td>
              ) : null}
              <td>{row.title}</td>
              <td className="ea-admin-table__name">
                {row.profileHref ? (
                  <a href={row.profileHref}>{row.targetLabel}</a>
                ) : (
                  row.targetLabel
                )}
              </td>
              <td>{formatInt(row.clicks)}</td>
              <td>{formatInt(row.impressions)}</td>
              <td>{row.ctrLabel}</td>
              <td>{row.positionLabel}</td>
              <td>{row.recommendation}</td>
              {showTaskControls ? (
                <td>
                  {taskAction ? (
                    <form action={taskAction} className="ea-admin-seo-task-form">
                      <input type="hidden" name="fingerprint" value={row.fingerprint} />
                      <input type="hidden" name="sourceKey" value={row.sourceKey} />
                      <label className="ea-admin-seo-task-form__label">
                        Durum
                        <select name="status" defaultValue={row.task.status}>
                          <option value="pending">Bekliyor</option>
                          <option value="in_progress">Devam ediyor</option>
                          <option value="done">Tamamlandı</option>
                        </select>
                      </label>
                      <label className="ea-admin-seo-task-form__label">
                        Sorumlu UID
                        <input
                          name="assigneeUid"
                          type="text"
                          defaultValue={row.task.assigneeUid ?? ""}
                          placeholder="admin uid"
                        />
                      </label>
                      {currentAdminUid ? (
                        <p className="ea-admin-muted">Sizin UID: {currentAdminUid}</p>
                      ) : null}
                      <label className="ea-admin-seo-task-form__label">
                        Not
                        <input
                          name="note"
                          type="text"
                          defaultValue={row.task.note ?? ""}
                          maxLength={500}
                        />
                      </label>
                      <AdminSeoTaskSubmitButton />
                      <p className="ea-admin-muted">
                        {row.task.statusLabel}
                        {row.task.assigneeUid ? ` · ${row.task.assigneeUid}` : ""}
                        {row.task.updatedAtLabel ? ` · ${row.task.updatedAtLabel}` : ""}
                      </p>
                    </form>
                  ) : (
                    <p className="ea-admin-muted">
                      {row.task.statusLabel}
                      {row.task.assigneeUid ? ` · ${row.task.assigneeUid}` : ""}
                    </p>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      <SeoPager
        total={paging.total}
        currentPage={paging.currentPage}
        totalPages={paging.totalPages}
        pageSize={paging.pageSize}
        onPageSize={paging.setPageSize}
        onPage={paging.setPage}
      />
    </>
  );
}

function OpportunityQueries({
  rows,
  empty,
}: {
  rows: readonly AdminSeoQueryRow[];
  empty: string;
}) {
  const paging = useSeoPagination(rows, rows.map((row) => row.query).join("\n"));
  if (paging.total === 0) {
    return <p className="ea-admin-muted">{empty}</p>;
  }
  return (
    <>
    <div className="ea-admin-table-wrap">
      <table className="ea-admin-table">
        <thead>
          <tr>
            <th>Sorgu</th>
            <th>Tıklama</th>
            <th>Gösterim</th>
            <th>CTR</th>
            <th>Konum</th>
          </tr>
        </thead>
        <tbody>
          {paging.pageRows.map((row) => (
            <tr key={row.query}>
              <td>{row.query}</td>
              <td>{formatInt(row.clicks)}</td>
              <td>{formatInt(row.impressions)}</td>
              <td>{row.ctrLabel}</td>
              <td>{row.positionLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      <SeoPager
        total={paging.total}
        currentPage={paging.currentPage}
        totalPages={paging.totalPages}
        pageSize={paging.pageSize}
        onPageSize={paging.setPageSize}
        onPage={paging.setPage}
      />
    </>
  );
}
