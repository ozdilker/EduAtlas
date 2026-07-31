"use client";

import { useState } from "react";
import { Container } from "../components/container";
import { cn } from "../lib/cn";
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

type BillingPeriod = "monthly" | "yearly";

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
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

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

          <div
            className="ea-owner-billing__period"
            role="group"
            aria-label="Fatura dönemi"
          >
            <div className="ea-owner-billing__period-track">
              <span
                className={cn(
                  "ea-owner-billing__period-thumb",
                  period === "yearly" && "ea-owner-billing__period-thumb--yearly",
                )}
                aria-hidden="true"
              />
              <button
                type="button"
                className={cn(
                  "ea-owner-billing__period-option",
                  period === "monthly" && "ea-owner-billing__period-option--active",
                )}
                aria-pressed={period === "monthly"}
                onClick={() => setPeriod("monthly")}
              >
                Aylık
              </button>
              <button
                type="button"
                className={cn(
                  "ea-owner-billing__period-option",
                  period === "yearly" && "ea-owner-billing__period-option--active",
                )}
                aria-pressed={period === "yearly"}
                onClick={() => setPeriod("yearly")}
              >
                Yıllık
              </button>
            </div>
          </div>

          <ul className="ea-owner-billing__grid">
            {data.plans.map((plan) => {
              const isYearly = period === "yearly" && plan.yearlyPriceTry > 0;
              const primaryAmount = isYearly ? plan.yearlyPriceTry : plan.monthlyPriceTry;
              const primarySuffix = isYearly ? "/ yıl" : "/ ay";
              const monthlyEquivalent =
                isYearly && plan.yearlyPriceTry > 0
                  ? Math.round(plan.yearlyPriceTry / 12)
                  : null;

              return (
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
                  <p className="ea-owner-billing__price">
                    {formatTry(primaryAmount)} {primarySuffix}
                  </p>
                  {monthlyEquivalent !== null ? (
                    <p className="ea-owner-billing__muted">
                      Aylık karşılık: {formatTry(monthlyEquivalent)}
                    </p>
                  ) : plan.yearlyPriceTry > 0 ? (
                    <p className="ea-owner-billing__muted">
                      Yıllık: {formatTry(plan.yearlyPriceTry)}
                    </p>
                  ) : null}
                  {plan.trialDays > 0 ? (
                    <p className="ea-owner-billing__muted">
                      {plan.trialDays} gün ücretsiz deneme
                    </p>
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
              );
            })}
          </ul>
        </div>
      </Container>
    </OwnerPortalShell>
  );
}
