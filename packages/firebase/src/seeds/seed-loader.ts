import type { InstitutionRepository } from "@eduatlas/application";
import {
  createInstitution,
  foldTurkishText,
  type Institution,
  InstitutionStatus,
  InstitutionType,
  tokenizeInstitutionSearchKeywords,
} from "@eduatlas/domain";
import { FirestoreInstitutionMapper } from "../institutions/firestore-institution-mapper";
import type { InstitutionDocumentStore } from "../institutions/institution-document-store";
import { INSTITUTION_SEED_DATASET } from "./institution-seeds";
import { assertValidInstitutionSeeds } from "./seed-validator";
import type { InstitutionSeedRecord } from "./types";

const DEFAULT_TIMESTAMPS = {
  createdAt: "2026-07-01T09:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
  publishedAt: "2026-07-10T10:00:00.000Z",
} as const;

/**
 * Returns the validated development institution seed dataset.
 */
export function loadInstitutionSeedDataset(
  seeds: readonly InstitutionSeedRecord[] = INSTITUTION_SEED_DATASET,
): readonly InstitutionSeedRecord[] {
  assertValidInstitutionSeeds(seeds);
  return seeds;
}

/**
 * Converts a seed record into a domain Institution.
 * Future university seeds are mapped to Draft private_school stand-ins until the vertical ships.
 */
export function institutionSeedToDomain(seed: InstitutionSeedRecord): Institution {
  const primaryType = seed.type === "university" ? InstitutionType.PrivateSchool : seed.type;
  const status = seed.type === "university" ? InstitutionStatus.Draft : seed.status;
  const publishedAt =
    status === InstitutionStatus.Published ? DEFAULT_TIMESTAMPS.publishedAt : undefined;

  return createInstitution({
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    primaryType,
    status,
    verification: seed.verification,
    location: {
      cityId: seed.cityId,
      districtId: seed.districtId,
      address: seed.location.address,
      locationNotes: seed.location.locationNotes,
      latitude: seed.location.latitude,
      longitude: seed.location.longitude,
    },
    contact: {
      phone: seed.contact.phone,
      email: seed.contact.email,
      whatsappNumber: seed.contact.whatsappNumber,
    },
    socialLinks: seed.websiteUrl ? { websiteUrl: seed.websiteUrl } : {},
    shortDescription: seed.shortDescription,
    programsSummary: seed.programsSummary,
    ageOrLevelFocus:
      seed.type === "university"
        ? (seed.ageOrLevelFocus ?? "Üniversite (gelecek dikey)")
        : seed.ageOrLevelFocus,
    isPremium: seed.isPremium ?? false,
    qualityScore: seed.qualityScore ?? 0,
    publishedAt,
    createdAt: DEFAULT_TIMESTAMPS.createdAt,
    updatedAt: DEFAULT_TIMESTAMPS.updatedAt,
  });
}

/**
 * Converts all seed records to domain institutions (after validation).
 */
export function loadDomainInstitutionsFromSeeds(
  seeds: readonly InstitutionSeedRecord[] = INSTITUTION_SEED_DATASET,
): readonly Institution[] {
  const validated = loadInstitutionSeedDataset(seeds);
  return Object.freeze(validated.map(institutionSeedToDomain));
}

/**
 * Seeds an InstitutionRepository from the development dataset.
 * @returns number of institutions saved
 */
export async function seedInstitutionRepository(
  repository: InstitutionRepository,
  seeds: readonly InstitutionSeedRecord[] = INSTITUTION_SEED_DATASET,
): Promise<number> {
  const institutions = loadDomainInstitutionsFromSeeds(seeds);

  for (const institution of institutions) {
    const existing = await repository.getById(institution.id);
    if (existing) {
      await repository.update(institution);
    } else {
      await repository.save(institution);
    }
  }

  return institutions.length;
}

/**
 * Seeds an InstitutionDocumentStore (Firestore or in-memory) via the shared mapper.
 */
export async function seedInstitutionDocumentStore(
  store: InstitutionDocumentStore,
  seeds: readonly InstitutionSeedRecord[] = INSTITUTION_SEED_DATASET,
): Promise<number> {
  const validated = loadInstitutionSeedDataset(seeds);

  for (const seed of validated) {
    const institution = institutionSeedToDomain(seed);
    const id = FirestoreInstitutionMapper.institutionDocId(institution);
    const document = FirestoreInstitutionMapper.toFirestore(institution, {
      searchKeywords: resolveSeedSearchKeywords(seed),
      cityName: seed.city,
      districtName: seed.district,
    });
    const existing = await store.getById(id);

    if (existing) {
      await store.replace(id, document);
    } else {
      await store.create(id, document);
    }
  }

  return validated.length;
}

/**
 * Merges explicit seed keywords with tokens derived from the institution name.
 */
export function resolveSeedSearchKeywords(seed: InstitutionSeedRecord): readonly string[] {
  const derived = tokenizeInstitutionSearchKeywords(seed.name);
  const geo = new Set(
    [seed.city, seed.district].map((value) => foldTurkishText(value)).filter(Boolean),
  );
  const extras = seed.searchKeywords
    .flatMap((token) => [...tokenizeInstitutionSearchKeywords(token)])
    .filter((token) => !geo.has(token));
  return Object.freeze([...new Set([...derived, ...extras])]);
}
