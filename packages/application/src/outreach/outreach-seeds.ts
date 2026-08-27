import {
  createCampaign,
  createCampaignSegment,
  createCampaignTemplate,
  CampaignStatus,
  emptyPreSendChecklist,
} from "@eduatlas/domain";
import type { CampaignRepository } from "./campaign-repository";
import type { CampaignSegmentRepository } from "./campaign-segment-repository";
import type { CampaignTemplateRepository } from "./campaign-template-repository";

export const CLAIM_INVITATION_TEMPLATE_ID = "tpl_claim_invitation";
export const ISTANBUL_UNCLAIMED_SEGMENT_ID = "seg_istanbul_unclaimed_email";
export const SEED_CLAIM_INVITATION_CAMPAIGN_ID = "camp_seed_claim_invitation_istanbul";

/** Catalog city id for İstanbul (geo slug, not legacy tr-34 / city_istanbul). */
export const ISTANBUL_CITY_ID = "istanbul";

export const CLAIM_INVITATION_DEFAULT_SUBJECT =
  "{{institutionName}} için EduAtlas kurum paneli hazır";
export const CLAIM_INVITATION_DEFAULT_PREHEADER =
  "Velilerden gelen talepleri kaçırmayın — kurumunuzu ücretsiz sahiplenin.";

/**
 * Ensures seed template + segment + draft first-campaign kit exist (idempotent).
 */
export async function ensureOutreachSeeds(deps: {
  templateRepository: CampaignTemplateRepository;
  segmentRepository: CampaignSegmentRepository;
  campaignRepository?: CampaignRepository;
  now?: string;
}): Promise<void> {
  const now = deps.now ?? new Date().toISOString();

  const existingTemplate = await deps.templateRepository.getById(CLAIM_INVITATION_TEMPLATE_ID);
  if (!existingTemplate) {
    await deps.templateRepository.save(
      createCampaignTemplate({
        id: CLAIM_INVITATION_TEMPLATE_ID,
        name: "Institution Claim Invitation",
        subject: CLAIM_INVITATION_DEFAULT_SUBJECT,
        preview: CLAIM_INVITATION_DEFAULT_PREHEADER,
        bodyLines: [
          "EduAtlas, velilerin eğitim kurumu aradığı platformdur. {{institutionName}} profiliniz burada listeleniyor olabilir.",
          "Kurum panelinden bilgilerinizi güncelleyin, gelen talepleri görün ve velilerle doğrudan iletişim kurun.",
        ],
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  const existingSegment = await deps.segmentRepository.getById(ISTANBUL_UNCLAIMED_SEGMENT_ID);
  if (!existingSegment) {
    await deps.segmentRepository.save(
      createCampaignSegment({
        id: ISTANBUL_UNCLAIMED_SEGMENT_ID,
        name: "İstanbul — sahiplenilmemiş + e-posta",
        description: "İstanbul, unclaimed, has email",
        filters: {
          cityId: ISTANBUL_CITY_ID,
          verification: "unclaimed",
          hasEmail: true,
        },
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  if (deps.campaignRepository) {
    const existingCampaign = await deps.campaignRepository.getById(
      SEED_CLAIM_INVITATION_CAMPAIGN_ID,
    );
    if (!existingCampaign) {
      await deps.campaignRepository.save(
        createCampaign({
          id: SEED_CLAIM_INVITATION_CAMPAIGN_ID,
          name: "İlk kampanya — İstanbul Claim Invitation",
          description: "",
          status: CampaignStatus.Draft,
          templateId: CLAIM_INVITATION_TEMPLATE_ID,
          segmentId: ISTANBUL_UNCLAIMED_SEGMENT_ID,
          subjectOverride: CLAIM_INVITATION_DEFAULT_SUBJECT,
          preheader: CLAIM_INVITATION_DEFAULT_PREHEADER,
          createdAt: now,
          createdBy: "system_seed",
          preSendChecklist: emptyPreSendChecklist(),
        }),
      );
    }
  }
}
