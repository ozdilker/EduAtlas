import { describe, expect, it } from "vitest";
import {
  ADMIN_IMPORT_STEPS,
  getAdminImportOutcomeLabel,
  getAdminImportRowStatusLabel,
  getAdminImportStepIndex,
} from "./admin-import-content";

describe("admin import content helpers", () => {
  it("exposes the seven workflow steps in order", () => {
    expect(ADMIN_IMPORT_STEPS).toEqual([
      "Yükle",
      "Önizleme",
      "Doğrulama",
      "Yinelenme uyarıları",
      "Kalite önizleme",
      "İçe aktar",
      "Özet",
    ]);
  });

  it("maps phases to step progress", () => {
    expect(getAdminImportStepIndex("idle")).toBe(0);
    expect(getAdminImportStepIndex("preview")).toBe(4);
    expect(getAdminImportStepIndex("done")).toBe(6);
    expect(getAdminImportStepIndex("error")).toBe(0);
  });

  it("labels row statuses and outcomes in Turkish", () => {
    expect(getAdminImportRowStatusLabel("ready")).toBe("Hazır");
    expect(getAdminImportRowStatusLabel("duplicate")).toBe("Yinelenen");
    expect(getAdminImportOutcomeLabel("created")).toBe("Oluşturuldu");
    expect(getAdminImportOutcomeLabel("skipped_duplicate")).toBe("Yinelenen — atlandı");
  });
});
