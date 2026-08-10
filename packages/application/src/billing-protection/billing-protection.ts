import {
  type BillingProtection,
  type BillingProtectionSource,
  type BillingProtectionState,
  type CreateBillingProtectionInput,
  createBillingProtection,
  createDefaultBillingProtection,
  resolveEffectiveBillingProtectionState,
} from "@eduatlas/domain";
import type { BillingProtectionRepository } from "./billing-protection-repository";
import { BillingProtectionError } from "./errors";
import { type BillingProtectedOperation, isBillingOperationBlocked } from "./operations";

export type BillingProtectionDependencies = {
  /**
   * Optional — when omitted, protection is treated as NORMAL (fail-open).
   * Production web/server code should always wire a repository.
   */
  readonly billingProtectionRepository?: BillingProtectionRepository | null;
};

/**
 * Reads protection state. Missing document → NORMAL.
 * Read failures → NORMAL (fail-open) with a warning log.
 */
export async function getBillingProtection(
  deps: BillingProtectionDependencies = {},
): Promise<BillingProtection> {
  const repo = deps.billingProtectionRepository;
  if (!repo) {
    return createDefaultBillingProtection();
  }
  try {
    const raw = await repo.get();
    if (!raw) {
      return createDefaultBillingProtection();
    }
    return raw;
  } catch (error) {
    console.warn(
      "[eduatlas] billing protection read failed; treating as NORMAL:",
      error instanceof Error ? error.message : error,
    );
    return createDefaultBillingProtection();
  }
}

export type SetBillingProtectionInput = CreateBillingProtectionInput & {
  readonly state: BillingProtectionState;
  readonly source?: BillingProtectionSource;
  readonly reason?: string;
};

export type SetBillingProtectionDependencies = {
  readonly billingProtectionRepository: BillingProtectionRepository;
};

/**
 * Manual / admin write path for testing and overrides.
 * Does not talk to Cloud Billing or Pub/Sub.
 */
export async function setBillingProtection(
  input: SetBillingProtectionInput,
  deps: SetBillingProtectionDependencies,
): Promise<BillingProtection> {
  const previous = await deps.billingProtectionRepository.get();
  const next = createBillingProtection({
    ...input,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    source: input.source ?? "manual",
    previousState: input.previousState ?? previous?.state,
  });
  return deps.billingProtectionRepository.save(next);
}

/**
 * Throws BillingProtectionError when the effective state blocks the operation.
 * Fail-open when repository is missing or unreadable (via getBillingProtection).
 */
export async function assertOperationAllowed(
  operation: BillingProtectedOperation,
  deps: BillingProtectionDependencies = {},
): Promise<void> {
  const protection = await getBillingProtection(deps);
  const effective = resolveEffectiveBillingProtectionState(protection);
  if (!isBillingOperationBlocked(effective, operation)) {
    return;
  }

  console.warn(
    JSON.stringify({
      event: "billing_protection_blocked",
      operation,
      protectionState: effective,
      reason: protection.reason ?? null,
      timestamp: new Date().toISOString(),
    }),
  );

  throw new BillingProtectionError({
    operation,
    protectionState: effective,
    message: humanMessageForBlockedOperation(operation, effective),
  });
}

function humanMessageForBlockedOperation(
  operation: BillingProtectedOperation,
  state: BillingProtectionState,
): string {
  switch (operation) {
    case "IMPORT_DUPLICATE_SCAN":
      return `Katalog karşılaştırma taraması maliyet koruması (${state}) nedeniyle geçici olarak kapalı. İçe aktarma satır içi kontrollerle devam edebilir; tam katalog eşleştirmesi şu an yapılamıyor.`;
    case "SITEMAP_SCAN":
      return `Sitemap katalog taraması maliyet koruması (${state}) nedeniyle atlandı.`;
    case "ACQUISITION_FULL_SCAN":
      return `Acquisition tam katalog taraması maliyet koruması (${state}) nedeniyle kapalı. Sınırlı liste görünümü kullanılabilir.`;
    case "OUTREACH_PREPARE":
      return `Kampanya hazırlama / segment önizleme maliyet koruması (${state}) nedeniyle geçici olarak kapalı.`;
    case "ADMIN_FREE_TEXT":
      return `Yönetici serbest metin araması maliyet koruması (${state}) nedeniyle geçici olarak kapalı. Filtreli / sayfalı listeleri kullanın.`;
    case "AI_HEAVY_OPERATION":
      return `AI / harici ağır işlemler maliyet koruması (${state}) nedeniyle kapalı.`;
    default:
      return `İşlem ${operation} maliyet koruması (${state}) nedeniyle engellendi.`;
  }
}
