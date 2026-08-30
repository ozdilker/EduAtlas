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
  normalizeOutreachDistrictId,
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
            const tokens = foldTurkishText(row.name).split(" ");
            if (!tokens.includes(token) && !foldTurkishText(row.name).includes(token)) {
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
