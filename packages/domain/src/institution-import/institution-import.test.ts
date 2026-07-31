import { describe, expect, it } from "vitest";
import {
  createImportJob,
  createImportResult,
  createInstitutionImport,
  hasImportErrors,
  ImportIssueSeverity,
  ImportJobStatus,
  ImportSourceFormat,
  importDuplicateKey,
  importIssueError,
  importIssueWarning,
  importSourceFormatFromFileName,
  mapInstitutionTypeLabel,
  resolveImportSlug,
  slugifyInstitutionName,
} from "../index";

describe("institution import domain", () => {
  it("detects source format from file name", () => {
    expect(importSourceFormatFromFileName("kurumlar.CSV")).toBe(ImportSourceFormat.Csv);
    expect(importSourceFormatFromFileName("kurumlar.xlsx")).toBe(ImportSourceFormat.Xlsx);
    expect(importSourceFormatFromFileName("kurumlar.xls")).toBe(ImportSourceFormat.Xls);
    expect(importSourceFormatFromFileName("kurumlar.pdf")).toBeNull();
  });

  it("maps MEB-style type labels to InstitutionType", () => {
    expect(mapInstitutionTypeLabel("Özel Anaokulu")).toBe("kindergarten");
    expect(mapInstitutionTypeLabel("Özel Türk Okul Öncesi Kurumu")).toBe("kindergarten");
    expect(mapInstitutionTypeLabel("Fen Lisesi")).toBe("private_school");
    expect(mapInstitutionTypeLabel("Özel Öğretim Kursu")).toBe("dershane");
    expect(mapInstitutionTypeLabel("Özel Muhtelif Kurslar")).toBe("dershane");
    expect(mapInstitutionTypeLabel("Sosyal Etkinlik ve Gelişim Merkezi")).toBe("etut_merkezi");
    expect(mapInstitutionTypeLabel("Dil Kursu")).toBe("language_school");
    expect(mapInstitutionTypeLabel("Dil, Konuşma ve Ergoterapi Merkezi")).toBe("language_school");
    expect(mapInstitutionTypeLabel("Çocuk Etkinlik ve Oyun Evi")).toBe("preschool");
    expect(mapInstitutionTypeLabel("616")).toBe("private_school");
    expect(mapInstitutionTypeLabel("bilinmeyen")).toBe("private_school");
  });

  it("slugifies Turkish institution names deterministically", () => {
    expect(slugifyInstitutionName("Çankaya Güneşli Bahçe Anaokulu")).toBe(
      "cankaya-gunesli-bahce-anaokulu",
    );
    expect(slugifyInstitutionName("  İstanbul   Dil Okulu ")).toBe("istanbul-dil-okulu");
  });

  it("resolves provided slug when valid, otherwise generates from name", () => {
    const withSlug = createInstitutionImport({
      rowNumber: 1,
      values: { name: "Test Kurum", slug: "ozel-slug" },
    });
    expect(resolveImportSlug(withSlug)).toBe("ozel-slug");

    const withoutSlug = createInstitutionImport({
      rowNumber: 2,
      values: { name: "Ankara Etüt Merkezi" },
    });
    expect(resolveImportSlug(withoutSlug)).toBe("ankara-etut-merkezi");
  });

  it("builds duplicate keys with folded name and city", () => {
    expect(importDuplicateKey("Güneşli Bahçe", "city_ankara")).toBe(
      importDuplicateKey("GÜNEŞLİ BAHÇE ", "city_ankara"),
    );
    expect(importDuplicateKey("Güneşli Bahçe", "city_ankara")).not.toBe(
      importDuplicateKey("Güneşli Bahçe", "city_istanbul"),
    );
  });

  it("classifies issue severity", () => {
    const issues = [importIssueWarning("phone", "Telefon eksik")];
    expect(hasImportErrors(issues)).toBe(false);
    expect(hasImportErrors([...issues, importIssueError("name", "Ad zorunlu")])).toBe(true);
    expect(importIssueError("name", "Ad zorunlu").severity).toBe(ImportIssueSeverity.Error);
  });

  it("creates import jobs and results with validation", () => {
    const job = createImportJob({
      id: "job_1",
      fileName: "kurumlar.csv",
      sourceFormat: ImportSourceFormat.Csv,
      dryRun: true,
      totalRows: 3,
      createdAt: "2026-07-15T10:00:00.000Z",
    });
    expect(job.status).toBe(ImportJobStatus.Previewed);

    const result = createImportResult({
      jobId: job.id,
      dryRun: true,
      totalRows: 3,
      createdCount: 0,
      wouldCreateCount: 2,
      duplicateCount: 1,
      invalidCount: 0,
      failedCount: 0,
      completedAt: "2026-07-15T10:00:01.000Z",
    });
    expect(result.wouldCreateCount).toBe(2);

    expect(() =>
      createImportJob({
        id: " ",
        fileName: "a.csv",
        sourceFormat: ImportSourceFormat.Csv,
        dryRun: false,
        totalRows: 1,
        createdAt: "2026-07-15T10:00:00.000Z",
      }),
    ).toThrow();
  });
});
