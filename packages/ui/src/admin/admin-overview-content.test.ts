import { describe, expect, it } from "vitest";
import { buildAdminNavItems } from "./admin-nav";
import { ADMIN_OVERVIEW_QUICK_ACTIONS } from "./admin-overview-content";

describe("admin overview content", () => {
  it("exposes the four executive quick actions", () => {
    const ids = ADMIN_OVERVIEW_QUICK_ACTIONS.map((action) => action.id);
    expect(ids).toEqual(["import", "review", "acquisition", "outreach"]);

    const byId = new Map(ADMIN_OVERVIEW_QUICK_ACTIONS.map((action) => [action.id, action.href]));
    expect(byId.get("import")).toBe("/admin/import");
    expect(byId.get("review")).toBe("/admin/review");
    expect(byId.get("acquisition")).toBe("/admin/acquisition");
    expect(byId.get("outreach")).toBe("/admin/outreach");
  });

  it("puts Overview first in shared admin nav and omits retired operations", () => {
    const nav = buildAdminNavItems({ review: 3, acquisition: 12 });
    expect(nav[0]?.id).toBe("overview");
    expect(nav[0]?.href).toBe("/admin");
    expect(nav.find((item) => item.id === "operations")).toBeUndefined();
    expect(nav.find((item) => item.id === "review")?.badge).toBe(3);
    expect(nav.find((item) => item.id === "acquisition")?.badge).toBe(12);
    expect(nav.at(-1)).toEqual({ id: "site", label: "Ana siteye dön", href: "/" });
  });
});
