import {
  buildRecipientChecklist,
  type CampaignQualityScore,
  CLAIM_INVITATION_TEMPLATE_ID,
  campaignListBucketLabel,
  computeCampaignQualityScore,
  currentWarmupLimit,
  estimateDeliveryEtaMinutes,
  loadOutreachDeliveryConfig,
  previewSegmentInstitutions,
  remainingDeliveryJobs,
  resolveCampaignBodyLines,
  resolveCampaignListBucket,
  type SegmentInstitutionPreview,
} from "@eduatlas/application";
import {
  type CampaignLearnings,
  type CampaignPostSummary,
  type CampaignPreSendChecklist,
  campaignIdAsString,
  createInstitutionId,
  emptyPreSendChecklist,
  institutionIdAsString,
  isExternalInstitutionId,
  isPreSendChecklistComplete,
} from "@eduatlas/domain";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getBillingProtectionDeps } from "@/server/billing-protection/repository";
import { getInstitutionRepository } from "@/server/institutions/repository";
import { getOutreachService, getOutreachStores } from "@/server/outreach/store";

export type AdminOutreachCampaignRow = Readonly<{
  id: string;
  name: string;
  status: string;
  templateId: string;
  segmentId: string;
  recipientSource: "segment" | "external_import" | "manual";
  subjectOverride: string;
  preheader: string;
  description: string;
  recipientCount: number;
  listBucket: string;
  listBucketLabel: string;
}>;

export type AdminOutreachRecipientRow = Readonly<{
  id: string;
  institutionId: string;
  displayName?: string;
  matchedLabel?: string;
  email: string;
  status: string;
  institutionMatch?: "matched" | "unmatched" | "ambiguous";
  matchCandidateIds?: readonly string[];
}>;

export type AdminOutreachOption = Readonly<{
  id: string;
  name: string;
}>;

export type AdminOutreachProgress = Readonly<{
  total: number;
  sent: number;
  queued: number;
  locked: number;
  failed: number;
  bounced: number;
  percent: number;
}>;

export type AdminOutreachLogRow = Readonly<{
  id: string;
  level: string;
  message: string;
  at: string;
}>;

export type AdminOutreachSummary = Readonly<{
  segmentMatchCount: number;
  /** External/manual: imported recipient rows. */
  importedRecipientCount?: number;
  /** Catalog-matched recipients. */
  institutionMatchedCount?: number;
  /** Waiting for match (unmatched + ambiguous). */
  institutionMatchPendingCount?: number;
  preparedRecipientCount: number;
  warmupBatchSize: number;
  warmupStage: number;
  warmupLimit: number;
  remaining: number;
  etaMinutes: number;
  ratePerMinute: number;
  qualityScore: CampaignQualityScore;
}>;

export type AdminOutreachWarmupView = Readonly<{
  stage: number;
  limit: number;
  canElevate: boolean;
  canLower: boolean;
}>;

export type AdminOutreachLearningRow = Readonly<{
  campaignId: string;
  name: string;
  notes: string;
  updatedAt?: string;
}>;

export type AdminOutreachRecipientCheckItem = Readonly<{
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}>;

export type AdminOutreachPageData = Readonly<{
  campaigns: readonly AdminOutreachCampaignRow[];
  templates: readonly AdminOutreachOption[];
  segments: readonly AdminOutreachOption[];
  selected: AdminOutreachCampaignRow | null;
  previewHtml: string;
  previewSubject: string;
  previewInstitutionName: string | null;
  importMeta: {
    fileName: string;
    acceptedCount: number;
    rejectedCount: number;
    duplicateEmailCount: number;
    importedAt: string;
  } | null;
  defaultCtaHref: string;
  progress: AdminOutreachProgress | null;
  recipients: readonly AdminOutreachRecipientRow[];
  segmentPreview: readonly SegmentInstitutionPreview[];
  summary: AdminOutreachSummary | null;
  matchSearchScope: { cityId?: string; districtId?: string } | null;
  warmup: AdminOutreachWarmupView;
  preSendChecklist: CampaignPreSendChecklist;
  preSendComplete: boolean;
  recipientChecklist: readonly AdminOutreachRecipientCheckItem[];
  postSummary: CampaignPostSummary | null;
  learnings: CampaignLearnings | null;
  growthLearnings: readonly AdminOutreachLearningRow[];
  logs: readonly AdminOutreachLogRow[];
  notice?: string;
  error?: string;
}>;

function resolvePreviewInstitutionName(
  recipients: readonly { displayName?: string; email: string; status: string }[],
): string | null {
  const withName = recipients.find((r) => r.displayName?.trim());
  if (withName?.displayName?.trim()) return withName.displayName.trim();
  return null;
}

function countPreparedRecipients(
  recipients: readonly { status: string }[],
): number {
  return recipients.filter((r) => r.status !== "pending").length;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Loads Growth Center campaign builder + delivery view data.
 */
export async function getAdminOutreachPageData(searchParams: {
  id?: string | string[];
  notice?: string | string[];
  error?: string | string[];
}): Promise<AdminOutreachPageData> {
  const stores = await getOutreachStores();
  const service = await getOutreachService();
  const institutionRepository = await getInstitutionRepository();
  const site = getSeoSiteConfig();
  const ctaHref = `${site.siteUrl.replace(/\/+$/, "")}/login`;
  const deliveryConfig = loadOutreachDeliveryConfig();
  const warmupSettings = await service.getWarmupSettings();
  const warmupLimit = currentWarmupLimit(warmupSettings);
  const warmup: AdminOutreachWarmupView = {
    stage: warmupSettings.stage,
    limit: warmupLimit,
    canElevate: warmupSettings.stage < 4,
    canLower: warmupSettings.stage > 1,
  };

  const [campaigns, templates, segments] = await Promise.all([
    stores.campaignRepository.list(),
    stores.templateRepository.list(),
    stores.segmentRepository.list(),
  ]);

  const templateById = new Map(templates.map((t) => [t.id, t] as const));
  const templateSubjectById = new Map(templates.map((t) => [t.id, t.subject] as const));
  const templatePreviewById = new Map(templates.map((t) => [t.id, t.preview] as const));

  const recipientCounts = await Promise.all(
    campaigns.map(async (c) => {
      const id = campaignIdAsString(c.id);
      const rows = await stores.recipientRepository.listByCampaignId(id);
      return [id, countPreparedRecipients(rows)] as const;
    }),
  );
  const recipientCountById = new Map(recipientCounts);

  const rows: AdminOutreachCampaignRow[] = campaigns.map((c) => {
    const id = campaignIdAsString(c.id);
    const recipientCount = recipientCountById.get(id) ?? 0;
    const listBucket = resolveCampaignListBucket(c.status, recipientCount);
    return {
      id,
      name: c.name,
      status: c.status,
      templateId: c.templateId,
      segmentId: c.segmentId,
      recipientSource:
        c.recipientSource === "external_import"
          ? "external_import"
          : c.recipientSource === "manual"
            ? "manual"
            : "segment",
      subjectOverride: c.subjectOverride?.trim() || templateSubjectById.get(c.templateId) || "",
      preheader: c.preheader?.trim() || templatePreviewById.get(c.templateId) || "",
      description: c.description ?? "",
      recipientCount,
      listBucket,
      listBucketLabel: campaignListBucketLabel(listBucket),
    };
  });

  const selectedId = firstParam(searchParams.id)?.trim();
  const selected = selectedId ? (rows.find((r) => r.id === selectedId) ?? null) : null;

  let previewHtml = "";
  let previewSubject = "";
  let previewInstitutionName: string | null = null;
  let importMeta: AdminOutreachPageData["importMeta"] = null;
  let progress: AdminOutreachProgress | null = null;
  let recipients: AdminOutreachRecipientRow[] = [];
  let segmentPreview: SegmentInstitutionPreview[] = [];
  let summary: AdminOutreachSummary | null = null;
  let matchSearchScope: AdminOutreachPageData["matchSearchScope"] = null;
  let logs: AdminOutreachLogRow[] = [];
  let preSendChecklist = emptyPreSendChecklist();
  let preSendComplete = false;
  let recipientChecklist: AdminOutreachRecipientCheckItem[] = [];
  let postSummary: CampaignPostSummary | null = null;
  let learnings: CampaignLearnings | null = null;

  const growthLearnings = (await service.listCampaignLearnings()).map((row) => ({
    campaignId: row.campaignId,
    name: row.name,
    notes: row.notes,
    ...(row.updatedAt ? { updatedAt: row.updatedAt } : {}),
  }));

  if (selected) {
    const selectedDomain = campaigns.find((c) => campaignIdAsString(c.id) === selected.id);
    preSendChecklist = selectedDomain?.preSendChecklist ?? emptyPreSendChecklist();
    preSendComplete = isPreSendChecklistComplete(preSendChecklist);
    postSummary = selectedDomain?.postSummary ?? null;
    learnings = selectedDomain?.learnings ?? null;
    if (selectedDomain?.importMeta) {
      importMeta = {
        fileName: selectedDomain.importMeta.fileName,
        acceptedCount: selectedDomain.importMeta.acceptedCount,
        rejectedCount: selectedDomain.importMeta.rejectedCount,
        duplicateEmailCount: selectedDomain.importMeta.duplicateEmailCount,
        importedAt: selectedDomain.importMeta.importedAt,
      };
    }
    const template = templateById.get(selected.templateId);
    const subject = selected.subjectOverride;
    const preheader = selected.preheader;
    const bodyLines = resolveCampaignBodyLines({
      description: selected.description,
      templateBodyLines: template?.bodyLines ?? [],
    });
    const qualityScore = computeCampaignQualityScore({
      subject,
      preheader,
      bodyLines,
      hasCta: template?.id === CLAIM_INVITATION_TEMPLATE_ID || bodyLines.length > 0,
      hasTemplate: Boolean(template),
    });

    const recipientRows = await stores.recipientRepository.listByCampaignId(selected.id);
    const matchedIds = [
      ...new Set(
        recipientRows
          .filter(
            (r) =>
              r.institutionMatch === "matched" &&
              !isExternalInstitutionId(r.institutionId),
          )
          .map((r) => r.institutionId),
      ),
    ].slice(0, 40);
    const matchedLabelById = new Map<string, string>();
    await Promise.all(
      matchedIds.map(async (id) => {
        const inst = await institutionRepository.getById(createInstitutionId(id));
        if (!inst) return;
        const city = inst.location.cityId
          .split(/[-_]/)
          .filter(Boolean)
          .map((p) => p.charAt(0).toLocaleUpperCase("tr-TR") + p.slice(1))
          .join(" ");
        const district = inst.location.districtId
          .split(/[-_]/)
          .filter(Boolean)
          .map((p) => p.charAt(0).toLocaleUpperCase("tr-TR") + p.slice(1))
          .join(" ");
        const location =
          city && district ? `${city} / ${district}` : city || district || "";
        matchedLabelById.set(
          institutionIdAsString(inst.id),
          location ? `${inst.name} — ${location}` : inst.name,
        );
      }),
    );

    const selectedSegment = await stores.segmentRepository.getById(selected.segmentId);
    if (selectedSegment?.filters.cityId || selectedSegment?.filters.districtId) {
      matchSearchScope = {
        ...(selectedSegment.filters.cityId
          ? { cityId: selectedSegment.filters.cityId }
          : {}),
        ...(selectedSegment.filters.districtId
          ? { districtId: selectedSegment.filters.districtId }
          : {}),
      };
    }

    recipients = recipientRows.map((r) => ({
      id: r.id,
      institutionId: r.institutionId,
      ...(r.displayName ? { displayName: r.displayName } : {}),
      ...(matchedLabelById.get(r.institutionId)
        ? { matchedLabel: matchedLabelById.get(r.institutionId) }
        : {}),
      email: r.email,
      status: r.status,
      ...(r.institutionMatch ? { institutionMatch: r.institutionMatch } : {}),
      ...(r.matchCandidateIds ? { matchCandidateIds: r.matchCandidateIds } : {}),
    }));
    previewInstitutionName = resolvePreviewInstitutionName(recipients);

    if (previewInstitutionName) {
      try {
        const preview = await service.previewCampaignMail({
          campaignId: selected.id,
          institutionName: previewInstitutionName,
          ctaHref,
        });
        previewHtml = preview.html;
        previewSubject = preview.subject;
      } catch {
        previewHtml = "";
        previewSubject = "";
      }
    } else {
      previewHtml = "";
      previewSubject = "";
    }

    const progressRaw = await service.getProgress(selected.id);
    progress = {
      total: progressRaw.total,
      sent: progressRaw.sent,
      queued: progressRaw.queued,
      locked: progressRaw.locked,
      failed: progressRaw.failed,
      bounced: progressRaw.bounced,
      percent: progressRaw.percent,
    };
    const remaining = remainingDeliveryJobs(progressRaw);
    const etaMinutes = estimateDeliveryEtaMinutes(remaining, deliveryConfig.ratePerMinute);

    const check = buildRecipientChecklist({
      recipients: recipientRows,
      warmupLimit,
    });
    recipientChecklist = check.items.map((item) => ({
      id: item.id,
      label: item.label,
      ok: item.ok,
      ...(item.detail ? { detail: item.detail } : {}),
    }));

    const preparedRecipientCount = countPreparedRecipients(recipientRows);
    const isExternalOrManual =
      selected.recipientSource === "external_import" ||
      selected.recipientSource === "manual";

    if (isExternalOrManual) {
      const matchedCount = recipientRows.filter((r) => r.institutionMatch === "matched").length;
      const pendingMatch = recipientRows.filter(
        (r) =>
          r.institutionMatch !== "matched" &&
          (r.institutionMatch === "unmatched" ||
            r.institutionMatch === "ambiguous" ||
            !r.institutionMatch),
      ).length;
      segmentPreview = [];
      summary = {
        segmentMatchCount: matchedCount,
        importedRecipientCount: recipientRows.length,
        institutionMatchedCount: matchedCount,
        institutionMatchPendingCount: pendingMatch,
        preparedRecipientCount,
        warmupBatchSize: warmupLimit,
        warmupStage: warmupSettings.stage,
        warmupLimit,
        remaining,
        etaMinutes,
        ratePerMinute: deliveryConfig.ratePerMinute,
        qualityScore,
      };
    } else {
      try {
        const billingProtectionDeps = await getBillingProtectionDeps();
        const segPreview = await previewSegmentInstitutions(
          { segmentId: selected.segmentId, limit: 25 },
          {
            segmentRepository: stores.segmentRepository,
            institutionRepository,
            billingProtectionRepository: billingProtectionDeps.billingProtectionRepository,
          },
        );
        segmentPreview = [...segPreview.items];
        summary = {
          segmentMatchCount: segPreview.matchCount,
          preparedRecipientCount,
          warmupBatchSize: warmupLimit,
          warmupStage: warmupSettings.stage,
          warmupLimit,
          remaining,
          etaMinutes,
          ratePerMinute: deliveryConfig.ratePerMinute,
          qualityScore,
        };
      } catch {
        summary = {
          segmentMatchCount: 0,
          preparedRecipientCount,
          warmupBatchSize: warmupLimit,
          warmupStage: warmupSettings.stage,
          warmupLimit,
          remaining,
          etaMinutes,
          ratePerMinute: deliveryConfig.ratePerMinute,
          qualityScore,
        };
      }
    }

    const logRows = await service.listCampaignLogs(selected.id);
    logs = logRows.slice(0, 40).map((log) => ({
      id: log.id,
      level: log.level,
      message: log.message,
      at: log.at,
    }));
  }

  return Object.freeze({
    campaigns: Object.freeze(rows),
    templates: Object.freeze(templates.map((t) => Object.freeze({ id: t.id, name: t.name }))),
    segments: Object.freeze(segments.map((s) => Object.freeze({ id: s.id, name: s.name }))),
    selected,
    previewHtml,
    previewSubject,
    previewInstitutionName,
    importMeta,
    defaultCtaHref: ctaHref,
    progress,
    recipients: Object.freeze(recipients),
    segmentPreview: Object.freeze(segmentPreview),
    summary,
    matchSearchScope,
    warmup,
    preSendChecklist,
    preSendComplete,
    recipientChecklist: Object.freeze(recipientChecklist),
    postSummary,
    learnings,
    growthLearnings: Object.freeze(growthLearnings),
    logs: Object.freeze(logs),
    notice: firstParam(searchParams.notice)?.trim() || undefined,
    error: firstParam(searchParams.error)?.trim() || undefined,
  });
}
