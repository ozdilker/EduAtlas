import {
  CLAIM_INVITATION_DEFAULT_PREHEADER,
  CLAIM_INVITATION_DEFAULT_SUBJECT,
  CLAIM_INVITATION_TEMPLATE_ID,
  ISTANBUL_UNCLAIMED_SEGMENT_ID,
} from "@eduatlas/application";
import { AdminOutreachPage } from "@eduatlas/ui";
import {
  addManualOutreachRecipientAction,
  approveOutreachCampaignAction,
  assignOutreachRecipientInstitutionAction,
  cancelOutreachCampaignAction,
  deleteOutreachDraftCampaignAction,
  elevateOutreachWarmupStageAction,
  expandOutreachWarmupAction,
  lowerOutreachWarmupStageAction,
  matchOutreachRecipientsAction,
  pauseOutreachCampaignAction,
  prepareOutreachCampaignAction,
  prepareOutreachImportAction,
  resumeOutreachCampaignAction,
  runOutreachCampaignAction,
  saveOutreachCampaignAction,
  sendOutreachTestEmailAction,
  tickOutreachDeliveryAction,
  updateOutreachLearningsAction,
  updateOutreachPreSendChecklistAction,
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
        recipientSource: data.selected.recipientSource,
        subjectOverride: data.selected.subjectOverride,
        preheader: data.selected.preheader,
      }
    : {
        id: "",
        name: "",
        description: "",
        templateId: data.templates[0]?.id ?? CLAIM_INVITATION_TEMPLATE_ID,
        segmentId: data.segments[0]?.id ?? ISTANBUL_UNCLAIMED_SEGMENT_ID,
        recipientSource: "segment" as const,
        subjectOverride: CLAIM_INVITATION_DEFAULT_SUBJECT,
        preheader: CLAIM_INVITATION_DEFAULT_PREHEADER,
      };

  return (
    <AdminOutreachPage
      campaigns={data.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        recipientCount: c.recipientCount,
        listBucket: c.listBucket,
        listBucketLabel: c.listBucketLabel,
      }))}
      templates={data.templates}
      segments={data.segments}
      form={form}
      previewHtml={data.previewHtml}
      previewSubject={data.previewSubject}
      previewInstitutionName={data.previewInstitutionName}
      importMeta={data.importMeta}
      defaultTestEmail={user?.email ?? ""}
      progress={data.progress}
      recipients={data.recipients.map((r) => ({
        id: r.id,
        institutionId: r.institutionId,
        ...(r.displayName ? { displayName: r.displayName } : {}),
        ...(r.matchedLabel ? { matchedLabel: r.matchedLabel } : {}),
        email: r.email,
        status: r.status,
        ...(r.institutionMatch ? { institutionMatch: r.institutionMatch } : {}),
        ...(r.matchCandidateIds ? { matchCandidateIds: r.matchCandidateIds } : {}),
      }))}
      segmentPreview={data.segmentPreview}
      summary={data.summary}
      matchSearchScope={data.matchSearchScope ?? undefined}
      warmup={data.warmup}
      preSendChecklist={data.preSendChecklist}
      preSendComplete={data.preSendComplete}
      recipientChecklist={data.recipientChecklist}
      postSummary={data.postSummary}
      learnings={data.learnings}
      growthLearnings={data.growthLearnings}
      logs={data.logs}
      notice={data.notice}
      error={data.error}
      saveAction={saveOutreachCampaignAction}
      testSendAction={sendOutreachTestEmailAction}
      prepareAction={prepareOutreachCampaignAction}
      prepareImportAction={prepareOutreachImportAction}
      matchRecipientsAction={matchOutreachRecipientsAction}
      addManualRecipientAction={addManualOutreachRecipientAction}
      assignRecipientInstitutionAction={assignOutreachRecipientInstitutionAction}
      approveAction={approveOutreachCampaignAction}
      runAction={runOutreachCampaignAction}
      pauseAction={pauseOutreachCampaignAction}
      resumeAction={resumeOutreachCampaignAction}
      tickAction={tickOutreachDeliveryAction}
      expandWarmupAction={expandOutreachWarmupAction}
      elevateWarmupAction={elevateOutreachWarmupStageAction}
      lowerWarmupAction={lowerOutreachWarmupStageAction}
      cancelAction={cancelOutreachCampaignAction}
      deleteAction={deleteOutreachDraftCampaignAction}
      checklistAction={updateOutreachPreSendChecklistAction}
      learningsAction={updateOutreachLearningsAction}
    />
  );
}
