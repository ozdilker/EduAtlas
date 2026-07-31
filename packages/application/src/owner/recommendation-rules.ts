import {
  createOwnerRecommendation,
  type Institution,
  type InstitutionLeadCounters,
  InstitutionVerification,
  institutionIdAsString,
  isInstitutionVerified,
  type Lead,
  LeadStatus,
  type OwnerRecommendation,
  RecommendationPriority,
  RecommendationType,
} from "@eduatlas/domain";
import { computeInstitutionProfileCompleteness } from "./profile-completeness";

const STALE_NEW_LEAD_MS = 24 * 60 * 60 * 1000;
const PENDING_FOLLOW_UP_THRESHOLD = 5;
const MIN_GALLERY_IMAGES = 3;
const MIN_LONG_DESCRIPTION_CHARS = 120;
const MIN_SHORT_DESCRIPTION_CHARS = 40;

export type EvaluateOwnerRecommendationRulesInput = {
  institution: Institution;
  leads: readonly Lead[];
  leadCounters?: InstitutionLeadCounters;
  now?: string;
};

/**
 * Sales Agent recommendations from live lead signals + public profile analysis.
 * No LLM; recommendations are derived from the institution detail/profile fields.
 */
export function evaluateOwnerRecommendationRules(
  input: EvaluateOwnerRecommendationRulesInput,
): readonly OwnerRecommendation[] {
  const nowIso = input.now ?? new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const institutionId = institutionIdAsString(input.institution.id);
  const recommendations: OwnerRecommendation[] = [];

  pushLeadRecommendations(recommendations, {
    institutionId,
    leads: input.leads,
    leadCounters: input.leadCounters,
    nowIso,
    nowMs,
  });
  pushProfileRecommendations(recommendations, {
    institutionId,
    institution: input.institution,
    nowIso,
  });

  return Object.freeze(sortRecommendations(recommendations));
}

function pushLeadRecommendations(
  recommendations: OwnerRecommendation[],
  input: {
    institutionId: string;
    leads: readonly Lead[];
    leadCounters?: InstitutionLeadCounters;
    nowIso: string;
    nowMs: number;
  },
): void {
  const staleNewLeads = input.leads.filter((lead) => {
    if (lead.status !== LeadStatus.New) return false;
    const createdMs = Date.parse(lead.createdAt);
    if (Number.isNaN(createdMs) || Number.isNaN(input.nowMs)) return false;
    return input.nowMs - createdMs > STALE_NEW_LEAD_MS;
  });

  if (staleNewLeads.length > 0) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${input.institutionId}_rule_1`,
        institutionId: input.institutionId,
        type: RecommendationType.ContactStaleLead,
        priority: RecommendationPriority.High,
        ruleId: "rule_1",
        title: "Bekleyen yeni talepleri arayın",
        message: `${staleNewLeads.length} yeni talep 24 saatten uzun süredir yanıt bekliyor. Hemen iletişime geçmenizi öneririz.`,
        createdAt: input.nowIso,
      }),
    );
  }

  const pendingCount =
    input.leadCounters?.pending ??
    input.leads.filter((lead) => lead.status === LeadStatus.New).length;
  if (pendingCount > PENDING_FOLLOW_UP_THRESHOLD) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${input.institutionId}_rule_2`,
        institutionId: input.institutionId,
        type: RecommendationType.PrioritizeFollowUp,
        priority: RecommendationPriority.High,
        ruleId: "rule_2",
        title: "Talep takibini önceliklendirin",
        message: `${pendingCount} bekleyen (yeni) talep var. Yanıt sırasını netleştirmenizi öneririz.`,
        createdAt: input.nowIso,
      }),
    );
  }

  const enrolledThisMonth = countEnrolledThisMonth(input.leads, input.nowIso);
  if (enrolledThisMonth === 0) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${input.institutionId}_rule_3`,
        institutionId: input.institutionId,
        type: RecommendationType.ReviewResponseTimes,
        priority: RecommendationPriority.Medium,
        ruleId: "rule_3",
        title: "Yanıt sürelerini gözden geçirin",
        message:
          "Bu ay henüz kayıt (enrolled) sonucu yok. İlk yanıt sürenizi ve talep hattı akışınızı gözden geçirmenizi öneririz.",
        createdAt: input.nowIso,
      }),
    );
  }
}

/**
 * Analyzes public profile / detail-page fields and emits actionable sales tips.
 */
function pushProfileRecommendations(
  recommendations: OwnerRecommendation[],
  input: {
    institutionId: string;
    institution: Institution;
    nowIso: string;
  },
): void {
  const { institution, institutionId, nowIso } = input;
  const completeness = computeInstitutionProfileCompleteness(institution);
  const galleryCount = institution.galleryImages?.length ?? 0;
  const shortDescription = institution.shortDescription.trim();
  const longDescription = institution.longDescription?.trim() ?? "";
  const hasWhatsapp = Boolean(institution.contact.whatsappNumber?.trim());
  const hasPhone = Boolean(institution.contact.phone?.trim());
  const hasEmail = Boolean(institution.contact.email?.trim());
  const hasWebsite = Boolean(institution.socialLinks.websiteUrl?.trim());
  const hasInstagram = Boolean(institution.socialLinks.instagramUrl?.trim());
  const hasAnySocial = Boolean(
    institution.socialLinks.facebookUrl?.trim() ||
      institution.socialLinks.instagramUrl?.trim() ||
      institution.socialLinks.twitterUrl?.trim() ||
      institution.socialLinks.youtubeUrl?.trim() ||
      institution.socialLinks.linkedinUrl?.trim(),
  );
  const hasPrograms =
    Boolean(institution.programsSummary?.trim()) ||
    (institution.educationPrograms?.length ?? 0) > 0;
  const hasAmenities = (institution.amenities?.length ?? 0) > 0;
  const hasFaqs = (institution.faqs?.length ?? 0) > 0;
  const hasWorkingHours = Boolean(institution.workingHours);
  const hasBrochure = Boolean(institution.brochurePdfUrl?.trim());
  const hasPromoVideo = Boolean(institution.promoVideoUrl?.trim());
  const hasMaps = Boolean(institution.location.googleMapsUrl?.trim());
  const hasLogo = Boolean(institution.logoUrl?.trim());
  const hasCover = Boolean(institution.coverImageUrl?.trim());

  if (completeness.scorePercent < 80) {
    const missingLabels = completeness.completeness.missingSections
      .slice(0, 3)
      .map((section) => section.label)
      .join(", ");
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_4`,
        institutionId,
        type: RecommendationType.CompleteProfile,
        priority: RecommendationPriority.High,
        ruleId: "rule_4",
        title: "Profil tamamlanma oranını yükseltin",
        message: `Profil tamamlanma oranınız %${completeness.scorePercent}. Öncelikli eksikler: ${missingLabels}. ${completeness.completeness.nextActionHint}`,
        createdAt: nowIso,
      }),
    );
  }

  if (!hasLogo) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_logo`,
        institutionId,
        type: RecommendationType.UploadPhotos,
        priority: RecommendationPriority.Medium,
        ruleId: "rule_logo",
        title: "Kurum logosu ekleyin",
        message:
          "Logo, arama sonuçları ve profil kartında marka tanınırlığını artırır. Profil sayfasından logo yükleyin.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasCover) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_cover`,
        institutionId,
        type: RecommendationType.UploadPhotos,
        priority: RecommendationPriority.Medium,
        ruleId: "rule_cover",
        title: "Kapak görseli ekleyin",
        message:
          "Kapak görseli kurum detay sayfasının ilk izlenimini belirler. Kampüs veya sınıf atmosferini gösteren bir görsel ekleyin.",
        createdAt: nowIso,
      }),
    );
  }

  if (galleryCount < MIN_GALLERY_IMAGES) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_5`,
        institutionId,
        type: RecommendationType.UploadPhotos,
        priority: galleryCount === 0 ? RecommendationPriority.High : RecommendationPriority.Medium,
        ruleId: "rule_5",
        title:
          galleryCount === 0
            ? "Galeriye fotoğraf ekleyin"
            : `Galeriye en az ${MIN_GALLERY_IMAGES} fotoğraf ekleyin`,
        message:
          galleryCount === 0
            ? "Kurum detay sayfasında galeri boş. Veliler mekanı görmeden iletişim kurmaya daha az eğilimlidir; en az 3 fotoğraf ekleyin."
            : `Galeride ${galleryCount} görsel var. Daha fazla fotoğraf (sınıf, bahçe, etkinlik) dönüşümü artırır.`,
        createdAt: nowIso,
      }),
    );
  }

  if (shortDescription.length < MIN_SHORT_DESCRIPTION_CHARS) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_short_desc`,
        institutionId,
        type: RecommendationType.CompleteProfile,
        priority: RecommendationPriority.High,
        ruleId: "rule_short_desc",
        title: "Kısa açıklamayı güçlendirin",
        message:
          "Kısa açıklama arama kartlarında görünür. Kurumunuzu 1–2 cümlede net anlatan güncel bir özet yazın.",
        createdAt: nowIso,
      }),
    );
  }

  if (longDescription.length < MIN_LONG_DESCRIPTION_CHARS) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_long_desc`,
        institutionId,
        type: RecommendationType.CompleteProfile,
        priority: RecommendationPriority.Medium,
        ruleId: "rule_long_desc",
        title: "Detaylı açıklama ekleyin",
        message:
          "Kurum detay sayfasındaki uzun açıklama eksik veya çok kısa. Eğitim yaklaşımı, yaş grubu ve farkınızı anlatan bir metin ekleyin.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasPhone && !hasEmail) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_contact`,
        institutionId,
        type: RecommendationType.AddContactChannel,
        priority: RecommendationPriority.High,
        ruleId: "rule_contact",
        title: "İletişim bilgisini tamamlayın",
        message:
          "Profilde telefon veya e-posta yok. Veliler bilgi talebi dışında da sizi arayabilmeli.",
        createdAt: nowIso,
      }),
    );
  } else if (!hasWhatsapp) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_whatsapp`,
        institutionId,
        type: RecommendationType.AddContactChannel,
        priority: RecommendationPriority.Medium,
        ruleId: "rule_whatsapp",
        title: "WhatsApp hattı ekleyin",
        message:
          "WhatsApp, velilerin hızlı dönüş aldığı kanal. Profil iletişimine WhatsApp numarası ekleyerek yanıt oranını artırabilirsiniz.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasWebsite) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_website`,
        institutionId,
        type: RecommendationType.AddTrustSignals,
        priority: RecommendationPriority.Medium,
        ruleId: "rule_website",
        title: "Web sitesi bağlantısı ekleyin",
        message:
          "Web sitesi, kurum detayında güven sinyali oluşturur. Resmi sitenizi profil sosyal bağlantılarına ekleyin.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasAnySocial) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_social`,
        institutionId,
        type: RecommendationType.AddTrustSignals,
        priority: RecommendationPriority.Medium,
        ruleId: "rule_social",
        title: "Sosyal medya hesaplarını ekleyin",
        message:
          "Instagram veya diğer sosyal hesaplar velilerin kurum yaşamını görmesini sağlar. En az bir sosyal bağlantı ekleyin.",
        createdAt: nowIso,
      }),
    );
  } else if (!hasInstagram) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_instagram`,
        institutionId,
        type: RecommendationType.AddTrustSignals,
        priority: RecommendationPriority.Low,
        ruleId: "rule_instagram",
        title: "Instagram hesabını bağlayın",
        message:
          "Eğitim kurumlarında Instagram en çok incelenen kanallardan biri. Hesabınız varsa profile ekleyin.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasPrograms) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_programs`,
        institutionId,
        type: RecommendationType.EnrichPrograms,
        priority: RecommendationPriority.High,
        ruleId: "rule_programs",
        title: "Eğitim programlarını tanımlayın",
        message:
          "Kurum detayında program bilgisi yok. Eğitim programları ve program özeti ekleyerek doğru velilerin sizi bulmasını kolaylaştırın.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasAmenities) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_amenities`,
        institutionId,
        type: RecommendationType.EnrichPrograms,
        priority: RecommendationPriority.Low,
        ruleId: "rule_amenities",
        title: "Kurum özelliklerini işaretleyin",
        message:
          "Servis, yemek, bahçe gibi özellikler filtre ve karşılaştırma kararlarını etkiler. Profildeki kurum özelliklerini güncelleyin.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasWorkingHours) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_hours`,
        institutionId,
        type: RecommendationType.CompleteProfile,
        priority: RecommendationPriority.Medium,
        ruleId: "rule_hours",
        title: "Çalışma saatlerini ekleyin",
        message:
          "Çalışma saatleri kurum detayında görünür. Velilerin ziyaret planlaması için haftalık saatleri doldurun.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasFaqs) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_faqs`,
        institutionId,
        type: RecommendationType.CompleteProfile,
        priority: RecommendationPriority.Low,
        ruleId: "rule_faqs",
        title: "SSS (sık sorulan sorular) ekleyin",
        message:
          "Ücret, kayıt ve yaş grubu gibi sık soruları SSS olarak eklemek bilgi talebi öncesi güven oluşturur.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasBrochure) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_brochure`,
        institutionId,
        type: RecommendationType.AddTrustSignals,
        priority: RecommendationPriority.Low,
        ruleId: "rule_brochure",
        title: "Broşür PDF’i yükleyin",
        message:
          "İndirilebilir broşür, ciddi aday velilerin kurumunuzu paylaşmasını ve değerlendirmesini kolaylaştırır.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasPromoVideo) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_video`,
        institutionId,
        type: RecommendationType.AddTrustSignals,
        priority: RecommendationPriority.Low,
        ruleId: "rule_video",
        title: "Tanıtım videosu ekleyin",
        message:
          "YouTube veya Vimeo tanıtım videosu kurum detay sayfasında etkileşimi artırır. Varsa video bağlantısını ekleyin.",
        createdAt: nowIso,
      }),
    );
  }

  if (!hasMaps) {
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_maps`,
        institutionId,
        type: RecommendationType.CompleteProfile,
        priority: RecommendationPriority.Medium,
        ruleId: "rule_maps",
        title: "Google Maps konum bağlantısı ekleyin",
        message:
          "Konum bağlantısı, velilerin yolu kolay bulmasını sağlar. Profil konumuna Google Maps linki ekleyin.",
        createdAt: nowIso,
      }),
    );
  }

  if (!isInstitutionVerified(institution.verification)) {
    const statusNote =
      institution.verification === InstitutionVerification.Pending
        ? "Doğrulama süreciniz devam ediyor olabilir."
        : "Doğrulanmış rozeti, arama sonuçlarında güven sinyali verir.";
    recommendations.push(
      createOwnerRecommendation({
        id: `rec_${institutionId}_rule_verify`,
        institutionId,
        type: RecommendationType.AddTrustSignals,
        priority: RecommendationPriority.Medium,
        ruleId: "rule_verify",
        title: "Kurum doğrulamasını tamamlayın",
        message: `${statusNote} Profil bilgilerinizi güncel tutarak doğrulama/onay sürecini hızlandırın.`,
        createdAt: nowIso,
      }),
    );
  }
}

function countEnrolledThisMonth(leads: readonly Lead[], nowIso: string): number {
  const now = new Date(nowIso);
  if (Number.isNaN(now.getTime())) {
    return 0;
  }
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  return leads.filter((lead) => {
    if (lead.status !== LeadStatus.Enrolled) return false;
    const updated = new Date(lead.updatedAt);
    if (Number.isNaN(updated.getTime())) return false;
    return updated.getUTCFullYear() === year && updated.getUTCMonth() === month;
  }).length;
}

function sortRecommendations(
  recommendations: readonly OwnerRecommendation[],
): OwnerRecommendation[] {
  const priorityRank: Record<RecommendationPriority, number> = {
    [RecommendationPriority.High]: 0,
    [RecommendationPriority.Medium]: 1,
    [RecommendationPriority.Low]: 2,
  };

  return [...recommendations].sort((left, right) => {
    const byPriority = priorityRank[left.priority] - priorityRank[right.priority];
    if (byPriority !== 0) return byPriority;
    return left.ruleId.localeCompare(right.ruleId);
  });
}
