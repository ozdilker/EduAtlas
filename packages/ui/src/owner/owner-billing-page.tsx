import { Container } from "../components/container";
import { OwnerPortalShell } from "./owner-portal-shell";

export type OwnerBillingPlanCardView = Readonly<{
  code: string;
  name: string;
  description?: string;
  monthlyPriceTry: number;
  yearlyPriceTry: number;
  trialDays: number;
  isCurrent: boolean;
  highlight?: boolean;
}>;

export type OwnerBillingPageData = Readonly<{
  institutionName: string;
  institutionLogoUrl?: string;
  currentPlanCode: string;
  currentPlanName: string;
  paymentComingSoonMessage: string;
  plans: readonly OwnerBillingPlanCardView[];
}>;

export type OwnerBillingPageProps = {
  data: OwnerBillingPageData;
  className?: string;
};

function formatTry(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Owner plan picker — checkout disabled until payment provider is live.
 */
export function OwnerBillingPage({ data, className }: OwnerBillingPageProps) {
  return (
    <OwnerPortalShell
      institutionName={data.institutionName}
      institutionLogoUrl={data.institutionLogoUrl}
      activeTab="billing"
      className={className}
    >
      <Container size="xl" className="ea-owner-portal">
        <div className="ea-owner-billing">
          <header className="ea-owner-portal__hero">
            <p className="ea-owner-portal__eyebrow">Kurum paneli</p>
            <h1 className="ea-owner-portal__title">Üyelik paketleri</h1>
            <p className="ea-owner-portal__description">
              Aktif paket: <strong>{data.currentPlanName}</strong>
            </p>
          </header>

          <p className="ea-owner-billing__muted" role="status">
            {data.paymentComingSoonMessage}
          </p>

          <ul className="ea-owner-billing__grid">
            {data.plans.map((plan) => (
              <li
                key={plan.code}
                className={
                  plan.isCurrent
                    ? "ea-owner-billing__card ea-owner-billing__card--current"
                    : "ea-owner-billing__card"
                }
              >
                <h2>{plan.name}</h2>
                {plan.description ? (
                  <p className="ea-owner-billing__muted">{plan.description}</p>
                ) : null}
                <p className="ea-owner-billing__price">{formatTry(plan.monthlyPriceTry)} / ay</p>
                {plan.yearlyPriceTry > 0 ? (
                  <p className="ea-owner-billing__muted">{formatTry(plan.yearlyPriceTry)} / yıl</p>
                ) : null}
                {plan.trialDays > 0 ? (
                  <p className="ea-owner-billing__muted">{plan.trialDays} gün ücretsiz deneme</p>
                ) : null}
                <button
                  type="button"
                  className="ea-button ea-button--primary ea-owner-billing__cta"
                  disabled
                  aria-disabled="true"
                  title={data.paymentComingSoonMessage}
                >
                  {plan.isCurrent ? "Mevcut paket" : "Ödeme yakında"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </OwnerPortalShell>
  );
}
