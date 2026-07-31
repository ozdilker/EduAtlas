import { describe, expect, it } from "vitest";
import { ADMIN_OPERATIONS_QUICK_ACTIONS, adminOperationsPercent } from "./admin-operations-content";

describe("admin operations content helpers", () => {
  it("exposes the five quick actions with correct targets", () => {
    const ids = ADMIN_OPERATIONS_QUICK_ACTIONS.map((action) => action.id);
    expect(ids).toEqual(["import", "review", "acquisition", "published", "quality"]);

    const byId = new Map(ADMIN_OPERATIONS_QUICK_ACTIONS.map((action) => [action.id, action.href]));
    expect(byId.get("import")).toBe("/admin/import");
    expect(byId.get("review")).toBe("/admin/review");
    expect(byId.get("acquisition")).toBe("/admin/acquisition");
    expect(byId.get("published")).toBe("/admin/published");
    expect(byId.get("quality")).toBe("/admin/acquisition?sort=lowest");
  });

  it("computes safe percentages", () => {
    expect(adminOperationsPercent(0, 0)).toBe(0);
    expect(adminOperationsPercent(5, 0)).toBe(0);
    expect(adminOperationsPercent(1, 4)).toBe(25);
    expect(adminOperationsPercent(2, 3)).toBe(67);
    expect(adminOperationsPercent(10, 5)).toBe(100);
  });
});
