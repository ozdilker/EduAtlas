"use client";

import { useMemo, useState } from "react";
import { Button } from "../../components/button";
import { AdminShell } from "../admin-shell";
import { buildAdminNavItems } from "../admin-nav";
import { GrowthAuditLog } from "./audit-log";
import { GrowthLiveDelivery } from "./live-delivery";
import {
  GrowthLearningLog,
  GrowthLearningsForm,
  GrowthPostSummaryPanel,
  GrowthPreSendChecklistForm,
  GrowthRecipientChecklist,
} from "./campaign-kit-panels";
import { GrowthSummaryPanel } from "./summary-panel";
import {
  campaignMatchesUiFilter,
  GROWTH_LIST_FILTERS,
  inferInitialWizardStep,
  WIZARD_STEPS,
  type GrowthCenterPageProps,
} from "./types";

/**
 * EduAtlas Growth Center — campaign ops on `/admin/outreach`.
 */
export function GrowthCenterPage({
  campaigns,
  templates,
  segments,
  form,
  previewHtml,
  previewSubject,
  sampleInstitutionName,
  defaultTestEmail = "",
  progress = null,
  recipients = [],
  segmentPreview = [],
  summary = null,
  warmup,
  preSendChecklist = {
    subjectOk: false,
    ctaOk: false,
    testMailSent: false,
    recipientsReviewed: false,
    warmupOk: false,
    sendApproved: false,
  },
  preSendComplete = false,
  recipientChecklist = [],
  postSummary = null,
  learnings = null,
  growthLearnings = [],
  logs = [],
  notice,
  error,
  saveAction,
  testSendAction,
  prepareAction,
  approveAction,
  runAction,
  pauseAction,
  resumeAction,
  tickAction,
  expandWarmupAction,
  elevateWarmupAction,
  cancelAction,
  checklistAction,
  learningsAction,
}: GrowthCenterPageProps) {
  const isExisting = Boolean(form.id);
  const status = campaigns.find((c) => c.id === form.id)?.status ?? "draft";
  const hasRecipients = recipients.length > 0;
  const stageLimit = warmup?.limit ?? summary?.warmupLimit ?? 20;
  const canExpand =
    status === "draft" && hasRecipients && recipients.length < stageLimit;
  const canEditChecklist =
    status === "draft" || status === "ready" || status === "paused";
  const canEditLearnings =
    status === "completed" || status === "cancelled" || status === "failed";
  const canStartRun = status === "ready" && preSendComplete;

  const [filter, setFilter] = useState<string>("all");
  const [step, setStep] = useState(() =>
    inferInitialWizardStep({ isExisting, status, hasRecipients }),
  );

  const filteredCampaigns = useMemo(
    () => campaigns.filter((c) => campaignMatchesUiFilter(filter, c)),
    [campaigns, filter],
  );

  const maxStep = isExisting ? 10 : 3;

  return (
    <AdminShell activeNavId="outreach" navItems={buildAdminNavItems()}>
      <header className="ea-admin-page-header">
        <h1 className="ea-admin-page-header__title">Growth Center</h1>
        <p className="ea-admin-page-header__subtitle">
          Kampanya hazırlama, kontrol, gönderim ve izleme. Prepare domain status’ünü
          değiştirmez; Approve draft → ready; Run yalnızca ready.
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

      <div className="ea-admin-outreach ea-growth-center">
        <aside className="ea-admin-outreach__list" aria-label="Kampanya listesi">
          <h2 className="ea-admin-section-title">Kampanyalar</h2>
          <div className="ea-growth-filters" role="tablist" aria-label="Durum filtreleri">
            {GROWTH_LIST_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={
                  filter === item.id
                    ? "ea-growth-filters__btn ea-growth-filters__btn--active"
                    : "ea-growth-filters__btn"
                }
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {filteredCampaigns.length === 0 ? (
            <p className="ea-admin-muted">Bu filtrede kampanya yok.</p>
          ) : (
            <ul className="ea-admin-outreach__campaigns">
              {filteredCampaigns.map((campaign) => (
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
                    <span className="ea-admin-muted">
                      {campaign.listBucketLabel}
                      {campaign.status === "draft" && campaign.recipientCount > 0
                        ? " · domain: draft"
                        : ` · ${campaign.status}`}
                    </span>
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

        <section className="ea-admin-outreach__builder" aria-label="Campaign wizard">
          <h2 className="ea-admin-section-title">
            {isExisting ? "Campaign Wizard" : "Yeni kampanya"}
          </h2>

          <ol className="ea-growth-steps">
            {WIZARD_STEPS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={
                    step === s.id
                      ? "ea-growth-steps__btn ea-growth-steps__btn--active"
                      : "ea-growth-steps__btn"
                  }
                  disabled={s.id > maxStep}
                  onClick={() => setStep(s.id)}
                >
                  {s.id}. {s.label}
                </button>
              </li>
            ))}
          </ol>

          <div className="ea-growth-step-panel">
            {(step === 1 || step === 2 || step === 3) && (
              <form action={saveAction} className="ea-admin-outreach__form">
                {isExisting ? <input type="hidden" name="campaignId" value={form.id} /> : null}
                {step === 1 ? (
                  <>
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
                    <input type="hidden" name="templateId" value={form.templateId} />
                    <input type="hidden" name="segmentId" value={form.segmentId} />
                  </>
                ) : null}
                {step === 2 ? (
                  <>
                    <input type="hidden" name="name" value={form.name || "Kampanya"} />
                    <input type="hidden" name="description" value={form.description} />
                    <input type="hidden" name="subjectOverride" value={form.subjectOverride} />
                    <input type="hidden" name="preheader" value={form.preheader} />
                    <input type="hidden" name="segmentId" value={form.segmentId} />
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
                  </>
                ) : null}
                {step === 3 ? (
                  <>
                    <input type="hidden" name="name" value={form.name || "Kampanya"} />
                    <input type="hidden" name="description" value={form.description} />
                    <input type="hidden" name="subjectOverride" value={form.subjectOverride} />
                    <input type="hidden" name="preheader" value={form.preheader} />
                    <input type="hidden" name="templateId" value={form.templateId} />
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
                  </>
                ) : null}
                <p className="ea-admin-muted">
                  Kişiselleştirme: <code>{"{{institutionName}}"}</code>
                </p>
                <Button type="submit" variant="primary" size="sm">
                  {isExisting ? "Kaydet" : "Oluştur"}
                </Button>
              </form>
            )}

            {step === 4 && isExisting ? (
              <div>
                <p className="ea-admin-muted">
                  Segment eşleşmesi (Prepare öncesi önizleme — job oluşturulmaz).
                </p>
                {segmentPreview.length === 0 ? (
                  <p className="ea-admin-muted">Eşleşen kurum yok veya segment boş.</p>
                ) : (
                  <div className="ea-admin-table-wrap">
                    <table className="ea-admin-table">
                      <thead>
                        <tr>
                          <th>Kurum</th>
                          <th>Şehir</th>
                          <th>Mail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {segmentPreview.map((row) => (
                          <tr key={row.institutionId}>
                            <td>{row.name}</td>
                            <td>{row.cityId}</td>
                            <td>{row.email || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

            {step === 5 && isExisting ? (
              <div>
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
              </div>
            ) : null}

            {step === 6 && isExisting ? (
              <form action={testSendAction} className="ea-admin-outreach__test">
                <p className="ea-admin-muted">
                  Test maili Campaign Queue / DeliveryJob kullanmaz.
                </p>
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

            {step === 7 && isExisting ? (
              <div className="ea-admin-outreach__delivery">
                <p className="ea-admin-muted">
                  Prepare / Expand: segment çalışır, CampaignRecipient + DeliveryJob oluşur.
                  Domain status <strong>draft</strong> kalır. Limit: stage {warmup?.stage ?? "—"}{" "}
                  → {stageLimit}.
                </p>
                {prepareAction && status === "draft" && !hasRecipients ? (
                  <form action={prepareAction}>
                    <input type="hidden" name="campaignId" value={form.id} />
                    <Button type="submit" size="sm" variant="primary">
                      Prepare
                    </Button>
                  </form>
                ) : null}
                {expandWarmupAction && canExpand ? (
                  <form action={expandWarmupAction}>
                    <input type="hidden" name="campaignId" value={form.id} />
                    <Button type="submit" size="sm" variant="primary">
                      Expand Warm-up
                    </Button>
                  </form>
                ) : null}
                {hasRecipients ? (
                  <p className="ea-admin-visuals__status" role="status">
                    Hazırlandı (UI) — {recipients.length}/{stageLimit} recipient. Domain: draft.
                  </p>
                ) : (
                  <p className="ea-admin-muted">Prepare yalnızca draft ve recipient yokken.</p>
                )}
              </div>
            ) : null}

            {step === 8 && isExisting ? (
              <div>
                <p className="ea-admin-muted">Review — prepare sonrası recipient checklist + liste.</p>
                <h3 className="ea-admin-section-title">Recipient checklist</h3>
                <GrowthRecipientChecklist items={recipientChecklist} />
                {hasRecipients ? (
                  <div className="ea-admin-table-wrap">
                    <table className="ea-admin-table">
                      <thead>
                        <tr>
                          <th>Kurum</th>
                          <th>E-posta</th>
                          <th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipients.map((row) => (
                          <tr key={row.id}>
                            <td>{row.institutionId}</td>
                            <td>{row.email}</td>
                            <td>{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="ea-admin-muted">Önce Prepare adımını tamamlayın.</p>
                )}
                {growthLearnings.length > 0 ? (
                  <div className="ea-growth-kit-block">
                    <h3 className="ea-admin-section-title">Önceki learning’ler</h3>
                    <GrowthLearningLog rows={growthLearnings} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 9 && isExisting ? (
              <div className="ea-admin-outreach__delivery">
                <p className="ea-admin-muted">Approve: draft → ready. Run için checklist zorunlu.</p>
                {approveAction && status === "draft" && hasRecipients ? (
                  <form action={approveAction}>
                    <input type="hidden" name="campaignId" value={form.id} />
                    <Button type="submit" size="sm" variant="primary">
                      Approve
                    </Button>
                  </form>
                ) : status === "ready" || status === "running" || status === "paused" ? (
                  <p className="ea-admin-visuals__status">Onaylı — domain: {status}</p>
                ) : (
                  <p className="ea-admin-muted">Approve için önce Prepare gerekir.</p>
                )}
                <GrowthPreSendChecklistForm
                  campaignId={form.id}
                  checklist={preSendChecklist}
                  complete={preSendComplete}
                  action={checklistAction}
                  canEdit={canEditChecklist}
                />
              </div>
            ) : null}

            {step === 10 && isExisting ? (
              <div className="ea-admin-outreach__delivery">
                <p className="ea-admin-muted">
                  Run yalnızca ready + tamamlanmış pre-send checklist (veya pause sonrası resume).
                </p>
                {status === "ready" && !preSendComplete ? (
                  <p className="ea-admin-visuals__status" role="status">
                    Pre-send checklist eksik — Run kilitli.
                  </p>
                ) : null}
                <div className="ea-admin-outreach__delivery-actions">
                  {runAction && canStartRun ? (
                    <form action={runAction}>
                      <input type="hidden" name="campaignId" value={form.id} />
                      <Button type="submit" size="sm" variant="primary">
                        Run
                      </Button>
                    </form>
                  ) : null}
                  {pauseAction && status === "running" ? (
                    <form action={pauseAction}>
                      <input type="hidden" name="campaignId" value={form.id} />
                      <Button type="submit" size="sm">
                        Pause
                      </Button>
                    </form>
                  ) : null}
                  {resumeAction && status === "paused" ? (
                    <form action={resumeAction}>
                      <input type="hidden" name="campaignId" value={form.id} />
                      <Button type="submit" size="sm">
                        Resume
                      </Button>
                    </form>
                  ) : null}
                  {tickAction && (status === "running" || status === "paused") ? (
                    <form action={tickAction}>
                      <input type="hidden" name="campaignId" value={form.id} />
                      <Button type="submit" size="sm">
                        Worker tick
                      </Button>
                    </form>
                  ) : null}
                  {cancelAction &&
                  status !== "completed" &&
                  status !== "cancelled" ? (
                    <form action={cancelAction}>
                      <input type="hidden" name="campaignId" value={form.id} />
                      <Button type="submit" size="sm">
                        Cancel
                      </Button>
                    </form>
                  ) : null}
                </div>
                <GrowthLiveDelivery
                  progress={progress}
                  status={status}
                  campaignId={form.id}
                  initialRemaining={summary?.remaining ?? 0}
                  initialEtaMinutes={summary?.etaMinutes ?? 0}
                />
                {(status === "completed" ||
                  status === "cancelled" ||
                  status === "failed" ||
                  postSummary) && (
                  <div className="ea-growth-kit-block">
                    <h3 className="ea-admin-section-title">Post summary</h3>
                    <GrowthPostSummaryPanel summary={postSummary} />
                  </div>
                )}
                {(canEditLearnings || learnings?.notes) && (
                  <GrowthLearningsForm
                    campaignId={form.id}
                    learnings={learnings}
                    action={learningsAction}
                    canEdit={canEditLearnings}
                  />
                )}
              </div>
            ) : null}

            {!isExisting && step > 3 ? (
              <p className="ea-admin-muted">Devam için önce kampanyayı oluşturun.</p>
            ) : null}
          </div>

          <div className="ea-growth-step-nav">
            <Button
              type="button"
              size="sm"
              disabled={step <= 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Geri
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={step >= maxStep}
              onClick={() => setStep((s) => Math.min(maxStep, s + 1))}
            >
              İleri
            </Button>
          </div>
        </section>

        <aside className="ea-growth-right" aria-label="Summary and audit">
          <GrowthSummaryPanel
            summary={summary}
            progress={progress}
            domainStatus={status}
            warmup={warmup}
            elevateWarmupAction={elevateWarmupAction}
            campaignId={form.id || undefined}
          />
          {isExisting && step !== 5 ? (
            <section className="ea-growth-panel" aria-label="Mail preview shortcut">
              <h2 className="ea-admin-section-title">Mail preview</h2>
              {previewHtml ? (
                <iframe
                  className="ea-admin-outreach__iframe ea-admin-outreach__iframe--compact"
                  title="Kampanya e-posta önizlemesi"
                  srcDoc={previewHtml}
                  sandbox=""
                />
              ) : (
                <p className="ea-admin-muted">Önizleme yok.</p>
              )}
            </section>
          ) : null}
          {isExisting ? <GrowthAuditLog logs={logs} /> : null}
        </aside>
      </div>
    </AdminShell>
  );
}
