import { campaignIdAsString } from "@eduatlas/domain";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getOutreachService, getOutreachStores } from "@/server/outreach/store";

export type AdminOutreachCampaignRow = Readonly<{
  id: string;
  name: string;
  status: string;
  templateId: string;
  segmentId: string;
  subjectOverride: string;
  preheader: string;
  description: string;
}>;

export type AdminOutreachOption = Readonly<{
  id: string;
  name: string;
}>;

export type AdminOutreachProgress = Readonly<{
  total: number;
  sent: number;
  queued: number;
  failed: number;
  bounced: number;
  percent: number;
}>;

export type AdminOutreachRecipientRow = Readonly<{
  id: string;
  institutionId: string;
  email: string;
  status: string;
}>;

export type AdminOutreachPageData = Readonly<{
  campaigns: readonly AdminOutreachCampaignRow[];
  templates: readonly AdminOutreachOption[];
  segments: readonly AdminOutreachOption[];
  selected: AdminOutreachCampaignRow | null;
  previewHtml: string;
  previewSubject: string;
  sampleInstitutionName: string;
  defaultCtaHref: string;
  progress: AdminOutreachProgress | null;
  recipients: readonly AdminOutreachRecipientRow[];
  notice?: string;
  error?: string;
}>;

const SAMPLE_INSTITUTION_NAME = "Örnek Anaokulu";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Loads campaign builder + delivery view data.
 */
export async function getAdminOutreachPageData(searchParams: {
  id?: string | string[];
  notice?: string | string[];
  error?: string | string[];
}): Promise<AdminOutreachPageData> {
  const stores = await getOutreachStores();
  const service = await getOutreachService();
  const site = getSeoSiteConfig();
  const ctaHref = `${site.siteUrl.replace(/\/+$/, "")}/login`;

  const [campaigns, templates, segments] = await Promise.all([
    stores.campaignRepository.list(),
    stores.templateRepository.list(),
    stores.segmentRepository.list(),
  ]);

  const templateSubjectById = new Map(templates.map((t) => [t.id, t.subject] as const));
  const templatePreviewById = new Map(templates.map((t) => [t.id, t.preview] as const));

  const rows: AdminOutreachCampaignRow[] = campaigns.map((c) => {
    const id = campaignIdAsString(c.id);
    return {
      id,
      name: c.name,
      status: c.status,
      templateId: c.templateId,
      segmentId: c.segmentId,
      subjectOverride:
        c.subjectOverride?.trim() || templateSubjectById.get(c.templateId) || "",
      preheader: c.preheader?.trim() || templatePreviewById.get(c.templateId) || "",
      description: c.description ?? "",
    };
  });

  const selectedId = firstParam(searchParams.id)?.trim();
  const selected = selectedId
    ? (rows.find((r) => r.id === selectedId) ?? null)
    : null;

  let previewHtml = "";
  let previewSubject = "";
  let progress: AdminOutreachProgress | null = null;
  let recipients: AdminOutreachRecipientRow[] = [];

  if (selected) {
    try {
      const preview = await service.previewCampaignMail({
        campaignId: selected.id,
        institutionName: SAMPLE_INSTITUTION_NAME,
        ctaHref,
      });
      previewHtml = preview.html;
      previewSubject = preview.subject;
    } catch {
      previewHtml = "";
      previewSubject = "";
    }
    progress = await service.getProgress(selected.id);
    const recipientRows = await stores.recipientRepository.listByCampaignId(selected.id);
    recipients = recipientRows.map((r) => ({
      id: r.id,
      institutionId: r.institutionId,
      email: r.email,
      status: r.status,
    }));
  }

  return Object.freeze({
    campaigns: Object.freeze(rows),
    templates: Object.freeze(
      templates.map((t) => Object.freeze({ id: t.id, name: t.name })),
    ),
    segments: Object.freeze(
      segments.map((s) => Object.freeze({ id: s.id, name: s.name })),
    ),
    selected,
    previewHtml,
    previewSubject,
    sampleInstitutionName: SAMPLE_INSTITUTION_NAME,
    defaultCtaHref: ctaHref,
    progress,
    recipients: Object.freeze(recipients),
    notice: firstParam(searchParams.notice)?.trim() || undefined,
    error: firstParam(searchParams.error)?.trim() || undefined,
  });
}
