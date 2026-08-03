"use client";

import { useRef, useState } from "react";
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
  checkoutEnabled: boolean;
  plans: readonly OwnerBillingPlanCardView[];
}>;

export type OwnerBillingCheckoutResult =
  | { readonly ok: true; readonly merchantOid: string; readonly iframeToken: string }
  | { readonly ok: false; readonly message: string };

export type OwnerBillingPageProps = {
  data: OwnerBillingPageData;
  onStartCheckout?: (input: {
    planCode: string;
    billingPeriod: "monthly" | "yearly";
  }) => Promise<OwnerBillingCheckoutResult>;
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
 * Owner plan picker — PayTR iframe checkout when configured.
 */
export function OwnerBillingPage({ data, onStartCheckout, className }: OwnerBillingPageProps) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeToken, setIframeToken] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function handlePurchase(plan: OwnerBillingPlanCardView) {
    if (!data.checkoutEnabled || !onStartCheckout || plan.code === "free" || plan.isCurrent) {
      return;
    }
    setError(null);
    setBusyCode(plan.code);
    try {
      const result = await onStartCheckout({ planCode: plan.code, billingPeriod: period });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const isYearly = period === "yearly" && plan.yearlyPriceTry > 0;
      const amount = isYearly ? plan.yearlyPriceTry : plan.monthlyPriceTry;
      setModalTitle(
        `${plan.name} · ${isYearly ? "Yıllık" : "Aylık"} · ${formatTry(amount)}`,
      );
      setIframeToken(result.iframeToken);
      dialogRef.current?.showModal();
    } catch {
      setError("Ödeme başlatılamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusyCode(null);
    }
  }

  function closeModal() {
    dialogRef.current?.close();
    setIframeToken(null);
  }

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

          {!data.checkoutEnabled && data.paymentComingSoonMessage ? (
            <p className="ea-owner-billing__muted" role="status">
              {data.paymentComingSoonMessage}
            </p>
          ) : null}

          {error ? (
            <p className="ea-owner-billing__error" role="alert">
              {error}
            </p>
          ) : null}

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
              const isFree = plan.code === "free";
              const canBuy =
                data.checkoutEnabled &&
                Boolean(onStartCheckout) &&
                !isFree &&
                !plan.isCurrent &&
                primaryAmount > 0;
              let ctaLabel = "Ödeme yakında";
              if (plan.isCurrent) ctaLabel = "Mevcut paket";
              else if (isFree) ctaLabel = "Ücretsiz";
              else if (canBuy) ctaLabel = busyCode === plan.code ? "Hazırlanıyor…" : "Satın al";

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
                    disabled={!canBuy || busyCode === plan.code}
                    aria-disabled={!canBuy || busyCode === plan.code}
                    title={
                      canBuy
                        ? undefined
                        : data.paymentComingSoonMessage || undefined
                    }
                    onClick={() => void handlePurchase(plan)}
                  >
                    {ctaLabel}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>

      <dialog
        ref={dialogRef}
        className="ea-owner-billing__pay-dialog"
        onClose={() => setIframeToken(null)}
      >
        <div className="ea-owner-billing__pay-dialog-panel">
          <div className="ea-owner-billing__pay-dialog-header">
            <h2 className="ea-owner-billing__pay-dialog-title">{modalTitle || "Ödeme"}</h2>
            <button
              type="button"
              className="ea-button ea-button--secondary"
              onClick={closeModal}
            >
              Kapat
            </button>
          </div>
          {iframeToken ? (
            <iframe
              title="PayTR güvenli ödeme"
              src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
              className="ea-owner-billing__pay-iframe"
              allow="payment"
            />
          ) : null}
        </div>
      </dialog>
    </OwnerPortalShell>
  );
}
