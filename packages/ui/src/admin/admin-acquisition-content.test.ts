import { describe, expect, it } from "vitest";
import {
  buildAdminAcquisitionQueueTabs,
  buildAdminQualityIndicatorLabels,
  getAdminAcquisitionQualityBandLabel,
} from "./admin-acquisition-content";

describe("admin acquisition content helpers", () => {
  it("builds quality indicator labels", () => {
    const labels = buildAdminQualityIndicatorLabels({
      missingPhone: true,
      missingWebsite: false,
      missingDescription: true,
      missingCoordinates: false,
      missingCategories: true,
    });
    expect(labels).toEqual(["Telefon yok", "Açıklama yok", "Kategori/program yok"]);
  });

  it("maps quality bands", () => {
    expect(getAdminAcquisitionQualityBandLabel(10)).toBe("Düşük");
    expect(getAdminAcquisitionQualityBandLabel(50)).toBe("Orta");
    expect(getAdminAcquisitionQualityBandLabel(80)).toBe("İyi");
    expect(getAdminAcquisitionQualityBandLabel(95)).toBe("Mükemmel");
  });

  it("builds queue tabs with preserved filters", () => {
    const tabs = buildAdminAcquisitionQueueTabs({
      activeQueue: "pending",
      queueCounts: {
        all: 10,
        import: 2,
        pending: 3,
        verified: 4,
        claimed: 5,
        duplicates: 1,
      },
      filters: {
        cityId: "city_ist",
        districtId: "",
        primaryType: "kindergarten",
        verification: "",
        ownership: "claimed",
        status: "",
      },
      searchQuery: "anaokulu",
    });

    const pending = tabs.find((tab) => tab.id === "pending");
    expect(pending?.count).toBe(3);
    expect(pending?.href).toContain("queue=pending");
    expect(pending?.href).toContain("cityId=city_ist");
    expect(pending?.href).toContain("ownership=claimed");
    expect(pending?.href).toContain("q=anaokulu");
  });
});
