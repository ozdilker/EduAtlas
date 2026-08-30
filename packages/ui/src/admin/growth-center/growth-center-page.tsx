"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/button";
import { AdminShell } from "../admin-shell";
import { buildAdminNavItems } from "../admin-nav";
import { GrowthAuditLog } from "./audit-log";
import { CampaignMailPreview } from "./campaign-mail-preview";
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
  ManualInstitutionPicker,
  RecipientInstitutionMatchPanel,
} from "./recipient-institution-match";
import {
  campaignMatchesUiFilter,
  GROWTH_LIST_FILTERS,
  inferInitialWizardStep,
  WIZARD_STEPS,
  type GrowthCenterPageProps,
  type GrowthFormValues,
  type GrowthPreSendChecklist,
} from "./types";

type DraftForm = {
  name: string;
  description: string;
  templateId: string;
  segmentId: string;
  recipientSource: "segment" | "external_import" | "manual";
  subjectOverride: string;
  preheader: string;
  matchCityId: string;
  matchDistrictId: string;
};

type ImportPreviewState = Readonly<{
  fileName: string;
  rowCount: number;
  acceptedCount: number;
  rejectedCount: number;
  duplicateEmailCount: number;
  accepted: readonly {
    rowNumber: number;
    institutionName: string;
    email: string;
    institutionId: string;
  }[];
  rejected: readonly { rowNumber: number; message: string }[];
}>;

function toDraft(form: GrowthFormValues): DraftForm {
  return {
    name: form.name,
    description: form.description,
    templateId: form.templateId,
    segmentId: form.segmentId,
    recipientSource: form.recipientSource ?? "segment",
    subjectOverride: form.subjectOverride,
    preheader: form.preheader,
    matchCityId: form.matchCityId ?? "",
    matchDistrictId: form.matchDistrictId ?? "",
  };
}

function checklistSyncKey(checklist: GrowthPreSendChecklist): string {
  return [
    checklist.subjectOk,
    checklist.ctaOk,
    checklist.testMailSent,
    checklist.recipientsReviewed,
    checklist.warmupOk,
    checklist.sendApproved,
  ].join("\0");
}

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
  previewInstitutionName = null,
  importMeta = null,
  defaultTestEmail = "",
  progress = null,
  recipients = [],
  segmentPreview = [],
  summary = null,
  matchSearchScope,
  matchScopeCities = [],
  matchScopeDistricts = [],
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
  prepareImportAction,
  matchRecipientsAction,
  addManualRecipientAction,
  assignRecipientInstitutionAction,
  approveAction,
  runAction,
  pauseAction,
  resumeAction,
  tickAction,
  expandWarmupAction,
  elevateWarmupAction,
  lowerWarmupAction,
  cancelAction,
  deleteAction,
  checklistAction,
  learningsAction,
}: GrowthCenterPageProps) {
  const router = useRouter();
  const isExisting = Boolean(form.id);
  const status = campaigns.find((c) => c.id === form.id)?.status ?? "draft";
  const hasRecipients = recipients.length > 0;
  const hasPreparedRecipients = recipients.some((r) => r.status !== "pending");
  const hasPendingImport = recipients.some((r) => r.status === "pending");
  const stageLimit = warmup?.limit ?? summary?.warmupLimit ?? 20;
  const matchedRecipientCount = recipients.filter(
    (r) => r.institutionMatch === "matched",
  ).length;
  const preparedMatchedCount = recipients.filter(
    (r) => r.institutionMatch === "matched" && r.status !== "pending",
  ).length;
  const missingMatchedPrepareCount = Math.max(
    0,
    matchedRecipientCount - preparedMatchedCount,
  );
  const recipientSource =
    form.recipientSource === "external_import" || form.recipientSource === "manual"
      ? form.recipientSource
      : "segment";
  const canContinueExternalPrepare =
    (recipientSource === "external_import" || recipientSource === "manual") &&
    (status === "draft" || status === "ready" || status === "paused") &&
    missingMatchedPrepareCount > 0;
  const canExpand =
    status === "draft" && hasPreparedRecipients && recipients.filter((r) => r.status !== "pending").length < stageLimit;
  const canEditChecklist =
    status === "draft" || status === "ready" || status === "paused";
  const canEditLearnings =
    status === "completed" || status === "cancelled" || status === "failed";
  const recipientsReadyForRun =
    recipientSource === "segment" ||
    matchedRecipientCount === 0 ||
    preparedMatchedCount >= matchedRecipientCount;
  const canStartRun = status === "ready" && preSendComplete && recipientsReadyForRun;

  const [filter, setFilter] = useState<string>("all");
  const [step, setStep] = useState(() =>
    inferInitialWizardStep({ isExisting, status, hasRecipients: hasPreparedRecipients }),
  );
  const [draft, setDraft] = useState<DraftForm>(() => toDraft(form));
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [checklistDraft, setChecklistDraft] =
    useState<GrowthPreSendChecklist>(preSendChecklist);
  const [learningNotes, setLearningNotes] = useState(learnings?.notes ?? "");
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null);
  const [importPreviewError, setImportPreviewError] = useState<string | null>(null);
  const [importPreviewBusy, setImportPreviewBusy] = useState(false);
  const [selectedPreviewRecipientId, setSelectedPreviewRecipientId] = useState<string>("");

  const searchCityId =
    draft.recipientSource !== "segment" && draft.matchCityId
      ? draft.matchCityId
      : matchSearchScope?.cityId;
  const searchDistrictId =
    draft.recipientSource !== "segment" && draft.matchDistrictId
      ? draft.matchDistrictId
      : matchSearchScope?.districtId;
  const matchCityId = searchCityId;
  const matchDistrictId = searchDistrictId;
  const districtsForMatchCity = matchScopeDistricts.filter(
    (district) => district.cityId === draft.matchCityId,
  );

  const formSyncKey = [
    form.id,
    form.name,
    form.description,
    form.templateId,
    form.segmentId,
    form.recipientSource,
    form.subjectOverride,
    form.preheader,
    form.matchCityId,
    form.matchDistrictId,
    defaultTestEmail,
    checklistSyncKey(preSendChecklist),
    learnings?.notes ?? "",
    recipients.map((r) => r.id).join(","),
    previewInstitutionName ?? "",
  ].join("\0");

  useEffect(() => {
    setDraft(toDraft(form));
    setTestEmail(defaultTestEmail);
    setChecklistDraft(preSendChecklist);
    setLearningNotes(learnings?.notes ?? "");
    setImportPreviewError(null);
    // Keep importPreview only as ephemeral upload feedback; recipients are source of truth.
  }, [formSyncKey]);

  useEffect(() => {
    if (!selectedPreviewRecipientId && recipients[0]?.id) {
      setSelectedPreviewRecipientId(recipients[0].id);
    }
  }, [recipients, selectedPreviewRecipientId]);

  const personalizationRecipient = useMemo(() => {
    const selected =
      recipients.find((r) => r.id === selectedPreviewRecipientId) ?? recipients[0];
    return selected ?? null;
  }, [recipients, selectedPreviewRecipientId]);

  const mailInstitutionName =
    personalizationRecipient?.displayName?.trim() ||
    previewInstitutionName?.trim() ||
    "";

  async function validateImportFile(file: File | null) {
    if (!file) {
      setImportPreview(null);
      setImportPreviewError(null);
      return;
    }
    if (!form.id) {
      setImportPreviewError("Önce kampanyayı kaydedin, sonra Excel/CSV yükleyin.");
      return;
    }
    setImportPreviewBusy(true);
    setImportPreviewError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("campaignId", form.id);
      const response = await fetch("/api/admin/outreach-import-preview", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        fileName?: string;
        rowCount?: number;
        acceptedCount?: number;
        rejectedCount?: number;
        duplicateEmailCount?: number;
        accepted?: ImportPreviewState["accepted"];
        rejected?: ImportPreviewState["rejected"];
      };
      if (!response.ok || !payload.ok) {
        setImportPreview(null);
        setImportPreviewError(payload.message || "Dosya doğrulanamadı.");
        return;
      }
      setImportPreview({
        fileName: payload.fileName ?? file.name,
        rowCount: payload.rowCount ?? 0,
        acceptedCount: payload.acceptedCount ?? 0,
        rejectedCount: payload.rejectedCount ?? 0,
        duplicateEmailCount: payload.duplicateEmailCount ?? 0,
        accepted: payload.accepted ?? [],
        rejected: payload.rejected ?? [],
      });
      router.refresh();
    } catch {
      setImportPreview(null);
      setImportPreviewError("Dosya doğrulama isteği başarısız.");
    } finally {
      setImportPreviewBusy(false);
    }
  }

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

      <div className="ea-growth-center">
      <div className="ea-admin-outreach">
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
                <li key={campaign.id} className="ea-admin-outreach__campaign-item">
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
                  {deleteAction && campaign.status === "draft" ? (
                    <form
                      action={deleteAction}
                      className="ea-admin-outreach__campaign-delete"
                      onSubmit={(event) => {
                        if (
                          !window.confirm(
                            `"${campaign.name}" taslağını silmek istediğinize emin misiniz?`,
                          )
                        ) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="campaignId" value={campaign.id} />
                      <Button type="submit" size="sm" variant="destructive">
                        Sil
                      </Button>
                    </form>
                  ) : null}
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
                        value={draft.name}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="İstanbul claim daveti"
                      />
                    </div>
                    <div className="ea-admin-field">
                      <label htmlFor="outreach-description">Mail gövde metni</label>
                      <textarea
                        id="outreach-description"
                        className="ea-admin-select"
                        name="description"
                        rows={4}
                        value={draft.description}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Şablon hero bölümünde görünür. Her satır bir paragraf olur. {{institutionName}} kullanabilirsiniz."
                      />
                      <p className="ea-admin-muted">
                        Konu → mail başlığı (hero); preheader → inbox önizleme; bu metin → hero
                        gövde. Alt bloklar (istatistik / özellikler / adımlar) şablondan gelir.
                      </p>
                    </div>
                    <div className="ea-admin-field">
                      <label htmlFor="outreach-subject">Konu</label>
                      <input
                        id="outreach-subject"
                        className="ea-admin-select"
                        name="subjectOverride"
                        required
                        value={draft.subjectOverride}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            subjectOverride: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="ea-admin-field">
                      <label htmlFor="outreach-preheader">Preheader</label>
                      <input
                        id="outreach-preheader"
                        className="ea-admin-select"
                        name="preheader"
                        required
                        value={draft.preheader}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            preheader: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <input type="hidden" name="templateId" value={draft.templateId} />
                    <input type="hidden" name="segmentId" value={draft.segmentId} />
                    <input type="hidden" name="recipientSource" value={draft.recipientSource} />
                    <input type="hidden" name="matchCityId" value={draft.matchCityId} />
                    <input type="hidden" name="matchDistrictId" value={draft.matchDistrictId} />
                  </>
                ) : null}
                {step === 2 ? (
                  <>
                    <input type="hidden" name="name" value={draft.name || "Kampanya"} />
                    <input type="hidden" name="description" value={draft.description} />
                    <input type="hidden" name="subjectOverride" value={draft.subjectOverride} />
                    <input type="hidden" name="preheader" value={draft.preheader} />
                    <input type="hidden" name="segmentId" value={draft.segmentId} />
                    <input type="hidden" name="recipientSource" value={draft.recipientSource} />
                    <input type="hidden" name="matchCityId" value={draft.matchCityId} />
                    <input type="hidden" name="matchDistrictId" value={draft.matchDistrictId} />
                    <div className="ea-admin-field">
                      <label htmlFor="outreach-template">Şablon</label>
                      <select
                        id="outreach-template"
                        className="ea-admin-select"
                        name="templateId"
                        value={draft.templateId}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            templateId: event.target.value,
                          }))
                        }
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
                    <input type="hidden" name="name" value={draft.name || "Kampanya"} />
                    <input type="hidden" name="description" value={draft.description} />
                    <input type="hidden" name="subjectOverride" value={draft.subjectOverride} />
                    <input type="hidden" name="preheader" value={draft.preheader} />
                    <input type="hidden" name="templateId" value={draft.templateId} />
                    <input type="hidden" name="recipientSource" value={draft.recipientSource} />
                    <fieldset className="ea-admin-field">
                      <legend>Alıcı kaynağı</legend>
                      <label className="ea-admin-muted">
                        <input
                          type="radio"
                          name="recipientSourceChoice"
                          checked={draft.recipientSource === "segment"}
                          onChange={() =>
                            setDraft((current) => ({
                              ...current,
                              recipientSource: "segment",
                            }))
                          }
                        />{" "}
                        Segment
                      </label>
                      <label className="ea-admin-muted">
                        <input
                          type="radio"
                          name="recipientSourceChoice"
                          checked={draft.recipientSource === "external_import"}
                          onChange={() =>
                            setDraft((current) => ({
                              ...current,
                              recipientSource: "external_import",
                            }))
                          }
                        />{" "}
                        Excel / CSV
                      </label>
                      <label className="ea-admin-muted">
                        <input
                          type="radio"
                          name="recipientSourceChoice"
                          checked={draft.recipientSource === "manual"}
                          onChange={() =>
                            setDraft((current) => ({
                              ...current,
                              recipientSource: "manual",
                            }))
                          }
                        />{" "}
                        Tekil alıcı
                      </label>
                    </fieldset>
                    {draft.recipientSource === "external_import" ||
                    draft.recipientSource === "manual" ? (
                      <fieldset className="ea-admin-field">
                        <legend>Eşleştirme kapsamı</legend>
                        <p className="ea-admin-muted">
                          Kurum araması bu il / ilçe ile sınırlanır. Sonuç yoksa diğer ilçeler
                          önerilmez.
                        </p>
                        <div className="ea-admin-field">
                          <label htmlFor="outreach-match-city">İl</label>
                          <select
                            id="outreach-match-city"
                            className="ea-admin-select"
                            name="matchCityId"
                            value={draft.matchCityId}
                            onChange={(event) => {
                              const cityId = event.target.value;
                              setDraft((current) => ({
                                ...current,
                                matchCityId: cityId,
                                matchDistrictId: matchScopeDistricts.some(
                                  (district) =>
                                    district.cityId === cityId &&
                                    district.id === current.matchDistrictId,
                                )
                                  ? current.matchDistrictId
                                  : "",
                              }));
                            }}
                          >
                            <option value="">İl seçin</option>
                            {matchScopeCities.map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="ea-admin-field">
                          <label htmlFor="outreach-match-district">İlçe</label>
                          <select
                            id="outreach-match-district"
                            className="ea-admin-select"
                            name="matchDistrictId"
                            value={draft.matchDistrictId}
                            disabled={!draft.matchCityId}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                matchDistrictId: event.target.value,
                              }))
                            }
                          >
                            <option value="">İlçe seçin</option>
                            {districtsForMatchCity.map((district) => (
                              <option key={district.id} value={district.id}>
                                {district.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </fieldset>
                    ) : (
                      <>
                        <input type="hidden" name="matchCityId" value="" />
                        <input type="hidden" name="matchDistrictId" value="" />
                      </>
                    )}
                    {draft.recipientSource === "segment" ? (
                      <div className="ea-admin-field">
                        <label htmlFor="outreach-segment">Segment</label>
                        <select
                          id="outreach-segment"
                          className="ea-admin-select"
                          name="segmentId"
                          value={draft.segmentId}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              segmentId: event.target.value,
                            }))
                          }
                          required
                        >
                          {segments.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : draft.recipientSource === "manual" ? (
                      <>
                        <input type="hidden" name="segmentId" value={draft.segmentId} />
                        {isExisting && addManualRecipientAction ? (
                          <div className="ea-admin-field">
                            <p className="ea-admin-muted">
                              Tekil alıcı ekler (Pending). DeliveryJob oluşmaz. Claim
                              şablonunda kurum eşleşmesi zorunludur.
                            </p>
                            <form action={addManualRecipientAction}>
                              <input type="hidden" name="campaignId" value={form.id} />
                              <div className="ea-admin-field">
                                <label htmlFor="outreach-manual-email">E-posta *</label>
                                <input
                                  id="outreach-manual-email"
                                  className="ea-admin-select"
                                  type="email"
                                  name="email"
                                  required
                                  placeholder="info@example.com"
                                />
                              </div>
                              <div className="ea-admin-field">
                                <label htmlFor="outreach-manual-name">Kurum adı</label>
                                <input
                                  id="outreach-manual-name"
                                  className="ea-admin-select"
                                  type="text"
                                  name="displayName"
                                  placeholder="Kadro Kurs"
                                />
                              </div>
                              <ManualInstitutionPicker
                                cityId={matchCityId}
                                districtId={matchDistrictId}
                              />
                              <Button type="submit" size="sm" variant="primary">
                                Alıcıyı ekle
                              </Button>
                            </form>
                          </div>
                        ) : (
                          <p className="ea-admin-muted">
                            Önce kampanyayı kaydedin, sonra tekil alıcı ekleyin.
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <input type="hidden" name="segmentId" value={draft.segmentId} />
                        <div className="ea-admin-field">
                          <label htmlFor="outreach-import-file">Alıcı dosyası (.csv / .xlsx)</label>
                          <input
                            id="outreach-import-file"
                            className="ea-admin-select"
                            type="file"
                            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              void validateImportFile(file);
                            }}
                          />
                          <p className="ea-admin-muted">
                            Zorunlu kolonlar: <code>institutionName</code>, <code>email</code>.
                            Dosya yüklenince alıcılar kampanyaya kalıcı kaydedilir (DeliveryJob
                            oluşmaz). Prepare ayrı adımdır.
                          </p>
                          {importPreviewBusy ? (
                            <p className="ea-admin-muted">İçe aktarılıyor…</p>
                          ) : null}
                          {importPreviewError ? (
                            <p className="ea-admin-visuals__status" role="alert">
                              {importPreviewError}
                            </p>
                          ) : null}
                          {importMeta || importPreview || hasRecipients ? (
                            <p className="ea-admin-muted" role="status">
                              {(importPreview ?? importMeta)?.fileName ?? "Import"}:{" "}
                              {importPreview?.acceptedCount ??
                                importMeta?.acceptedCount ??
                                recipients.length}{" "}
                              kabul
                              {importPreview || importMeta
                                ? `, ${importPreview?.rejectedCount ?? importMeta?.rejectedCount ?? 0} red, ${importPreview?.duplicateEmailCount ?? importMeta?.duplicateEmailCount ?? 0} tekrar`
                                : ""}
                              . Kayıtlı alıcı: {recipients.length}.
                            </p>
                          ) : null}
                        </div>
                      </>
                    )}
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
                {draft.recipientSource === "external_import" ||
                draft.recipientSource === "manual" ? (
                  <>
                    <p className="ea-admin-muted">
                      Kalıcı alıcı listesi (Firestore). Import/ekleme ≠ Prepare — DeliveryJob
                      yok. Claim için yalnızca Matched Ready.
                    </p>
                    {matchRecipientsAction && draft.recipientSource === "external_import" ? (
                      <form action={matchRecipientsAction}>
                        <input type="hidden" name="campaignId" value={form.id} />
                        <Button type="submit" size="sm">
                          Kurum eşleştirmeyi yeniden çalıştır
                        </Button>
                      </form>
                    ) : null}
                    {hasRecipients ? (
                      <>
                        <p className="ea-admin-muted" role="status">
                          {recipients.length} alıcı
                          {importMeta
                            ? ` · ${importMeta.fileName} (${importMeta.acceptedCount} kabul)`
                            : ""}
                        </p>
                        <div className="ea-admin-table-wrap">
                          <table className="ea-admin-table">
                            <thead>
                              <tr>
                                <th>Kurum</th>
                                <th>E-posta</th>
                                <th>EduAtlas Eşleşmesi</th>
                                <th>Durum</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {recipients.map((row) => (
                                <tr key={row.id}>
                                  <td>{row.displayName || "—"}</td>
                                  <td>{row.email}</td>
                                  <td>
                                    {row.institutionMatch === "matched"
                                      ? row.matchedLabel ||
                                        row.displayName ||
                                        "Eşleşti"
                                      : row.institutionMatch === "ambiguous"
                                        ? `${row.matchCandidateIds?.length ?? 0} olası kurum`
                                        : "Eşleşme bulunamadı"}
                                  </td>
                                  <td>
                                    {row.institutionMatch === "matched"
                                      ? "Matched / Ready"
                                      : row.institutionMatch === "ambiguous"
                                        ? "Ambiguous / Blocked"
                                        : "Blocked"}
                                  </td>
                                  <td>
                                    {assignRecipientInstitutionAction &&
                                    row.status === "pending" &&
                                    row.institutionMatch !== "matched" ? (
                                      <RecipientInstitutionMatchPanel
                                        campaignId={form.id}
                                        recipientId={row.id}
                                        initialQuery={row.displayName || ""}
                                        candidateIds={row.matchCandidateIds}
                                        cityId={matchCityId}
                                        districtId={matchDistrictId}
                                        assignAction={assignRecipientInstitutionAction}
                                      />
                                    ) : null}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p className="ea-admin-muted">
                        Kayıtlı alıcı yok. Adım 3’te Excel/CSV veya tekil alıcı ekleyin.
                      </p>
                    )}
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            ) : null}

            {step === 5 ? (
              <div>
                <p className="ea-admin-muted">
                  Canlı şablon önizlemesi sağ sütunda. Konu, preheader ve gövde metni
                  kaydetmeden de yansır; gönderimde aynı şablon kullanılır.
                </p>
                {hasRecipients ? (
                  <div className="ea-admin-field">
                    <label htmlFor="outreach-preview-recipient">Preview recipient</label>
                    <select
                      id="outreach-preview-recipient"
                      className="ea-admin-select"
                      value={personalizationRecipient?.id ?? ""}
                      onChange={(event) => setSelectedPreviewRecipientId(event.target.value)}
                    >
                      {recipients.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.displayName || row.email}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="ea-admin-muted">Preview için alıcı bulunamadı.</p>
                )}
              </div>
            ) : null}

            {step === 6 && isExisting ? (
              <form action={testSendAction} className="ea-admin-outreach__test">
                <p className="ea-admin-muted">
                  Test maili Campaign Queue / DeliveryJob kullanmaz. To adresi ile
                  personalization alıcısı ayrıdır.
                </p>
                <input type="hidden" name="campaignId" value={form.id} />
                <input
                  type="hidden"
                  name="institutionName"
                  value={mailInstitutionName}
                />
                {hasRecipients ? (
                  <div className="ea-admin-field">
                    <label htmlFor="outreach-test-preview-recipient">
                      Personalization recipient
                    </label>
                    <select
                      id="outreach-test-preview-recipient"
                      className="ea-admin-select"
                      value={personalizationRecipient?.id ?? ""}
                      onChange={(event) => setSelectedPreviewRecipientId(event.target.value)}
                    >
                      {recipients.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.displayName || row.email}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="ea-admin-muted" role="alert">
                    Preview için alıcı bulunamadı — test gönderilemez.
                  </p>
                )}
                <div className="ea-admin-field">
                  <label htmlFor="outreach-test-to">Alıcı e-posta (To)</label>
                  <input
                    id="outreach-test-to"
                    className="ea-admin-select"
                    type="email"
                    name="to"
                    required
                    value={testEmail}
                    onChange={(event) => setTestEmail(event.target.value)}
                    placeholder="admin@eduatlas.com.tr"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!mailInstitutionName}
                >
                  Test e-postası gönder
                </Button>
              </form>
            ) : null}

            {step === 7 && isExisting ? (
              <div className="ea-admin-outreach__delivery">
                {draft.recipientSource === "external_import" ||
                draft.recipientSource === "manual" ? (
                  <>
                    <p className="ea-admin-muted">
                      Prepare: kayıtlı Pending (matched) alıcılardan DeliveryJob üretir.
                      Katalog taraması yok. Limit: stage {warmup?.stage ?? "—"} → {stageLimit}.
                      Claim için unmatched/ambiguous hazırlanmaz.
                    </p>
                    {matchedRecipientCount > 0 ? (
                      <p className="ea-admin-visuals__status" role="status">
                        {preparedMatchedCount}/{matchedRecipientCount} eşleşmiş alıcı hazırlandı
                        {missingMatchedPrepareCount > 0
                          ? ` — ${missingMatchedPrepareCount} alıcı için gönderim işi eksik.`
                          : " — tamam."}
                      </p>
                    ) : null}
                    {prepareImportAction &&
                    status === "draft" &&
                    hasPendingImport &&
                    !hasPreparedRecipients ? (
                      <form action={prepareImportAction}>
                        <input type="hidden" name="campaignId" value={form.id} />
                        <Button type="submit" size="sm" variant="primary">
                          Prepare
                        </Button>
                      </form>
                    ) : null}
                    {prepareImportAction && canContinueExternalPrepare ? (
                      <form action={prepareImportAction}>
                        <input type="hidden" name="campaignId" value={form.id} />
                        <Button type="submit" size="sm" variant="primary">
                          Eksik alıcıları hazırla ({missingMatchedPrepareCount})
                        </Button>
                      </form>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="ea-admin-muted">
                      Prepare / Expand: segment çalışır, CampaignRecipient + DeliveryJob oluşur.
                      Domain status <strong>draft</strong> kalır. Limit: stage{" "}
                      {warmup?.stage ?? "—"} → {stageLimit}.
                    </p>
                    {prepareAction && status === "draft" && !hasPreparedRecipients ? (
                      <form action={prepareAction}>
                        <input type="hidden" name="campaignId" value={form.id} />
                        <Button type="submit" size="sm" variant="primary">
                          Prepare
                        </Button>
                      </form>
                    ) : null}
                  </>
                )}
                {expandWarmupAction &&
                canExpand &&
                draft.recipientSource !== "external_import" &&
                draft.recipientSource !== "manual" ? (
                  <form action={expandWarmupAction}>
                    <input type="hidden" name="campaignId" value={form.id} />
                    <Button type="submit" size="sm" variant="primary">
                      Expand Warm-up
                    </Button>
                  </form>
                ) : null}
                {hasPreparedRecipients &&
                draft.recipientSource !== "external_import" &&
                draft.recipientSource !== "manual" ? (
                  <p className="ea-admin-visuals__status" role="status">
                    Hazırlandı (UI) —{" "}
                    {recipients.filter((r) => r.status !== "pending").length}/{stageLimit}{" "}
                    recipient. Domain: draft.
                  </p>
                ) : null}
                {!hasPreparedRecipients &&
                !hasPendingImport &&
                draft.recipientSource === "segment" ? (
                  <p className="ea-admin-muted">Prepare yalnızca draft ve recipient yokken.</p>
                ) : null}
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
                            <td>{row.displayName || row.institutionId}</td>
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
                  checklist={checklistDraft}
                  onChecklistChange={setChecklistDraft}
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
                {status === "ready" && preSendComplete && !recipientsReadyForRun ? (
                  <p className="ea-admin-visuals__status" role="status">
                    Run kilitli: {preparedMatchedCount}/{matchedRecipientCount} eşleşmiş alıcı
                    hazır. Step 7&apos;de eksik alıcıları hazırlayın.
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
                    notes={learningNotes}
                    onNotesChange={setLearningNotes}
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

        <aside className="ea-growth-right" aria-label="Mail preview">
          <section className="ea-growth-panel" aria-label="Mail preview">
            <h2 className="ea-admin-section-title">Mail preview</h2>
            {mailInstitutionName ? (
              <CampaignMailPreview
                templateId={draft.templateId}
                subject={draft.subjectOverride}
                preheader={draft.preheader}
                description={draft.description}
                institutionName={mailInstitutionName}
                initialHtml={previewHtml}
                initialSubject={previewSubject}
                className="ea-admin-outreach__iframe--full"
              />
            ) : (
              <p className="ea-admin-muted">Preview için alıcı bulunamadı.</p>
            )}
          </section>
        </aside>
      </div>

      <div className="ea-growth-below">
        <GrowthSummaryPanel
          summary={summary}
          progress={progress}
          domainStatus={status}
          warmup={warmup}
          elevateWarmupAction={elevateWarmupAction}
          lowerWarmupAction={lowerWarmupAction}
          campaignId={form.id || undefined}
        />
        {isExisting ? <GrowthAuditLog logs={logs} /> : null}
      </div>
      </div>
    </AdminShell>
  );
}
