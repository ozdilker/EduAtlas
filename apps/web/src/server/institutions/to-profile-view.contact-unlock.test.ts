import {
  createInstitution,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { toInstitutionProfileView } from "./to-profile-view";

const geo = {
  cityId: "city_ist",
  cityName: "İstanbul",
  citySlug: "istanbul",
  districtId: "district_kadikoy",
  districtName: "Kadıköy",
  districtSlug: "kadikoy",
};

function sampleInstitution() {
  return createInstitution({
    id: "inst_contact_unlock_1",
    name: "Örnek Okul",
    slug: "ornek-okul-contact",
    primaryType: InstitutionType.PrivateSchool,
    status: InstitutionStatus.Published,
    verification: InstitutionVerification.Unclaimed,
    location: {
      cityId: geo.cityId,
      districtId: geo.districtId,
      address: "Cadde 1",
    },
    contact: {
      phone: "+90 216 111 22 33",
      email: "gizli@ornekokul.test",
      whatsappNumber: "+90 532 111 22 33",
    },
    socialLinks: {
      websiteUrl: "https://ornekokul.test",
    },
    shortDescription: "Kısa açıklama",
    qualityScore: 50,
    publishedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
}

describe("toInstitutionProfileView contact unlock", () => {
  it("omits phone/whatsapp/email from public props when locked", () => {
    const profile = toInstitutionProfileView(sampleInstitution(), geo, [], {
      includePrivateContact: false,
    });
    expect(profile.contact.some((item) => item.id === "phone")).toBe(false);
    expect(profile.contact.some((item) => item.id === "whatsapp")).toBe(false);
    expect(profile.contact.some((item) => item.id === "email")).toBe(false);
    expect(profile.contact.some((item) => item.id === "web")).toBe(true);
    expect(JSON.stringify(profile)).not.toContain("+90 216 111 22 33");
    expect(JSON.stringify(profile)).not.toContain("gizli@ornekokul.test");
  });

  it("includes phone/whatsapp/email when unlocked for that institution view", () => {
    const profile = toInstitutionProfileView(sampleInstitution(), geo, [], {
      includePrivateContact: true,
    });
    expect(profile.contact.find((item) => item.id === "phone")?.href).toMatch(/^tel:/);
    expect(profile.contact.find((item) => item.id === "whatsapp")?.href).toContain("wa.me");
    expect(profile.contact.find((item) => item.id === "email")?.href).toMatch(/^mailto:/);
  });
});
