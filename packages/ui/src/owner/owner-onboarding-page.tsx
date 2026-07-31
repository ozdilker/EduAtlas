import { Container } from "../components/container";
import { cn } from "../lib/cn";
import {
  createOwnerOnboardingViewData,
  type OwnerOnboardingStepView,
  type OwnerOnboardingViewData,
} from "./owner-onboarding-content";
import type {
  OwnerProfileCompletenessView,
  OwnerRecommendationsView,
} from "./owner-portal-content";
import { OwnerPortalShell } from "./owner-portal-shell";
import { OwnerProfileCompletenessCard } from "./owner-profile-completeness-card";
import { OwnerRecommendationsWidget } from "./owner-recommendations-widget";

export type OwnerOnboardingPageProps = {
  institutionName: string;
  institutionLogoUrl?: string;
  publicProfileHref: string;
  profileCompleteness: OwnerProfileCompletenessView;
  recommendations: OwnerRecommendationsView;
  className?: string;
};

export type OwnerOnboardingViewProps = {
  data: OwnerOnboardingViewData;
  className?: string;
};

function StepStatus({ completed }: { completed: boolean }) {
  return (
    <span
      className={cn(
        "ea-owner-onboarding__status",
        completed ? "ea-owner-onboarding__status--done" : "ea-owner-onboarding__status--todo",
      )}
      aria-hidden="true"
    >
      {completed ? "✓" : "○"}
    </span>
  );
}

function OnboardingStepRow({ step }: { step: OwnerOnboardingStepView }) {
  return (
    <li
      className={cn(
        "ea-owner-onboarding__step",
        step.completed && "ea-owner-onboarding__step--done",
      )}
    >
      <div className="ea-owner-onboarding__step-main">
        <StepStatus completed={step.completed} />
        <div className="ea-owner-onboarding__step-copy">
          <h3 className="ea-owner-onboarding__step-title">{step.title}</h3>
          <p className="ea-owner-onboarding__step-text">{step.description}</p>
          {step.placeholder ? (
            <p className="ea-owner-onboarding__step-note" role="note">
              Yer tutucu adım — medya yükleme bu sprintte yoktur.
            </p>
          ) : null}
        </div>
      </div>
      <a
        href={step.href}
        className="ea-owner-onboarding__step-cta"
        aria-label={`${step.title}: ${step.ctaLabel}`}
      >
        {step.ctaLabel}
      </a>
    </li>
  );
}

/**
 * Institution onboarding checklist — presentation only; reuses completeness + recommendations.
 */
export function OwnerOnboardingView({ data, className }: OwnerOnboardingViewProps) {
  const checklistSteps = data.steps.filter((step) => step.id !== "ready");
  const readyStep = data.steps.find((step) => step.id === "ready");

  return (
    <div className={cn("ea-owner-onboarding", className)}>
      <header className="ea-owner-portal__hero">
        <p className="ea-owner-portal__eyebrow">Kurum kurulumu</p>
        <h1 className="ea-owner-portal__title">Hoş geldiniz, {data.institutionName}</h1>
        <p className="ea-owner-portal__description">
          Sahiplenilen profilinizi taleplere hazırlayın. Adımlar mevcut profil formuna bağlanır;
          formlar burada tekrarlanmaz.
        </p>
      </header>

      <section
        className="ea-owner-onboarding__progress"
        aria-labelledby="owner-onboarding-progress-heading"
      >
        <div className="ea-owner-onboarding__progress-copy">
          <h2 id="owner-onboarding-progress-heading" className="ea-owner-onboarding__section-title">
            Kurulum ilerlemesi
          </h2>
          <p className="ea-owner-onboarding__progress-meta" aria-live="polite">
            {data.actionableCompletedCount} / {data.actionableTotalCount} temel adım tamamlandı
          </p>
        </div>
        <div
          className="ea-owner-completeness__meter ea-owner-onboarding__meter"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={data.actionableTotalCount}
          aria-valuenow={data.actionableCompletedCount}
          aria-label="Kurulum adım ilerlemesi"
        >
          <span
            className="ea-owner-completeness__meter-fill"
            style={{
              width: `${Math.round(
                (data.actionableCompletedCount / Math.max(data.actionableTotalCount, 1)) * 100,
              )}%`,
            }}
          />
        </div>
      </section>

      {data.isReady ? (
        <section
          className="ea-owner-onboarding__celebration"
          aria-labelledby="owner-onboarding-ready-heading"
          role="status"
        >
          <h2 id="owner-onboarding-ready-heading" className="ea-owner-onboarding__celebrate-title">
            Tebrikler — taleplere hazırsınız
          </h2>
          <p className="ea-owner-onboarding__celebrate-text">
            Temel profil adımları tamamlandı. Gelen bilgi taleplerini yanıtlamaya ve genel
            profilinizi paylaşmaya başlayabilirsiniz.
          </p>
          <div className="ea-owner-onboarding__celebrate-actions">
            <a href="/owner/leads" className="ea-owner-onboarding__primary-link">
              Talepleri gör
            </a>
            <a
              href={data.publicProfileHref}
              className="ea-owner-portal__public-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Genel profili aç
            </a>
          </div>
        </section>
      ) : null}

      <section
        className="ea-owner-onboarding__checklist"
        aria-labelledby="owner-onboarding-checklist-heading"
      >
        <h2 id="owner-onboarding-checklist-heading" className="ea-owner-onboarding__section-title">
          Kurulum kontrol listesi
        </h2>
        <ol className="ea-owner-onboarding__steps">
          {checklistSteps.map((step) => (
            <OnboardingStepRow key={step.id} step={step} />
          ))}
          {readyStep ? <OnboardingStepRow step={readyStep} /> : null}
        </ol>
      </section>

      <div className="ea-owner-onboarding__reuse">
        <OwnerProfileCompletenessCard completeness={data.profileCompleteness} />
        <OwnerRecommendationsWidget
          recommendations={{
            ...data.recommendations,
            title: "Önerilen sonraki adımlar",
            description:
              "Profil ve talep analizi — salt okunur. Onboarding’e özel yeni motor yoktur.",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Full-page owner onboarding experience.
 */
export function OwnerOnboardingPage({
  institutionName,
  institutionLogoUrl,
  publicProfileHref,
  profileCompleteness,
  recommendations,
  className,
}: OwnerOnboardingPageProps) {
  const data = createOwnerOnboardingViewData({
    institutionName,
    publicProfileHref,
    profileCompleteness,
    recommendations,
  });

  return (
    <OwnerPortalShell
      institutionName={institutionName}
      institutionLogoUrl={institutionLogoUrl}
      activeTab="onboarding"
      className={className}
    >
      <Container size="xl" className="ea-owner-portal">
        <OwnerOnboardingView data={data} />
      </Container>
    </OwnerPortalShell>
  );
}
