export type CampaignPreSendChecklist = Readonly<{
  readonly subjectOk: boolean;
  readonly ctaOk: boolean;
  readonly testMailSent: boolean;
  readonly recipientsReviewed: boolean;
  readonly warmupOk: boolean;
  readonly sendApproved: boolean;
}>;

export type CampaignExecution = Readonly<{
  readonly preparedAt?: string;
  readonly approvedAt?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly cancelledAt?: string;
  readonly lastTestMailAt?: string;
}>;

export type CampaignPostSummary = Readonly<{
  readonly recipientCount: number;
  readonly sent: number;
  readonly failed: number;
  readonly bounced: number;
  readonly claimed: number;
  readonly premium: number;
  readonly durationMs?: number;
}>;

export type CampaignLearnings = Readonly<{
  readonly notes: string;
  readonly updatedAt?: string;
  readonly updatedBy?: string;
}>;

export function emptyPreSendChecklist(): CampaignPreSendChecklist {
  return Object.freeze({
    subjectOk: false,
    ctaOk: false,
    testMailSent: false,
    recipientsReviewed: false,
    warmupOk: false,
    sendApproved: false,
  });
}

export function isPreSendChecklistComplete(
  checklist: CampaignPreSendChecklist | undefined,
): boolean {
  if (!checklist) return false;
  return (
    checklist.subjectOk &&
    checklist.ctaOk &&
    checklist.testMailSent &&
    checklist.recipientsReviewed &&
    checklist.warmupOk &&
    checklist.sendApproved
  );
}

export function mergePreSendChecklist(
  current: CampaignPreSendChecklist | undefined,
  patch: Partial<CampaignPreSendChecklist>,
): CampaignPreSendChecklist {
  const base = current ?? emptyPreSendChecklist();
  return Object.freeze({
    subjectOk: patch.subjectOk ?? base.subjectOk,
    ctaOk: patch.ctaOk ?? base.ctaOk,
    testMailSent: patch.testMailSent ?? base.testMailSent,
    recipientsReviewed: patch.recipientsReviewed ?? base.recipientsReviewed,
    warmupOk: patch.warmupOk ?? base.warmupOk,
    sendApproved: patch.sendApproved ?? base.sendApproved,
  });
}
