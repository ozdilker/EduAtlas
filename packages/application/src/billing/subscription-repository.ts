import type { InstitutionSubscription } from "@eduatlas/domain";

export interface InstitutionSubscriptionRepository {
  getByInstitutionId(institutionId: string): Promise<InstitutionSubscription | null>;
  save(subscription: InstitutionSubscription): Promise<InstitutionSubscription>;
}
