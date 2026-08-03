import {
  createOrganizationContact,
  resolveOrganizationContact,
  type CreateOrganizationContactInput,
  type OrganizationContact,
} from "@eduatlas/domain";
import type { OrganizationContactRepository } from "./organization-contact-repository";

export type GetOrganizationContactDependencies = {
  readonly organizationContactRepository: OrganizationContactRepository;
};

export async function getOrganizationContact(
  deps: GetOrganizationContactDependencies,
): Promise<OrganizationContact> {
  const raw = await deps.organizationContactRepository.get();
  return resolveOrganizationContact(raw ?? createOrganizationContact({}));
}

export type UpdateOrganizationContactInput = CreateOrganizationContactInput & {
  readonly updatedByUserId: string;
};

export type UpdateOrganizationContactDependencies = {
  readonly organizationContactRepository: OrganizationContactRepository;
};

export async function updateOrganizationContact(
  input: UpdateOrganizationContactInput,
  deps: UpdateOrganizationContactDependencies,
): Promise<OrganizationContact> {
  const next = createOrganizationContact({
    displayName: input.displayName,
    email: input.email,
    phone: input.phone,
    streetAddress: input.streetAddress,
    addressLocality: input.addressLocality,
    addressRegion: input.addressRegion,
    postalCode: input.postalCode,
    updatedAt: new Date().toISOString(),
    updatedByUserId: input.updatedByUserId,
  });
  await deps.organizationContactRepository.save(next);
  return resolveOrganizationContact(next);
}
