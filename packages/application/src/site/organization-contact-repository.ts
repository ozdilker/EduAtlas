import type { OrganizationContact } from "@eduatlas/domain";

export interface OrganizationContactRepository {
  get(): Promise<OrganizationContact | null>;
  save(contact: OrganizationContact): Promise<OrganizationContact>;
}
