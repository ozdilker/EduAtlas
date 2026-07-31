import type { MediaAsset, MediaType } from "@eduatlas/domain";
import { createInstitutionMediaRepository } from "./institution-media-repository";
import type { MediaRepository } from "./media-repository";

export type ListInstitutionMediaInput = Readonly<{
  readonly institutionId: string;
  readonly type?: MediaType;
}>;

export type ListInstitutionMediaDependencies = Readonly<{
  readonly mediaRepository: MediaRepository;
}>;

export type InstitutionMediaSnapshot = Readonly<{
  readonly logo: readonly MediaAsset[];
  readonly cover: readonly MediaAsset[];
  readonly gallery: readonly MediaAsset[];
}>;

/**
 * Lists institution media sorted by sortOrder (active assets only).
 */
export async function listInstitutionMedia(
  input: ListInstitutionMediaInput,
  deps: ListInstitutionMediaDependencies,
): Promise<readonly MediaAsset[]> {
  const institutionMedia = createInstitutionMediaRepository(deps.mediaRepository);
  return institutionMedia.list(input.institutionId, input.type);
}

/**
 * Full media foundation snapshot for the owner media page.
 */
export async function getInstitutionMediaSnapshot(
  institutionId: string,
  deps: ListInstitutionMediaDependencies,
): Promise<InstitutionMediaSnapshot> {
  const all = await listInstitutionMedia({ institutionId }, deps);
  return Object.freeze({
    logo: Object.freeze(all.filter((item) => item.type === "logo")),
    cover: Object.freeze(all.filter((item) => item.type === "cover")),
    gallery: Object.freeze(all.filter((item) => item.type === "gallery")),
  });
}
