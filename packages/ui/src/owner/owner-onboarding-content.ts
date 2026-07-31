import type {
  OwnerProfileCompletenessSectionView,
  OwnerProfileCompletenessView,
  OwnerRecommendationsView,
} from "./owner-portal-content";

export type OwnerOnboardingStepId =
  | "welcome"
  | "logo"
  | "gallery"
  | "website"
  | "description"
  | "contact"
  | "ready";

export type OwnerOnboardingStepView = {
  id: OwnerOnboardingStepId;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  /** True when the destination is a placeholder surface (no upload yet). */
  placeholder?: boolean;
  ctaLabel: string;
};

export type OwnerOnboardingViewData = {
  institutionName: string;
  publicProfileHref: string;
  profileCompleteness: OwnerProfileCompletenessView;
  recommendations: OwnerRecommendationsView;
  steps: readonly OwnerOnboardingStepView[];
  actionableCompletedCount: number;
  actionableTotalCount: number;
  isReady: boolean;
};

const ACTIONABLE_SECTION_MAP: readonly {
  id: Exclude<OwnerOnboardingStepId, "welcome" | "ready">;
  sectionId: string;
  title: string;
  description: string;
  href: string;
  placeholder?: boolean;
  ctaLabel: string;
}[] = [
  {
    id: "logo",
    sectionId: "logo",
    title: "Logo yükleyin",
    description: "Kurum kimliğinizi güçlendirmek için logo ekleyin.",
    href: "/owner/profile#owner-profile-logo",
    placeholder: true,
    ctaLabel: "Logoya git",
  },
  {
    id: "gallery",
    sectionId: "gallery",
    title: "İlk galeri görseli",
    description: "Kapak veya kampüs görseli ekleyin. Yükleme yüzeyi şimdilik yer tutucudur.",
    href: "/owner/profile#owner-profile-gallery",
    placeholder: true,
    ctaLabel: "Galeriye git",
  },
  {
    id: "website",
    sectionId: "website",
    title: "Web sitesi ekleyin",
    description: "Ailelerin kurumunuzu doğrulaması için web adresinizi yayınlayın.",
    href: "/owner/profile#owner-profile-website",
    ctaLabel: "Web sitesini ekle",
  },
  {
    id: "description",
    sectionId: "description",
    title: "Açıklama yazın",
    description: "Kısa ve uzun açıklamayı doldurarak güven verin.",
    href: "/owner/profile#owner-profile-description",
    ctaLabel: "Açıklamayı düzenle",
  },
  {
    id: "contact",
    sectionId: "contact",
    title: "İletişim bilgilerini doğrulayın",
    description: "Telefon ve e-posta güncel olsun ki talepler size ulaşsın.",
    href: "/owner/profile#owner-profile-contact",
    ctaLabel: "İletişimi doğrula",
  },
] as const;

function sectionById(
  sections: readonly OwnerProfileCompletenessSectionView[],
  sectionId: string,
): OwnerProfileCompletenessSectionView | undefined {
  return sections.find((section) => section.id === sectionId);
}

/**
 * Builds onboarding checklist steps from Profile Completeness — no extra scoring logic.
 */
export function buildOwnerOnboardingSteps(
  completeness: OwnerProfileCompletenessView,
): readonly OwnerOnboardingStepView[] {
  const actionable = ACTIONABLE_SECTION_MAP.map((item) => {
    const section = sectionById(completeness.sections, item.sectionId);
    const completed = section?.completed ?? false;
    return {
      id: item.id,
      title: item.title,
      description: section?.hint ?? item.description,
      href: item.href,
      completed,
      ...(item.placeholder ? { placeholder: true } : {}),
      ctaLabel: completed ? "Gözden geçir" : item.ctaLabel,
    } satisfies OwnerOnboardingStepView;
  });

  const actionableCompletedCount = actionable.filter((step) => step.completed).length;
  const isReady = actionableCompletedCount === actionable.length;

  return [
    {
      id: "welcome",
      title: "Hoş geldiniz",
      description:
        "Kurumunuz sahiplenildi. Taleplere hazır olmak için aşağıdaki adımları tamamlayın.",
      href: "/owner/onboarding",
      completed: true,
      ctaLabel: "Kuruluma başla",
    },
    ...actionable,
    {
      id: "ready",
      title: "Taleplere hazırsınız",
      description: isReady
        ? "Temel profil adımları tamam. Gelen talepleri karşılamaya başlayabilirsiniz."
        : "Temel adımlar tamamlandığında burada kutlama göreceksiniz.",
      href: "/owner/leads",
      completed: isReady,
      ctaLabel: isReady ? "Talepleri aç" : "Eksikleri tamamla",
    },
  ];
}

export function createOwnerOnboardingViewData(input: {
  institutionName: string;
  publicProfileHref: string;
  profileCompleteness: OwnerProfileCompletenessView;
  recommendations: OwnerRecommendationsView;
}): OwnerOnboardingViewData {
  const steps = buildOwnerOnboardingSteps(input.profileCompleteness);
  const actionable = steps.filter((step) => step.id !== "welcome" && step.id !== "ready");
  const actionableCompletedCount = actionable.filter((step) => step.completed).length;

  return {
    institutionName: input.institutionName,
    publicProfileHref: input.publicProfileHref,
    profileCompleteness: input.profileCompleteness,
    recommendations: input.recommendations,
    steps,
    actionableCompletedCount,
    actionableTotalCount: actionable.length,
    isReady: actionableCompletedCount === actionable.length && actionable.length > 0,
  };
}
