export type GrowthCampaignOption = Readonly<{
  id: string;
  name: string;
  status: string;
  recipientCount: number;
  listBucket: string;
  listBucketLabel: string;
}>;

export type GrowthSelectOption = Readonly<{
  id: string;
  name: string;
}>;

export type GrowthFormValues = Readonly<{
  id: string;
  name: string;
  description: string;
  templateId: string;
  segmentId: string;
  recipientSource: "segment" | "external_import";
  subjectOverride: string;
  preheader: string;
}>;

export type GrowthProgressView = Readonly<{
  total: number;
  sent: number;
  queued: number;
  locked: number;
  failed: number;
  bounced: number;
  percent: number;
}>;

export type GrowthRecipientView = Readonly<{
  id: string;
  institutionId: string;
  displayName?: string;
  email: string;
  status: string;
}>;

export type GrowthSegmentPreviewRow = Readonly<{
  institutionId: string;
  name: string;
  cityId: string;
  email: string;
}>;

export type GrowthQualityFactor = Readonly<{
  id: string;
  label: string;
  points: number;
  maxPoints: number;
}>;

export type GrowthQualityScore = Readonly<{
  score: number;
  factors: readonly GrowthQualityFactor[];
}>;

export type GrowthSummaryView = Readonly<{
  segmentMatchCount: number;
  preparedRecipientCount: number;
  warmupBatchSize: number;
  warmupStage: number;
  warmupLimit: number;
  remaining: number;
  etaMinutes: number;
  ratePerMinute: number;
  qualityScore: GrowthQualityScore;
}>;

export type GrowthWarmupView = Readonly<{
  stage: number;
  limit: number;
  canElevate: boolean;
  canLower: boolean;
}>;

export type GrowthPreSendChecklist = Readonly<{
  subjectOk: boolean;
  ctaOk: boolean;
  testMailSent: boolean;
  recipientsReviewed: boolean;
  warmupOk: boolean;
  sendApproved: boolean;
}>;

export type GrowthRecipientCheckItem = Readonly<{
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}>;

export type GrowthPostSummary = Readonly<{
  recipientCount: number;
  sent: number;
  failed: number;
  bounced: number;
  claimed: number;
  premium: number;
  durationMs?: number;
}>;

export type GrowthLearnings = Readonly<{
  notes: string;
  updatedAt?: string;
  updatedBy?: string;
}>;

export type GrowthLearningRow = Readonly<{
  campaignId: string;
  name: string;
  notes: string;
  updatedAt?: string;
}>;

export type GrowthLogRow = Readonly<{
  id: string;
  level: string;
  message: string;
  at: string;
}>;

export type GrowthCenterPageProps = {
  campaigns: readonly GrowthCampaignOption[];
  templates: readonly GrowthSelectOption[];
  segments: readonly GrowthSelectOption[];
  form: GrowthFormValues;
  previewHtml: string;
  previewSubject: string;
  sampleInstitutionName: string;
  defaultTestEmail?: string;
  progress?: GrowthProgressView | null;
  recipients?: readonly GrowthRecipientView[];
  segmentPreview?: readonly GrowthSegmentPreviewRow[];
  summary?: GrowthSummaryView | null;
  warmup?: GrowthWarmupView;
  preSendChecklist?: GrowthPreSendChecklist;
  preSendComplete?: boolean;
  recipientChecklist?: readonly GrowthRecipientCheckItem[];
  postSummary?: GrowthPostSummary | null;
  learnings?: GrowthLearnings | null;
  growthLearnings?: readonly GrowthLearningRow[];
  logs?: readonly GrowthLogRow[];
  notice?: string;
  error?: string;
  saveAction: (formData: FormData) => Promise<void>;
  testSendAction: (formData: FormData) => Promise<void>;
  prepareAction?: (formData: FormData) => Promise<void>;
  prepareImportAction?: (formData: FormData) => Promise<void>;
  approveAction?: (formData: FormData) => Promise<void>;
  runAction?: (formData: FormData) => Promise<void>;
  pauseAction?: (formData: FormData) => Promise<void>;
  resumeAction?: (formData: FormData) => Promise<void>;
  tickAction?: (formData: FormData) => Promise<void>;
  expandWarmupAction?: (formData: FormData) => Promise<void>;
  elevateWarmupAction?: (formData: FormData) => Promise<void>;
  lowerWarmupAction?: (formData: FormData) => Promise<void>;
  cancelAction?: (formData: FormData) => Promise<void>;
  /** Permanently delete draft campaigns (domain status draft). */
  deleteAction?: (formData: FormData) => Promise<void>;
  checklistAction?: (formData: FormData) => Promise<void>;
  learningsAction?: (formData: FormData) => Promise<void>;
};

export const GROWTH_LIST_FILTERS = Object.freeze([
  { id: "all", label: "Kampanyalar" },
  { id: "draft", label: "Taslak" },
  { id: "prepared", label: "Hazırlandı" },
  { id: "ready", label: "Hazır" },
  { id: "running", label: "Çalışıyor" },
  { id: "completed", label: "Tamamlandı" },
  { id: "cancelled", label: "İptal" },
  { id: "archive", label: "Arşiv" },
] as const);

export const WIZARD_STEPS = Object.freeze([
  { id: 1, label: "Genel bilgiler" },
  { id: 2, label: "Template" },
  { id: 3, label: "Alıcı kaynağı" },
  { id: 4, label: "Recipient preview" },
  { id: 5, label: "Mail preview" },
  { id: 6, label: "Test mail" },
  { id: 7, label: "Prepare" },
  { id: 8, label: "Review" },
  { id: 9, label: "Approve" },
  { id: 10, label: "Run" },
] as const);

export function campaignMatchesUiFilter(
  filterId: string,
  campaign: GrowthCampaignOption,
): boolean {
  if (filterId === "all") return true;
  if (filterId === "archive") {
    return (
      campaign.status === "completed" ||
      campaign.status === "cancelled" ||
      campaign.status === "failed"
    );
  }
  if (filterId === "running") {
    return campaign.status === "running" || campaign.status === "paused";
  }
  if (filterId === "draft") {
    return campaign.status === "draft" && campaign.recipientCount === 0;
  }
  if (filterId === "prepared") {
    return campaign.status === "draft" && campaign.recipientCount > 0;
  }
  return campaign.status === filterId;
}

export function inferInitialWizardStep(input: {
  isExisting: boolean;
  status: string;
  hasRecipients: boolean;
}): number {
  if (!input.isExisting) return 1;
  if (input.status === "running" || input.status === "paused") return 10;
  if (input.status === "ready") return 10;
  if (input.status === "draft" && input.hasRecipients) return 8;
  if (input.status === "draft") return 1;
  return 1;
}
