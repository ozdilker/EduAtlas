import {
  createDraftInstitution,
  ImportRowOutcome,
  ImportSourceFormat,
  type Institution,
  type InstitutionId,
  institutionIdAsString,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import type { CityRepository } from "../geography/city-repository";
import type { DistrictRepository } from "../geography/district-repository";
import {
  createInstitutionPage,
  DuplicateInstitutionError,
  InstitutionNotFoundError,
  type InstitutionRepository,
} from "../institutions";
import { executeImport } from "./execute-import";
import { parseCsvTable, parseImportFile } from "./import-file-parser";
import { previewImport } from "./preview-import";

const NOW = "2026-07-15T10:00:00.000Z";

const emptyCityRepository: CityRepository = {
  async getById() {
    return null;
  },
  async getBySlug() {
    return null;
  },
  async getByPlateCode() {
    return null;
  },
  async list() {
    return Object.freeze([]);
  },
  async search() {
    return Object.freeze([]);
  },
};

const emptyDistrictRepository: DistrictRepository = {
  async getById() {
    return null;
  },
  async getBySlug() {
    return null;
  },
  async listByCityId() {
    return Object.freeze([]);
  },
  async search() {
    return Object.freeze([]);
  },
};

function importDeps(institutionRepository: InstitutionRepository) {
  return {
    institutionRepository,
    cityRepository: emptyCityRepository,
    districtRepository: emptyDistrictRepository,
  };
}

class InMemoryInstitutionRepository implements InstitutionRepository {
  private readonly byId = new Map<string, Institution>();

  constructor(seed: readonly Institution[] = []) {
    for (const institution of seed) {
      this.byId.set(institutionIdAsString(institution.id), institution);
    }
  }

  async getById(id: InstitutionId): Promise<Institution | null> {
    return this.byId.get(institutionIdAsString(id)) ?? null;
  }

  async getBySlug(slug: string): Promise<Institution | null> {
    return [...this.byId.values()].find((item) => item.slug === slug) ?? null;
  }

  async list() {
    const items = [...this.byId.values()];
    return createInstitutionPage({
      items,
      page: 1,
      pageSize: Math.max(items.length, 1),
      totalItems: items.length,
    });
  }

  async save(institution: Institution): Promise<Institution> {
    const id = institutionIdAsString(institution.id);
    if (this.byId.has(id) || (await this.getBySlug(institution.slug))) {
      throw new DuplicateInstitutionError({ id, slug: institution.slug });
    }
    this.byId.set(id, institution);
    return institution;
  }

  async update(institution: Institution): Promise<Institution> {
    const id = institutionIdAsString(institution.id);
    if (!this.byId.has(id)) {
      throw new InstitutionNotFoundError({ id });
    }
    this.byId.set(id, institution);
    return institution;
  }

  async delete(id: InstitutionId): Promise<void> {
    if (!this.byId.delete(institutionIdAsString(id))) {
      throw new InstitutionNotFoundError({ id });
    }
  }

  get size(): number {
    return this.byId.size;
  }
}

function csvBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

const VALID_CSV = [
  "name,primaryType,cityId,districtId,address,shortDescription,phone,email",
  '"Güneşli Bahçe Anaokulu",kindergarten,city_ankara,dist_cankaya,"Çankaya Cad. No:1, Ankara","Doğa temelli anaokulu",+90 312 111 22 33,info@gunesli.com',
  '"İstanbul Dil Akademisi",language_school,city_istanbul,dist_kadikoy,"Bağdat Cad. No:5","İngilizce ve Almanca kursları",,akademi@dil.com',
].join("\n");

function seededExisting(): Institution {
  return createDraftInstitution({
    id: "inst_mevcut_kurum",
    name: "Mevcut Kurum",
    slug: "mevcut-kurum",
    primaryType: "dershane",
    location: { cityId: "city_ankara", districtId: "dist_cankaya", address: "Adres 1" },
    shortDescription: "Mevcut kayıt",
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe("import file parser", () => {
  it("parses quoted CSV with commas and Turkish headers", () => {
    const table = parseCsvTable('ad,adres\n"Kurum, A.Ş.","Cadde No:1, Ankara"');
    expect(table).toEqual([
      ["ad", "adres"],
      ["Kurum, A.Ş.", "Cadde No:1, Ankara"],
    ]);
  });

  it("maps Turkish header aliases to canonical fields", async () => {
    const parsed = await parseImportFile({
      fileName: "kurumlar.csv",
      content: csvBytes(
        "ad,kurum turu,sehir,ilce,adres,kisa aciklama\nKurum,dershane,c1,d1,Adres,Kısa",
      ),
    });
    expect(parsed.sourceFormat).toBe(ImportSourceFormat.Csv);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.name).toBe("Kurum");
    expect(parsed.rows[0]?.primaryType).toBe("dershane");
    expect(parsed.unknownHeaders).toHaveLength(0);
  });

  it("selects MEB adapter for MEB-style Excel headers in CSV fingerprint path", async () => {
    // CSV still uses canonical adapter; MEB column names still map via canonical aliases where overlapping.
    const parsed = await parseImportFile({
      fileName: "meb.csv",
      content: csvBytes(
        "Kurum Adı,İl,İlçe,Adres,Telefon,Kurum Türü\nÖzel Ata Koleji,İstanbul,Kadıköy,Moda Cad. No:1,0216 000 00 00,Özel Anadolu Lisesi",
      ),
    });
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.name).toBe("Özel Ata Koleji");
    expect(parsed.rows[0]?.cityId).toBe("İstanbul");
    expect(parsed.rows[0]?.districtId).toBe("Kadıköy");
  });

  it("maps MEB KURUM_TUR_ADI names and ignores KURUM_TUR_KODU codes", async () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["KURUMLAR LİSTE"],
      [
        "IL_ADI",
        "ILCE_ADI",
        "KURUM_ADI",
        "ADRES",
        "TEL",
        "FAX",
        "MERNIS_ADRES_KODU",
        "WEB_ADRES",
        "KURUM_TUR_ADI",
        "KURUM_TUR_KODU",
      ],
      [
        "İSTANBUL",
        "KADIKÖY",
        "Örnek Etüt",
        "Moda Cad. No:1",
        "0216 000 00 00",
        "",
        "1234567890",
        "",
        "Sosyal Etkinlik ve Gelişim Merkezi",
        "626",
      ],
      [
        "İSTANBUL",
        "ÜSKÜDAR",
        "Örnek Kurs",
        "Selami Ali Mah.",
        "0216 111 11 11",
        "",
        "9876543210",
        "",
        "Özel Öğretim Kursu",
        "616",
      ],
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Sheet1");
    const content = new Uint8Array(
      XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer,
    );

    const parsed = await parseImportFile({
      fileName: "meb-tur-adi.xlsx",
      content,
    });
    expect(parsed.sourceId).toBe("meb_excel");
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]?.primaryType).toBe("Sosyal Etkinlik ve Gelişim Merkezi");
    expect(parsed.rows[0]?.address).toContain("Moda");
    expect(parsed.rows[1]?.primaryType).toBe("Özel Öğretim Kursu");

    const { normalizeInstitutionImportRows } = await import("./normalize/normalize-import-row");
    const normalized = normalizeInstitutionImportRows(parsed.rows);
    expect(normalized[0]?.primaryType).toBe("etut_merkezi");
    expect(normalized[1]?.primaryType).toBe("dershane");
  });

  it("finds header row below MEB title rows", async () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["T.C. MİLLİ EĞİTİM BAKANLIĞI"],
      ["Kurum Listesi"],
      [],
      ["Kurum Adı", "İl", "İlçe", "Adres", "Telefon", "Kurum Türü"],
      [
        "Özel Ata Koleji",
        "İstanbul",
        "Kadıköy",
        "Moda Cad. No:1",
        "0216 000 00 00",
        "Özel Anadolu Lisesi",
      ],
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Liste");
    const content = new Uint8Array(
      XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer,
    );

    const parsed = await parseImportFile({
      fileName: "meb-listesi.xlsx",
      content,
    });
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.name).toBe("Özel Ata Koleji");
    expect(parsed.rows[0]?.cityId).toBe("İstanbul");
    expect(parsed.sourceId).toBe("meb_excel");
  });

  it("preserves Turkish characters in Windows-1254 HTML .xls exports", async () => {
    const html = [
      "<html><head><meta http-equiv='Content-Type' content='text/html; charset=windows-1254'></head><body><table>",
      "<tr><td>Kurum Adı</td><td>İl</td><td>İlçe</td><td>Adres</td><td>Telefon</td><td>Kurum Türü</td></tr>",
      "<tr><td>ÖZEL HEYBELİADA RUM ERKEK LİSESİ</td><td>İstanbul</td><td>Adalar</td><td>Heybeliada</td><td>0216 000 00 00</td><td>Özel Anadolu Lisesi</td></tr>",
      "<tr><td>ARNAVUTKÖY BEŞ YILDIZ ÖZEL ÖĞRETİM KURSU</td><td>İstanbul</td><td>Beşiktaş</td><td>Arnavutköy</td><td>0212 000 00 00</td><td>Özel Öğretim Kursu</td></tr>",
      "</table></body></html>",
    ].join("");

    const bytes: number[] = [];
    for (const char of html) {
      const code = char.codePointAt(0) ?? 0;
      if (code < 0x80) {
        bytes.push(code);
        continue;
      }
      let found = 0x3f;
      for (let value = 0x80; value <= 0xff; value += 1) {
        if (new TextDecoder("windows-1254").decode(Uint8Array.of(value)) === char) {
          found = value;
          break;
        }
      }
      bytes.push(found);
    }

    const parsed = await parseImportFile({
      fileName: "meb-kurum-listesi.xls",
      content: Uint8Array.from(bytes),
    });

    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]?.name).toBe("ÖZEL HEYBELİADA RUM ERKEK LİSESİ");
    expect(parsed.rows[1]?.name).toBe("ARNAVUTKÖY BEŞ YILDIZ ÖZEL ÖĞRETİM KURSU");
    expect(parsed.rows[0]?.name).not.toContain("\uFFFD");
  });

  it("rejects unsupported formats and missing name header", async () => {
    await expect(
      parseImportFile({ fileName: "kurumlar.pdf", content: csvBytes("x") }),
    ).rejects.toThrow(/csv/i);
    await expect(
      parseImportFile({ fileName: "k.csv", content: csvBytes("slug,adres\na,b") }),
    ).rejects.toThrow(/name/i);
  });
});

describe("previewImport (dry-run)", () => {
  it("validates rows, previews slugs and quality, flags duplicates", async () => {
    const repository = new InMemoryInstitutionRepository([seededExisting()]);
    const csv = [
      "name,primaryType,cityId,districtId,address,shortDescription,phone",
      "Yeni Kurum,dershane,city_ankara,dist_cankaya,Adres 2,Açıklama,+90 312 000 00 00",
      "Mevcut Kurum,dershane,city_ankara,dist_cankaya,Adres 1,Açıklama,",
      ",dershane,city_ankara,dist_cankaya,Adres 3,Açıklama,",
      "Bozuk Tür,akademi,city_ankara,dist_cankaya,Adres 4,Açıklama,",
    ].join("\n");

    const preview = await previewImport(
      { fileName: "kurumlar.csv", content: csvBytes(csv), now: NOW },
      importDeps(repository),
    );

    expect(preview.job.dryRun).toBe(true);
    expect(preview.result.totalRows).toBe(4);
    expect(preview.result.wouldCreateCount).toBe(2);
    expect(preview.result.duplicateCount).toBe(1);
    expect(preview.result.invalidCount).toBe(1);
    expect(preview.result.createdCount).toBe(0);

    const [ready, duplicate, missingName, mappedType] = preview.rows;
    expect(ready?.status).toBe("ready");
    expect(ready?.slugPreview).toBe("yeni-kurum");
    expect(ready?.qualityPreview?.score).toBeGreaterThan(0);

    expect(duplicate?.status).toBe("duplicate");
    expect(missingName?.status).toBe("invalid");
    // Unknown labels map to private_school (MEB default) — still importable
    expect(mappedType?.row.primaryType).toBe("private_school");
    expect(mappedType?.status === "ready" || mappedType?.status === "warning").toBe(true);

    expect(repository.size).toBe(1);
  });

  it("warns when contact is missing but keeps the row importable", async () => {
    const repository = new InMemoryInstitutionRepository();
    const csv = [
      "name,primaryType,cityId,districtId,address,shortDescription",
      "Sessiz Kurum,kindergarten,city_izmir,dist_konak,Adres,Kısa açıklama",
    ].join("\n");

    const preview = await previewImport(
      { fileName: "k.csv", content: csvBytes(csv), now: NOW },
      importDeps(repository),
    );

    expect(preview.rows[0]?.status).toBe("warning");
    expect(preview.result.wouldCreateCount).toBe(1);
  });

  it("drops invalid website placeholders instead of failing preview", async () => {
    const repository = new InMemoryInstitutionRepository();
    const csv = [
      "name,primaryType,cityId,districtId,address,shortDescription,phone,websiteUrl",
      "Websiz Kurum,dershane,city_ankara,dist_cankaya,Adres,Açıklama,+90 312 000 00 00,-",
      "Geçerli Web,dershane,city_ankara,dist_cankaya,Adres,Açıklama,+90 312 000 00 01,www.ornek.edu.tr",
    ].join("\n");

    const preview = await previewImport(
      { fileName: "k.csv", content: csvBytes(csv), now: NOW },
      importDeps(repository),
    );

    expect(preview.result.totalRows).toBe(2);
    expect(preview.result.invalidCount).toBe(0);
    expect(preview.result.wouldCreateCount).toBe(2);
    expect(preview.rows[0]?.row.websiteUrl).toBe("");
    expect(preview.rows[1]?.row.websiteUrl).toBe("https://www.ornek.edu.tr");
  });
});

describe("executeImport", () => {
  it("writes importable rows as published and skips duplicates/invalid", async () => {
    const repository = new InMemoryInstitutionRepository([seededExisting()]);
    const csv = [
      "name,primaryType,cityId,districtId,address,shortDescription,phone",
      "Yeni Kurum,dershane,city_ankara,dist_cankaya,Adres 2,Açıklama,+90 312 000 00 00",
      "Mevcut Kurum,dershane,city_ankara,dist_cankaya,Adres 1,Açıklama,",
      ",dershane,city_ankara,dist_cankaya,Adres 3,Açıklama,",
    ].join("\n");

    const execution = await executeImport(
      { fileName: "kurumlar.csv", content: csvBytes(csv), dryRun: false, now: NOW },
      importDeps(repository),
    );

    expect(execution.result.createdCount).toBe(1);
    expect(execution.result.duplicateCount).toBe(1);
    expect(execution.result.invalidCount).toBe(1);
    expect(execution.result.failedCount).toBe(0);
    expect(execution.rows[0]?.outcome).toBe(ImportRowOutcome.Created);

    const created = await repository.getBySlug("yeni-kurum");
    expect(created).not.toBeNull();
    expect(created?.status).toBe("published");
    expect(created?.publishedAt).toBe(NOW);
    expect(repository.size).toBe(2);
  });

  it("dry-run mode never writes", async () => {
    const repository = new InMemoryInstitutionRepository();
    const execution = await executeImport(
      { fileName: "kurumlar.csv", content: csvBytes(VALID_CSV), dryRun: true, now: NOW },
      importDeps(repository),
    );

    expect(execution.result.wouldCreateCount).toBe(2);
    expect(execution.result.createdCount).toBe(0);
    expect(execution.rows.every((row) => row.outcome === ImportRowOutcome.WouldCreate)).toBe(true);
    expect(repository.size).toBe(0);
  });

  it("disambiguates same-name institutions in different cities instead of skipping", async () => {
    const repository = new InMemoryInstitutionRepository();
    const csv = [
      "name,primaryType,cityId,districtId,address,shortDescription",
      "Aynı Kurum,dershane,city_ankara,dist_cankaya,Adres 1,Açıklama",
      "Aynı Kurum,dershane,city_istanbul,dist_kadikoy,Adres 2,Açıklama",
    ].join("\n");

    const execution = await executeImport(
      { fileName: "k.csv", content: csvBytes(csv), dryRun: false, now: NOW },
      importDeps(repository),
    );

    expect(execution.result.createdCount).toBe(2);
    expect(execution.result.duplicateCount).toBe(0);
    expect(repository.size).toBe(2);
    const slugs = [...(await repository.list()).items.map((item) => item.slug)].sort();
    expect(slugs).toEqual(["ayni-kurum", "ayni-kurum-kadikoy"]);
  });

  it("still skips true duplicates with same name, city, and district", async () => {
    const repository = new InMemoryInstitutionRepository();
    const csv = [
      "name,primaryType,cityId,districtId,address,shortDescription",
      "Aynı Kurum,dershane,city_ankara,dist_cankaya,Adres 1,Açıklama",
      "Aynı Kurum,dershane,city_ankara,dist_cankaya,Adres 2,Açıklama",
    ].join("\n");

    const execution = await executeImport(
      { fileName: "k.csv", content: csvBytes(csv), dryRun: false, now: NOW },
      importDeps(repository),
    );

    expect(execution.result.createdCount).toBe(1);
    expect(execution.result.duplicateCount).toBe(1);
    expect(repository.size).toBe(1);
  });
});
