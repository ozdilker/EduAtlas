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

export type AdminOutreachPageData = Readonly<{
  campaigns: readonly AdminOutreachCampaignRow[];
  templates: readonly AdminOutreachOption[];
  segments: readonly AdminOutreachOption[];
  selected: AdminOutreachCampaignRow | null;
  previewHtml: string;
  previewSubject: string;
  sampleInstitutionName: string;
  defaultCtaHref: string;
  notice?: string;
  error?: string;
}>;

const SAMPLE_INSTITUTION_NAME = "Örnek Anaokulu";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Loads campaign builder view data (in-memory outreach store).
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
    notice: firstParam(searchParams.notice)?.trim() || undefined,
    error: firstParam(searchParams.error)?.trim() || undefined,
  });
}
