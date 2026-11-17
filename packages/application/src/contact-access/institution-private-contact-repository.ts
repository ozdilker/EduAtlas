import type { InstitutionPrivateContact } from "./institution-private-contact";

/**
 * Persistence port for `institution_private_contacts` (Admin SDK only).
 */
export interface InstitutionPrivateContactRepository {
  getByInstitutionId(institutionId: string): Promise<InstitutionPrivateContact | null>;

  getByInstitutionIds(
    institutionIds: readonly string[],
  ): Promise<ReadonlyMap<string, InstitutionPrivateContact>>;

  upsert(contact: InstitutionPrivateContact): Promise<InstitutionPrivateContact>;
}
