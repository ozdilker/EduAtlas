import type { BillingProtection } from "@eduatlas/domain";

export interface BillingProtectionRepository {
  get(): Promise<BillingProtection | null>;
  save(protection: BillingProtection): Promise<BillingProtection>;
}
