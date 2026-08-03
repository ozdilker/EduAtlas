import { getOrganizationContact } from "@eduatlas/application";
import type { OrganizationContact } from "@eduatlas/domain";
import { getOrganizationContactRepository } from "./organization-contact-repository";

export async function getPublicOrganizationContact(): Promise<OrganizationContact> {
  const organizationContactRepository = await getOrganizationContactRepository();
  return getOrganizationContact({ organizationContactRepository });
}
