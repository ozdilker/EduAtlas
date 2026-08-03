import { BillingPeriod } from "./subscription";

export function computeSubscriptionPeriodEnd(start: Date, period: BillingPeriod): Date {
  const end = new Date(start.getTime());
  if (period === BillingPeriod.Yearly) {
    end.setUTCDate(end.getUTCDate() + 365);
  } else {
    end.setUTCDate(end.getUTCDate() + 30);
  }
  return end;
}
