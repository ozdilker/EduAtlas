import { describe, expect, it, vi } from "vitest";
import {
  createPublishedInstitution,
  foldTurkishText,
  InstitutionType,
  InstitutionVerification,
  type Institution,
  type InstitutionId,
} from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";
import {
  distinctiveOutreachSearchTokens,
  matchingOutreachSearchTokens,
  normalizeOutreachDistrictId,
  pickOutreachMatchingProbeToken,
  resolveOutreachMatchSearchScope,
  scoreOutreachInstitutionHit,
  searchOutreachInstitutions,
} from "./search-outreach-institutions";

const NOW = "2026-08-30T00:00:00.000Z";

function inst(input: {
  id: string;
  name: string;
  email?: string;
  cityId?: string;
  districtId?: string;
  keywords?: readonly string[];
}): Institution {
  return createPublishedInstitution({
    id: input.id,
    slug: input.id.replace(/_/g, "-"),
    name: input.name,
    primaryType: InstitutionType.Kindergarten,
    verification: InstitutionVerification.Unclaimed,
    location: {
      cityId: input.cityId ?? "istanbul",
      districtId: input.districtId ?? "istanbul-bakirkoy",
      address: "Bakırköy",
    },
    contact: { email: input.email },
    shortDescription: "Test",
    createdAt: NOW,
    updatedAt: NOW,
    publishedAt: NOW,
  });
}

function stubRepo(institutions: readonly Institution[]): InstitutionRepository & {
  listCalls: number;
} {
  const listCalls = { n: 0 };
  const repo: InstitutionRepository & { listCalls: number } = {
    getById: async (id: InstitutionId) =>
      institutions.find((row) => String(row.id) === String(id)) ?? null,
    getBySlug: async () => null,
    save: async (row) => row,
    update: async (row) => row,
    delete: async () => undefined,
    list: async () => {
      listCalls.n += 1;
      return Object.freeze({
        items: institutions,
        page: 1,
        pageSize: 50,
        totalItems: institutions.length,
        totalPages: 1,
      });
    },
    findByContactEmail: async (email, options) =>
      Object.freeze(
        institutions
          .filter((row) => (row.contact.email ?? "").toLowerCase() === email.trim().toLowerCase())
          .slice(0, options?.limit ?? 5),
      ),
    findByExactName: async (name, options) => {
      const needle = foldTurkishText(name);
      return Object.freeze(
        institutions
          .filter((row) => {
            if (foldTurkishText(row.name) !== needle) return false;
            if (options?.cityId && row.location.cityId !== options.cityId) return false;
            if (options?.districtId && row.location.districtId !== options.districtId) {
              return false;
            }
            return true;
          })
          .slice(0, options?.limit ?? 10),
      );
    },
    findBySearchKeyword: async (keyword, options) => {
      const token = foldTurkishText(keyword);
      return Object.freeze(
        institutions
          .filter((row) => {
            const tokens = foldTurkishText(row.name).split(" ").filter(Boolean);
            if (!tokens.includes(token)) {
              return false;
            }
            if (options?.cityId && row.location.cityId !== options.cityId) return false;
            if (options?.districtId && row.location.districtId !== options.districtId) {
              return false;
            }
            return true;
          })
          .slice(0, options?.limit ?? 10),
      );
    },
    listCalls: 0,
  };
  Object.defineProperty(repo, "listCalls", {
    get: () => listCalls.n,
  });
  return repo;
}

const catalog = [
  inst({
    id: "inst_genc_kadro_ozel_ogretim_kursu",
    name: "GENÇ KADRO ÖZEL ÖĞRETİM KURSU",
  }),
  inst({
    id: "inst_sezon_akademi_ozel_ogretim_kursu",
    name: "SEZON AKADEMİ ÖZEL ÖĞRETİM KURSU",
  }),
  inst({
    id: "inst_bakirkoy_cadde_aci_ozel_ogretim_kursu",
    name: "BAKIRKÖY CADDE AÇI ÖZEL ÖĞRETİM KURSU",
  }),
  inst({
    id: "inst_kadro_email",
    name: "Kadro Kurs",
    email: "info@kadrokurs.com",
    districtId: "istanbul-kadikoy",
  }),
];

describe("GROWTH-007 search debug helpers", () => {
  it("normalizes bakirkoy district to istanbul-bakirkoy", () => {
    expect(normalizeOutreachDistrictId("istanbul", "bakirkoy")).toBe("istanbul-bakirkoy");
    expect(normalizeOutreachDistrictId("istanbul", "istanbul-bakirkoy")).toBe(
      "istanbul-bakirkoy",
    );
  });

  it("folds Turkish Açı to aci like nameFolded", () => {
    expect(foldTurkishText("Açı")).toBe("aci");
    expect(foldTurkishText("ACİ")).toBe("aci");
    expect(foldTurkishText("ACI")).toBe("aci");
    expect(distinctiveOutreachSearchTokens("Bakırköy Açı Özel Öğretim Kursu", {
      cityId: "istanbul",
      districtId: "istanbul-bakirkoy",
    })).toContain("aci");
    expect([...distinctiveOutreachSearchTokens("Özel Öğretim Kursu")]).toEqual([]);
    expect([...distinctiveOutreachSearchTokens("Kadro Kurs")]).toEqual(["kadro"]);
    expect(
      pickOutreachMatchingProbeToken("Bakırköy Tasarı Eğitim Kurumları", {
        cityId: "istanbul",
        districtId: "istanbul-bakirkoy",
      }),
    ).toBe("tasari");
    expect(
      pickOutreachMatchingProbeToken("Bilgi Özel Öğretim Kursu", {
        cityId: "istanbul",
        districtId: "istanbul-bakirkoy",
      }),
    ).toBe("bilgi");
    expect(
      pickOutreachMatchingProbeToken("Kadro Kurs", {
        cityId: "istanbul",
        districtId: "istanbul-bakirkoy",
      }),
    ).toBe("kadro");
    expect(
      pickOutreachMatchingProbeToken("Sezon Özel Öğretim Kursu", {
        cityId: "istanbul",
        districtId: "istanbul-bakirkoy",
      }),
    ).toBe("sezon");
    expect(
      pickOutreachMatchingProbeToken("Özel Öğretim Kursu", {
        cityId: "istanbul",
        districtId: "istanbul-bakirkoy",
      }),
    ).toBeUndefined();
    expect(
      matchingOutreachSearchTokens("Bakırköy Tasarı Eğitim Kurumları", {
        cityId: "istanbul",
        districtId: "istanbul-bakirkoy",
      }),
    ).toEqual(["tasari"]);
  });

  it("contactEmail exact match returns the real institutionId", async () => {
    const repo = stubRepo(catalog);
    const result = await searchOutreachInstitutions(
      { query: "info@kadrokurs.com" },
      repo,
    );
    expect(result.items[0]?.id).toBe("inst_kadro_email");
    expect(result.usedList).toBe(false);
    expect(repo.listCalls).toBe(0);
  });

  it("name search Kadro Kurs finds GENÇ KADRO without catalog scan", async () => {
    const repo = stubRepo(catalog);
    const result = await searchOutreachInstitutions(
      { query: "Kadro Kurs", cityId: "istanbul", districtId: "bakirkoy" },
      repo,
    );
    expect(result.usedList).toBe(false);
    expect(repo.listCalls).toBe(0);
    expect(result.documentsRead).toBeLessThanOrEqual(20);
    expect(result.items.some((row) => row.id === "inst_genc_kadro_ozel_ogretim_kursu")).toBe(
      true,
    );
  });

  it("name search Sezon finds SEZON AKADEMİ", async () => {
    const repo = stubRepo(catalog);
    const result = await searchOutreachInstitutions(
      { query: "Sezon Özel Öğretim Kursu", cityId: "istanbul" },
      repo,
    );
    expect(result.items[0]?.id).toBe("inst_sezon_akademi_ozel_ogretim_kursu");
  });

  it("name search Açı / Bakırköy Açı finds CADDE AÇI", async () => {
    const repo = stubRepo(catalog);
    const aci = await searchOutreachInstitutions({ query: "Açı", cityId: "istanbul" }, repo);
    const bakirkoyAci = await searchOutreachInstitutions(
      { query: "Bakırköy Açı Özel Öğretim Kursu", cityId: "istanbul" },
      repo,
    );
    expect(aci.items.some((row) => row.id === "inst_bakirkoy_cadde_aci_ozel_ogretim_kursu")).toBe(
      true,
    );
    expect(
      bakirkoyAci.items.some((row) => row.id === "inst_bakirkoy_cadde_aci_ozel_ogretim_kursu"),
    ).toBe(true);
  });

  it("city scope does not hide bakirkoy hits; wrong district is normalized", async () => {
    const repo = stubRepo(catalog);
    const scoped = await searchOutreachInstitutions(
      { query: "Sezon", cityId: "istanbul", districtId: "bakirkoy" },
      repo,
    );
    const cityOnly = await searchOutreachInstitutions(
      { query: "Sezon", cityId: "istanbul" },
      repo,
    );
    expect(scoped.items[0]?.id).toBe("inst_sezon_akademi_ozel_ogretim_kursu");
    expect(cityOnly.items[0]?.id).toBe("inst_sezon_akademi_ozel_ogretim_kursu");
  });

  it("does not call list() even when match methods exist", async () => {
    const repo = stubRepo(catalog);
    const list = vi.fn(repo.list);
    repo.list = list;
    await searchOutreachInstitutions({ query: "Kadro", cityId: "istanbul" }, repo);
    expect(list).not.toHaveBeenCalled();
  });

  it("uses kadro as the distinctive probe and does not query kurs", async () => {
    const repo = stubRepo(catalog);
    const keyword = vi.fn(repo.findBySearchKeyword!);
    repo.findBySearchKeyword = keyword;
    const result = await searchOutreachInstitutions(
      { query: "Kadro Kurs", cityId: "istanbul", districtId: "bakirkoy" },
      repo,
    );
    expect(result.items.some((row) => row.id === "inst_genc_kadro_ozel_ogretim_kursu")).toBe(true);
    expect(keyword.mock.calls.length).toBeGreaterThan(0);
    expect(keyword.mock.calls.every((call) => call[0] === "kadro")).toBe(true);
    expect(keyword.mock.calls.some((call) => call[0] === "kurs")).toBe(false);
    expect(keyword.mock.calls.every((call) => call[1]?.districtId || call[1]?.cityId)).toBe(true);
  });

  it("returns empty for generic-only queries without keyword fallback", async () => {
    const repo = stubRepo(catalog);
    const keyword = vi.fn(repo.findBySearchKeyword!);
    repo.findBySearchKeyword = keyword;
    const result = await searchOutreachInstitutions(
      { query: "Özel Öğretim Kursu", cityId: "istanbul", districtId: "bakirkoy" },
      repo,
    );
    expect(result.items).toEqual([]);
    expect(keyword).not.toHaveBeenCalled();
    expect(repo.listCalls).toBe(0);
  });

  it("does not persist institutionId on search (Seç is the only writer)", async () => {
    const repo = stubRepo(catalog);
    const save = vi.fn(repo.save);
    const update = vi.fn(repo.update);
    repo.save = save;
    repo.update = update;
    await searchOutreachInstitutions(
      { query: "Kadro Kurs", cityId: "istanbul", districtId: "bakirkoy" },
      repo,
    );
    expect(save).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("does not match bilgi against bilimleri", async () => {
    const repo = stubRepo([
      inst({
        id: "inst_incirli",
        name: "İNCİRLİ FEN BİLİMLERİ LOCA",
      }),
      inst({
        id: "inst_bilgi",
        name: "ÖZEL BAKIRKÖY BİLGİ KURSU",
      }),
    ]);
    const result = await searchOutreachInstitutions(
      { query: "bilgi", cityId: "istanbul", districtId: "bakirkoy" },
      repo,
    );
    expect(result.items.some((row) => row.id === "inst_bilgi")).toBe(true);
    expect(result.items.some((row) => row.id === "inst_incirli")).toBe(false);
  });

  it("scores exact folded names higher than partial keyword hits", () => {
    const exact = scoreOutreachInstitutionHit("Kadro Kurs", {
      name: "Kadro Kurs",
    });
    const partial = scoreOutreachInstitutionHit("Kadro Kurs", {
      name: "GENÇ KADRO ÖZEL ÖĞRETİM KURSU",
    });
    expect(exact).toBeGreaterThan(partial);
  });
});

const bakirkoyMatchingCatalog = [
  inst({
    id: "inst_bakirkoy_tasari_ozel_ogretim_kursu",
    name: "BAKIRKÖY TASARI ÖZEL ÖĞRETİM KURSU",
  }),
  inst({
    id: "inst_ozel_bakirkoy_tasari_sosyal_etkinlik_ve_gelisim_merkezi",
    name: "ÖZEL BAKIRKÖY TASARI SOSYAL ETKİNLİK VE GELİŞİM MERKEZİ",
  }),
  inst({
    id: "inst_avcilar_tasari_ozel_ogretim_kursu",
    name: "AVCILAR TASARI ÖZEL ÖĞRETİM KURSU",
    districtId: "istanbul-avcilar",
  }),
  inst({
    id: "inst_ozel_eko_egitim_kurumlari_anaokulu",
    name: "ÖZEL EKO EĞİTİM KURUMLARI ANAOKULU",
    districtId: "istanbul-basaksehir",
  }),
  inst({
    id: "inst_genc_kadro_ozel_ogretim_kursu",
    name: "GENÇ KADRO ÖZEL ÖĞRETİM KURSU",
  }),
  inst({
    id: "inst_ozel_farkli_kadro_ozel_ogretim_kursu",
    name: "ÖZEL FARKLI KADRO ÖZEL ÖĞRETİM KURSU",
    districtId: "istanbul-fatih",
  }),
  inst({
    id: "inst_bakirkoy_ilgideki_cagdas_bilgi_ozel_ogretim_kursu",
    name: "BAKIRKÖY İLGİDEKİ ÇAĞDAŞ BİLGİ ÖZEL ÖĞRETİM KURSU",
  }),
  inst({
    id: "inst_ozel_atasehir_bilgi_koleji_anadolu_lisesi",
    name: "ÖZEL ATAŞEHİR BİLGİ KOLEJİ ANADOLU LİSESİ",
    districtId: "istanbul-atasehir",
  }),
  inst({
    id: "inst_sezon_akademi_ozel_ogretim_kursu",
    name: "SEZON AKADEMİ ÖZEL ÖĞRETİM KURSU",
  }),
];

const bakirkoyScope = {
  queryCity: { cityId: "istanbul", districtId: "istanbul-bakirkoy" },
} as const;

describe("GROWTH-007 matching scope and distinctive probe", () => {
  it("resolves campaign match scope over segment filters for external campaigns", () => {
    expect(
      resolveOutreachMatchSearchScope({
        recipientSource: "external_import",
        recipientMatchScope: { cityId: "istanbul", districtId: "istanbul-bakirkoy" },
        segmentFilters: { cityId: "istanbul" },
      }),
    ).toEqual({ cityId: "istanbul", districtId: "istanbul-bakirkoy" });
    expect(
      resolveOutreachMatchSearchScope({
        recipientSource: "segment",
        recipientMatchScope: { cityId: "istanbul", districtId: "istanbul-bakirkoy" },
        segmentFilters: { cityId: "istanbul" },
      }),
    ).toEqual({ cityId: "istanbul" });
  });

  it("finds BAKIRKÖY TASARI in bakirkoy scope and excludes other districts", async () => {
    const repo = stubRepo(bakirkoyMatchingCatalog);
    const keyword = vi.fn(repo.findBySearchKeyword!);
    repo.findBySearchKeyword = keyword;
    const result = await searchOutreachInstitutions(
      {
        query: "Bakırköy Tasarı Eğitim Kurumları",
        ...bakirkoyScope.queryCity,
      },
      repo,
    );
    expect(keyword.mock.calls.every((call) => call[0] === "tasari")).toBe(true);
    expect(keyword.mock.calls.every((call) => call[1]?.districtId === "istanbul-bakirkoy")).toBe(
      true,
    );
    expect(keyword.mock.calls.some((call) => call[1]?.cityId && !call[1]?.districtId)).toBe(false);
    expect(result.items[0]?.id).toBe("inst_bakirkoy_tasari_ozel_ogretim_kursu");
    expect(result.items.every((row) => row.districtId === "istanbul-bakirkoy")).toBe(true);
    expect(result.items.some((row) => row.id === "inst_avcilar_tasari_ozel_ogretim_kursu")).toBe(
      false,
    );
    expect(result.items.some((row) => row.id === "inst_ozel_eko_egitim_kurumlari_anaokulu")).toBe(
      false,
    );
    expect(repo.listCalls).toBe(0);
    expect(result.documentsRead).toBeLessThanOrEqual(40);
  });

  it("keeps Bilgi candidates inside bakirkoy", async () => {
    const repo = stubRepo(bakirkoyMatchingCatalog);
    const result = await searchOutreachInstitutions(
      { query: "Bilgi Özel Öğretim Kursu", ...bakirkoyScope.queryCity },
      repo,
    );
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((row) => row.districtId === "istanbul-bakirkoy")).toBe(true);
    expect(
      result.items.some((row) => row.id === "inst_ozel_atasehir_bilgi_koleji_anadolu_lisesi"),
    ).toBe(false);
  });

  it("ranks GENÇ KADRO first and excludes Fatih FARKLI KADRO", async () => {
    const repo = stubRepo(bakirkoyMatchingCatalog);
    const result = await searchOutreachInstitutions(
      { query: "Kadro Kurs", ...bakirkoyScope.queryCity },
      repo,
    );
    expect(result.items[0]?.id).toBe("inst_genc_kadro_ozel_ogretim_kursu");
    expect(result.items.some((row) => row.id === "inst_ozel_farkli_kadro_ozel_ogretim_kursu")).toBe(
      false,
    );
  });

  it("finds SEZON AKADEMİ in bakirkoy scope", async () => {
    const repo = stubRepo(bakirkoyMatchingCatalog);
    const result = await searchOutreachInstitutions(
      { query: "Sezon Özel Öğretim Kursu", ...bakirkoyScope.queryCity },
      repo,
    );
    expect(result.items[0]?.id).toBe("inst_sezon_akademi_ozel_ogretim_kursu");
    expect(result.items[0]?.districtId).toBe("istanbul-bakirkoy");
  });

  it("does not dump generic Özel Öğretim Kursu candidates", async () => {
    const repo = stubRepo(bakirkoyMatchingCatalog);
    const keyword = vi.fn(repo.findBySearchKeyword!);
    repo.findBySearchKeyword = keyword;
    const result = await searchOutreachInstitutions(
      { query: "Özel Öğretim Kursu", ...bakirkoyScope.queryCity },
      repo,
    );
    expect(result.items).toEqual([]);
    expect(keyword).not.toHaveBeenCalled();
    expect(repo.listCalls).toBe(0);
  });

  it("does not city-retry when explicit district returns 0", async () => {
    const repo = stubRepo(bakirkoyMatchingCatalog);
    const keyword = vi.fn(repo.findBySearchKeyword!);
    const exact = vi.fn(repo.findByExactName!);
    repo.findBySearchKeyword = keyword;
    repo.findByExactName = exact;
    const result = await searchOutreachInstitutions(
      { query: "Avcılar Tasarı", cityId: "istanbul", districtId: "istanbul-bakirkoy" },
      repo,
    );
    expect(result.items).toEqual([]);
    expect(keyword.mock.calls.length).toBeGreaterThan(0);
    expect(keyword.mock.calls.every((call) => call[1]?.districtId === "istanbul-bakirkoy")).toBe(
      true,
    );
    expect(keyword.mock.calls.some((call) => call[1]?.cityId && !call[1]?.districtId)).toBe(false);
    expect(exact.mock.calls.some((call) => call[1]?.cityId && !call[1]?.districtId)).toBe(false);
    expect(repo.listCalls).toBe(0);
  });
});
