import { describe, expect, it } from "vitest";
import { getStaticInstitutionProfile } from "./institution-profile-content";

describe("institution profile static content", () => {
  it("exposes a complete presentation profile", () => {
    const profile = getStaticInstitutionProfile("ornek-anaokulu");

    expect(profile.slug).toBe("ornek-anaokulu");
    expect(profile.name).toBeTruthy();
    expect(profile.typeLabel).toBe("Anaokulu");
    expect(profile.city).toBe("İstanbul");
    expect(profile.district).toBe("Kadıköy");
    expect(profile.verified).toBe(true);
    expect(profile.premium).toBe(true);
    expect(profile.breadcrumbs.at(-1)?.label).toBe(profile.name);
  });

  it("includes programs, gallery, contact, and related cards", () => {
    const profile = getStaticInstitutionProfile();

    expect(profile.programs.length).toBeGreaterThanOrEqual(2);
    expect(profile.gallery.length).toBeGreaterThanOrEqual(3);
    expect(profile.contact.some((item) => item.id === "phone")).toBe(true);
    expect(profile.socialLinks.some((item) => item.id === "instagram")).toBe(true);
    expect(profile.related).toHaveLength(3);
    expect(profile.related.every((item) => item.href.startsWith("/institutions/"))).toBe(true);
  });
});
