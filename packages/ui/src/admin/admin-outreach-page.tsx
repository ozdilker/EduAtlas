import { Button } from "../components/button";
import { AdminShell } from "./admin-shell";
import { buildAdminNavItems } from "./admin-nav";

export type AdminOutreachCampaignOption = Readonly<{
  id: string;
  name: string;
  status: string;
}>;

export type AdminOutreachSelectOption = Readonly<{
  id: string;
  name: string;
}>;

export type AdminOutreachFormValues = Readonly<{
  id: string;
  name: string;
  description: string;
  templateId: string;
  segmentId: string;
  subjectOverride: string;
  preheader: string;
}>;

export type AdminOutreachPageProps = {
  campaigns: readonly AdminOutreachCampaignOption[];
  templates: readonly AdminOutreachSelectOption[];
  segments: readonly AdminOutreachSelectOption[];
  form: AdminOutreachFormValues;
  previewHtml: string;
  previewSubject: string;
  sampleInstitutionName: string;
  defaultTestEmail?: string;
  notice?: string;
  error?: string;
  saveAction: (formData: FormData) => Promise<void>;
  testSendAction: (formData: FormData) => Promise<void>;
};

/**
 * Admin Campaign Builder — preview + test send only (no bulk start).
 */
export function AdminOutreachPage({
  campaigns,
  templates,
  segments,
  form,
  previewHtml,
  previewSubject,
  sampleInstitutionName,
  defaultTestEmail = "",
  notice,
  error,
  saveAction,
  testSendAction,
}: AdminOutreachPageProps) {
  const isExisting = Boolean(form.id);

  return (
    <AdminShell activeNavId="outreach" navItems={buildAdminNavItems()}>
      <header className="ea-admin-page-header">
        <h1 className="ea-admin-page-header__title">Kampanyalar</h1>
        <p className="ea-admin-page-header__subtitle">
          İlk e-posta kampanyasını oluşturun, EMDS önizlemesini kontrol edin ve kendinize test
          gönderin. Toplu gönderim bu aşamada kapalıdır.
        </p>
      </header>

      {notice ? (
        <p className="ea-admin-visuals__status" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="ea-admin-visuals__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="ea-admin-outreach">
        <aside className="ea-admin-outreach__list" aria-label="Kampanya listesi">
          <h2 className="ea-admin-section-title">Kayıtlı kampanyalar</h2>
          {campaigns.length === 0 ? (
            <p className="ea-admin-muted">Henüz kampanya yok. Aşağıdan oluşturun.</p>
          ) : (
            <ul className="ea-admin-outreach__campaigns">
              {campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <a
                    className={
                      campaign.id === form.id
                        ? "ea-admin-outreach__link ea-admin-outreach__link--active"
                        : "ea-admin-outreach__link"
                    }
                    href={`/admin/outreach?id=${encodeURIComponent(campaign.id)}`}
                  >
                    <span>{campaign.name}</span>
                    <span className="ea-admin-muted">{campaign.status}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="ea-admin-outreach__new">
            <a className="ea-admin-outreach__link" href="/admin/outreach">
              + Yeni kampanya
            </a>
          </p>
        </aside>

        <section className="ea-admin-outreach__builder" aria-label="Kampanya düzenleyici">
          <h2 className="ea-admin-section-title">
            {isExisting ? "Kampanyayı düzenle" : "Yeni kampanya"}
          </h2>
          <form action={saveAction} className="ea-admin-outreach__form">
            {isExisting ? <input type="hidden" name="campaignId" value={form.id} /> : null}
            <div className="ea-admin-field">
              <label htmlFor="outreach-name">Ad</label>
              <input
                id="outreach-name"
                className="ea-admin-select"
                name="name"
                required
                defaultValue={form.name}
                placeholder="İstanbul claim daveti"
              />
            </div>
            <div className="ea-admin-field">
              <label htmlFor="outreach-description">Açıklama</label>
              <textarea
                id="outreach-description"
                className="ea-admin-select"
                name="description"
                rows={2}
                defaultValue={form.description}
              />
            </div>
            <div className="ea-admin-field">
              <label htmlFor="outreach-template">Şablon</label>
              <select
                id="outreach-template"
                className="ea-admin-select"
                name="templateId"
                defaultValue={form.templateId}
                required
              >
                {templates.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="ea-admin-field">
              <label htmlFor="outreach-segment">Segment</label>
              <select
                id="outreach-segment"
                className="ea-admin-select"
                name="segmentId"
                defaultValue={form.segmentId}
                required
              >
                {segments.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="ea-admin-field">
              <label htmlFor="outreach-subject">Konu</label>
              <input
                id="outreach-subject"
                className="ea-admin-select"
                name="subjectOverride"
                required
                defaultValue={form.subjectOverride}
              />
            </div>
            <div className="ea-admin-field">
              <label htmlFor="outreach-preheader">Preheader</label>
              <input
                id="outreach-preheader"
                className="ea-admin-select"
                name="preheader"
                required
                defaultValue={form.preheader}
              />
            </div>
            <p className="ea-admin-muted">
              Kişiselleştirme: <code>{"{{institutionName}}"}</code>
            </p>
            <Button type="submit" variant="primary" size="sm">
              {isExisting ? "Kaydet" : "Oluştur"}
            </Button>
          </form>

          {isExisting ? (
            <form action={testSendAction} className="ea-admin-outreach__test">
              <h3 className="ea-admin-subsection-title">Test gönderimi</h3>
              <input type="hidden" name="campaignId" value={form.id} />
              <input type="hidden" name="institutionName" value={sampleInstitutionName} />
              <div className="ea-admin-field">
                <label htmlFor="outreach-test-to">Alıcı e-posta</label>
                <input
                  id="outreach-test-to"
                  className="ea-admin-select"
                  type="email"
                  name="to"
                  required
                  defaultValue={defaultTestEmail}
                  placeholder="admin@eduatlas.com.tr"
                />
              </div>
              <Button type="submit" size="sm">
                Test e-postası gönder
              </Button>
            </form>
          ) : null}
        </section>

        <section className="ea-admin-outreach__preview" aria-label="E-posta önizleme">
          <h2 className="ea-admin-section-title">Önizleme</h2>
          {previewSubject ? (
            <p className="ea-admin-muted">
              Konu: <strong>{previewSubject}</strong>
            </p>
          ) : (
            <p className="ea-admin-muted">Önizleme için kampanyayı kaydedin.</p>
          )}
          {previewHtml ? (
            <iframe
              className="ea-admin-outreach__iframe"
              title="Kampanya e-posta önizlemesi"
              srcDoc={previewHtml}
              sandbox=""
            />
          ) : null}
        </section>
      </div>
    </AdminShell>
  );
}
