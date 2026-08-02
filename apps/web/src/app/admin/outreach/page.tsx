import {
  CLAIM_INVITATION_DEFAULT_PREHEADER,
  CLAIM_INVITATION_DEFAULT_SUBJECT,
  CLAIM_INVITATION_TEMPLATE_ID,
  ISTANBUL_UNCLAIMED_SEGMENT_ID,
} from "@eduatlas/application";
import { AdminOutreachPage } from "@eduatlas/ui";
import {
  saveOutreachCampaignAction,
  sendOutreachTestEmailAction,
} from "@/server/admin/outreach-actions";
import { getAdminOutreachPageData } from "@/server/admin/get-admin-outreach";
import { getCurrentUser } from "@/server/auth/current-session";

export const dynamic = "force-dynamic";

type AdminOutreachRouteProps = {
  searchParams: Promise<{
    id?: string | string[];
    notice?: string | string[];
    error?: string | string[];
  }>;
};

export default async function AdminOutreachRoute({ searchParams }: AdminOutreachRouteProps) {
  const params = await searchParams;
  const data = await getAdminOutreachPageData(params);
  const user = await getCurrentUser();

  const form = data.selected
    ? {
        id: data.selected.id,
        name: data.selected.name,
        description: data.selected.description,
        templateId: data.selected.templateId,
        segmentId: data.selected.segmentId,
        subjectOverride: data.selected.subjectOverride,
        preheader: data.selected.preheader,
      }
    : {
        id: "",
        name: "",
        description: "",
        templateId: data.templates[0]?.id ?? CLAIM_INVITATION_TEMPLATE_ID,
        segmentId: data.segments[0]?.id ?? ISTANBUL_UNCLAIMED_SEGMENT_ID,
        subjectOverride: CLAIM_INVITATION_DEFAULT_SUBJECT,
        preheader: CLAIM_INVITATION_DEFAULT_PREHEADER,
      };

  return (
    <AdminOutreachPage
      campaigns={data.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
      }))}
      templates={data.templates}
      segments={data.segments}
      form={form}
      previewHtml={data.previewHtml}
      previewSubject={data.previewSubject}
      sampleInstitutionName={data.sampleInstitutionName}
      defaultTestEmail={user?.email ?? ""}
      notice={data.notice}
      error={data.error}
      saveAction={saveOutreachCampaignAction}
      testSendAction={sendOutreachTestEmailAction}
    />
  );
}
