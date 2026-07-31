import { InstitutionType } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { FirestoreInstitutionRepository } from "../institutions/firestore-institution-repository";
import { InMemoryInstitutionDocumentStore } from "../institutions/in-memory-institution-document-store";
import { INSTITUTION_SEED_DATASET } from "./institution-seeds";
import {
  loadDomainInstitutionsFromSeeds,
  loadInstitutionSeedDataset,
  seedInstitutionDocumentStore,
  seedInstitutionRepository,
} from "./seed-loader";
import { validateInstitutionSeeds } from "./seed-validator";
import { SEED_CITIES } from "./types";

describe("institution seed dataset", () => {
  it("validates successfully with required distribution", () => {
    const result = validateInstitutionSeeds();
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(INSTITUTION_SEED_DATASET.length).toBeGreaterThanOrEqual(20);
  });

  it("covers all required cities and verticals", () => {
    const seeds = loadInstitutionSeedDataset();
    const cities = new Set(seeds.map((seed) => seed.city));
    const types = new Set(seeds.map((seed) => seed.type));

    for (const city of SEED_CITIES) {
      expect(cities.has(city)).toBe(true);
    }

    expect(types.has(InstitutionType.PrivateSchool)).toBe(true);
    expect(types.has(InstitutionType.Kindergarten)).toBe(true);
    expect(types.has(InstitutionType.LanguageSchool)).toBe(true);
    expect(types.has(InstitutionType.EtutMerkezi)).toBe(true);
    expect(types.has("university")).toBe(true);
    expect(seeds.some((seed) => seed.futureUniversity)).toBe(true);
  });

  it("has unique ids, slugs, and names without lorem ipsum", () => {
    const seeds = INSTITUTION_SEED_DATASET;
    const ids = seeds.map((seed) => seed.id);
    const slugs = seeds.map((seed) => seed.slug);
    const names = seeds.map((seed) => seed.name);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(names).size).toBe(names.length);
    expect(names.some((name) => /lorem|ipsum/i.test(name))).toBe(false);
  });

  it("loads into repository so records are readable", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const repository = new FirestoreInstitutionRepository({ store });

    const saved = await seedInstitutionRepository(repository);
    expect(saved).toBe(INSTITUTION_SEED_DATASET.length);

    const bySlug = await repository.getBySlug("kadikoy-marmara-koleji");
    expect(bySlug?.name).toBe("Kadıköy Marmara Koleji");
    expect(bySlug?.location.cityId).toBe("city_istanbul");

    const listed = await repository.list({ page: 1, pageSize: 50 });
    expect(listed.totalItems).toBe(INSTITUTION_SEED_DATASET.length);

    const domain = loadDomainInstitutionsFromSeeds();
    expect(domain[0] && Object.isFrozen(domain[0])).toBe(true);
  });

  it("seeds document store via mapper for firestore-shaped docs", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const count = await seedInstitutionDocumentStore(store);
    expect(count).toBe(INSTITUTION_SEED_DATASET.length);

    const record = await store.findBySlug("besiktas-minik-adimlar-anaokulu");
    expect(record?.data.name).toBe("Beşiktaş Minik Adımlar Anaokulu");
    expect(record?.data.lifecycleStatus).toBe("published");
  });
});
