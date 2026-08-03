import type { PaymentOrder } from "@eduatlas/domain";

export interface PaymentOrderRepository {
  getByMerchantOid(merchantOid: string): Promise<PaymentOrder | null>;
  save(order: PaymentOrder): Promise<PaymentOrder>;
}
