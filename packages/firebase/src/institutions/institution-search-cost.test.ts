import {
  createInstitutionFilters,
  createInstitutionSearchQuery,
  PUBLIC_SEARCH_EXACT_CAP,
  PUBLIC_SEARCH_KEYWORD_CAP,
  PUBLIC_SEARCH_RETRY_MAX_READS,
  PUBLIC_SEARCH_TYPICAL_MAX_READS,
} from "@eduatlas/application";
import {
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
  type Institution,
} from "@eduatlas/domain";
import { describe, expect, it, vi } from "vitest";
import { FirestoreInstitutionRepository } from "./firestore-institution-repository";
import { InMemoryInstitutionDocumentStore } from "./in-memory-institution-document-store";

const timestamps = {
  createdAt: "2026-08-30T00:00:00.000Z",
  updatedAt: "2026-08-30T00:00:00.000Z",
  publishedAt: "2026-08-30T00:00:00.000Z",
};

function bakirkoy(input: { id: string; name: string; districtId?: string }): Institution {
  return createPublishedInstitution({
    id: input.id,
    slug: input.id.replace(/_/g, "-"),
    name: input.name,
    primaryType: InstitutionType.Dershane,
    verification: InstitutionVerification.Unclaimed,
    location: {
      cityId: "istanbul",
      districtId: input.districtId ?? "istanbul-bakirkoy",
      address: "Ataköy Mah. 5. Kısım Cad. No:12",
    },
    contact: { email: `${input.id}@example.com` },
    shortDescription: "Kurs",
    qualityScore: 0,
    ...timestamps,
  });
}

function requestedReads(
  exactSpy: { mock: { calls: readonly unknown[][] } },
  keywordSpy: { mock: { calls: readonly unknown[][] } },
): number {
  const sumLimits = (spy: { mock: { calls: readonly unknown[][] } }) =>
    spy.mock.calls.reduce((total, call) => {
      const input = call[0] as { limit?: number };
      return total + Number(input?.limit ?? 0);
    }, 0);
  return sumLimits(exactSpy) + sumLimits(keywordSpy);
}

describe("public institution search cost and quality", () => {
  it("does not return 134 generic Bakırköy courses for Bilgi Özel Öğretim Kursu", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const repo = new FirestoreInstitutionRepository({ store });
    const listAllSpy = vi.spyOn(store, "listAll");
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");
    const listSpy = vi.spyOn(repo, "list");
    const exactSpy = vi.spyOn(store, "findByExactName");
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");

    await repo.save(bakirkoy({ id: "inst_bilgi_1", name: "ÖZEL BAKIRKÖY BİLGİ KURSU" }));
    await repo.save(
      bakirkoy({ id: "inst_bilgi_2", name: "BAKIRKÖY İLGİDEKİ ÇAĞDAŞ BİLGİ KURSU" }),
    );
    await repo.save(bakirkoy({ id: "inst_incirli", name: "İNCİRLİ FEN BİLİMLERİ LOCA" }));
    await repo.save(bakirkoy({ id: "inst_net", name: "NET BİLİM" }));
    await repo.save(bakirkoy({ id: "inst_edim", name: "EDİM ÖZEL ÖĞRETİM KURSU" }));
    await repo.save(bakirkoy({ id: "inst_murat", name: "MURAT ÖZEL ÖĞRETİM KURSU" }));
    await repo.save(bakirkoy({ id: "inst_kosk", name: "KÖŞK AKADEMİ" }));
    for (let i = 0; i < 20; i += 1) {
      await repo.save(
        bakirkoy({
          id: `inst_generic_${i}`,
          name: `SEZON ${i} ÖZEL ÖĞRETİM KURSU`,
        }),
      );
    }

    const result = await repo.search(
      createInstitutionSearchQuery({
        text: "Bilgi Özel Öğretim Kursu",
        pageSize: 12,
        filters: createInstitutionFilters({
          cityId: "istanbul",
          districtId: "istanbul-bakirkoy",
        }),
      }),
    );

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(listSpy).not.toHaveBeenCalled();
    expect(requestedReads(exactSpy, keywordSpy)).toBeLessThanOrEqual(PUBLIC_SEARCH_TYPICAL_MAX_READS);
    expect(result.page.totalItems).toBeLessThan(10);
    expect(result.page.items.map((item) => item.id).sort()).toEqual(
      ["inst_bilgi_1", "inst_bilgi_2"].sort(),
    );
    expect(result.page.items.some((item) => item.id === "inst_incirli")).toBe(false);
    expect(result.page.items.some((item) => item.id === "inst_net")).toBe(false);
    expect(result.page.items.some((item) => item.id === "inst_edim")).toBe(false);
    expect(result.page.items.some((item) => item.id === "inst_murat")).toBe(false);
    expect(result.page.items.some((item) => item.id === "inst_kosk")).toBe(false);
  });

  it("does not scan thousands of İstanbul institutions for Bilgi", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const repo = new FirestoreInstitutionRepository({ store });
    const listAllSpy = vi.spyOn(store, "listAll");
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");
    const listSpy = vi.spyOn(repo, "list");
    const exactSpy = vi.spyOn(store, "findByExactName");
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");

    for (let i = 0; i < 80; i += 1) {
      await repo.save(
        bakirkoy({
          id: `inst_ist_${i}`,
          name: `İSTANBUL DERSANE ${i} ÖZEL ÖĞRETİM KURSU`,
          districtId: i === 0 ? "istanbul-bakirkoy" : "istanbul-kadikoy",
        }),
      );
    }
    await repo.save(bakirkoy({ id: "inst_bilgi_ist", name: "BİLGİ ÖZEL ÖĞRETİM KURSU" }));

    const result = await repo.search(
      createInstitutionSearchQuery({
        text: "Bilgi",
        pageSize: 12,
        filters: createInstitutionFilters({ cityId: "istanbul" }),
      }),
    );

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(listSpy).not.toHaveBeenCalled();
    expect(requestedReads(exactSpy, keywordSpy)).toBeLessThanOrEqual(PUBLIC_SEARCH_TYPICAL_MAX_READS);
    expect(result.page.totalItems).toBeLessThan(80);
    expect(result.page.items.some((item) => item.id === "inst_bilgi_ist")).toBe(true);
  });

  it("does not return every course for generic Özel Öğretim Kursu + Bakırköy", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const repo = new FirestoreInstitutionRepository({ store });
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");
    const exactSpy = vi.spyOn(store, "findByExactName");
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");

    for (let i = 0; i < 15; i += 1) {
      await repo.save(
        bakirkoy({
          id: `inst_course_${i}`,
          name: `AKADEMI ${i} ÖZEL ÖĞRETİM KURSU`,
        }),
      );
    }

    const result = await repo.search(
      createInstitutionSearchQuery({
        text: "Özel Öğretim Kursu",
        pageSize: 12,
        filters: createInstitutionFilters({
          cityId: "istanbul",
          districtId: "istanbul-bakirkoy",
        }),
      }),
    );

    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(keywordSpy).not.toHaveBeenCalled();
    expect(requestedReads(exactSpy, keywordSpy)).toBeLessThanOrEqual(PUBLIC_SEARCH_EXACT_CAP);
    expect(result.page.items).toEqual([]);
    expect(result.page.totalItems).toBe(0);
  });

  it("caps district retry worst-case reads at 90", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const repo = new FirestoreInstitutionRepository({ store });
    const exactSpy = vi.spyOn(store, "findByExactName");
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");

    await repo.save(
      bakirkoy({
        id: "inst_kadro_kadikoy",
        name: "GENÇ KADRO ÖZEL ÖĞRETİM KURSU",
        districtId: "istanbul-kadikoy",
      }),
    );

    await repo.search(
      createInstitutionSearchQuery({
        text: "Kadro",
        pageSize: 12,
        filters: createInstitutionFilters({
          cityId: "istanbul",
          districtId: "istanbul-bakirkoy",
        }),
      }),
    );

    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(keywordSpy).toHaveBeenCalledTimes(2);
    expect(keywordSpy.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        keyword: "kadro",
        districtId: "istanbul-bakirkoy",
        limit: PUBLIC_SEARCH_KEYWORD_CAP,
      }),
    );
    expect(keywordSpy.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        keyword: "kadro",
        cityId: "istanbul",
        limit: PUBLIC_SEARCH_KEYWORD_CAP,
      }),
    );
    expect(requestedReads(exactSpy, keywordSpy)).toBeLessThanOrEqual(PUBLIC_SEARCH_RETRY_MAX_READS);
  });
});
