import { describe, expect, it } from "vitest";
import { createInstitutionContact } from "./institution-contact";
import { createInstitutionLocation } from "./institution-location";
import { createPublishedInstitution } from "./factory";
import {
  applyInstitutionProfileUpdate,
  createInstitutionProfileUpdate,
} from "./institution-profile-update";
import { InstitutionType } from "./institution-type";
import { InstitutionVerification } from "./institution-verification";

const NOW = "2026-07-14T20:00:00.000Z";

function publishedInstitution() {
  return createPublishedInstitution({
    id: "seed_inst_profile_1",
    name: "Profil Test Koleji",
    slug: "profil-test-koleji",
    primaryType: InstitutionType.PrivateSchool,
    verification: InstitutionVerification.Verified,
    location: {
      cityId: "city_istanbul",
      districtId: "dist_kadikoy",
      address: "Test Cad. No:1",
    },
    contact: {
      phone: "+90 216 111 11 11",
      email: "eski@test.edu.tr",
    },
    socialLinks: {
      websiteUrl: "https://eski.example.com",
      facebookUrl: "https://facebook.com/eski",
    },
    shortDescription: "Eski kısa açıklama",
    longDescription: "Eski uzun açıklama",
    programsSummary: "Programlar korunmalı",
    publishedAt: "2026-07-01T10:00:00.000Z",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
  });
}

describe("InstitutionProfileUpdate", () => {
  it("creates an immutable allowlisted update", () => {
    const update = createInstitutionProfileUpdate({
      institutionId: "seed_inst_profile_1",
      shortDescription: "Yeni kısa açıklama",
      longDescription: "Yeni uzun açıklama",
      phone: "+90 216 222 22 22",
      email: "yeni@test.edu.tr",
      whatsappNumber: "+90 532 000 00 00",
      address: "Yeni Mah. Cad. No:5",
      googleMapsUrl: "https://maps.google.com/?q=Kadikoy",
      websiteUrl: "https://yeni.example.com",
      instagramUrl: "https://instagram.com/yeni",
      facebookUrl: "https://facebook.com/yeni",
      twitterUrl: "https://x.com/yeni",
      linkedinUrl: "https://linkedin.com/company/yeni",
      youtubeUrl: "https://youtube.com/@yeni",
      updatedAt: NOW,
      updatedBy: "owner_demo",
    });

    expect(Object.isFrozen(update)).toBe(true);
    expect(update.shortDescription).toBe("Yeni kısa açıklama");
    expect(update.whatsappNumber).toBe("+90 532 000 00 00");
    expect(update.address).toBe("Yeni Mah. Cad. No:5");
    expect(update.googleMapsUrl).toBe("https://maps.google.com/?q=Kadikoy");
    expect(update.websiteUrl).toBe("https://yeni.example.com/");
    expect(update.instagramUrl).toBe("https://instagram.com/yeni");
    expect(update.facebookUrl).toBe("https://facebook.com/yeni");
    expect(update.twitterUrl).toBe("https://x.com/yeni");
    expect(update.linkedinUrl).toBe("https://linkedin.com/company/yeni");
    expect(update.youtubeUrl).toBe("https://youtube.com/@yeni");
    expect(update.updatedBy).toBe("owner_demo");
  });

  it("rejects non-URL social values", () => {
    expect(() =>
      createInstitutionProfileUpdate({
        institutionId: "seed_inst_profile_1",
        shortDescription: "Açıklama",
        phone: "+90 216 111 11 11",
        address: "Adres",
        youtubeUrl: "youtube.com/channel/abc",
        updatedAt: NOW,
        updatedBy: "owner_demo",
      }),
    ).toThrow(/youtubeUrl/);
  });

  it("rejects invalid Google Maps URLs", () => {
    expect(() =>
      createInstitutionProfileUpdate({
        institutionId: "seed_inst_profile_1",
        shortDescription: "Açıklama",
        phone: "+90 216 111 11 11",
        address: "Adres",
        googleMapsUrl: "not-a-maps-link",
        updatedAt: NOW,
        updatedBy: "owner_demo",
      }),
    ).toThrow(/googleMapsUrl/);
  });

  it("rejects empty address", () => {
    expect(() =>
      createInstitutionProfileUpdate({
        institutionId: "seed_inst_profile_1",
        shortDescription: "Açıklama",
        phone: "+90 216 111 11 11",
        address: "   ",
        updatedAt: NOW,
        updatedBy: "owner_demo",
      }),
    ).toThrow(/address/);
  });

  it("rejects updates without phone or email", () => {
    expect(() =>
      createInstitutionProfileUpdate({
        institutionId: "seed_inst_profile_1",
        shortDescription: "Açıklama",
        address: "Adres",
        updatedAt: NOW,
        updatedBy: "owner_demo",
      }),
    ).toThrow(/phone or email/);
  });

  it("applies contact and location editable fields", () => {
    const institution = publishedInstitution();
    const update = createInstitutionProfileUpdate({
      institutionId: "seed_inst_profile_1",
      shortDescription: "Güncel özet",
      longDescription: "Güncel detay",
      phone: "+90 216 333 33 33",
      email: "guncel@test.edu.tr",
      whatsappNumber: "+90 555 111 22 33",
      address: "Güncel Cad. No:9",
      googleMapsUrl: "https://maps.app.goo.gl/abc",
      websiteUrl: "https://guncel.example.com",
      promoVideoUrl: "https://vimeo.com/123456789",
      amenities: ["library", "security", "not-real"],
      educationPrograms: ["lgs", "tyt", "bogus"],
      faqs: [
        { id: "faq_1", question: "Nasıl kayıt olunur?", answer: "Online başvuru ile." },
      ],
      updatedAt: NOW,
      updatedBy: "owner_demo",
    });

    const next = applyInstitutionProfileUpdate(institution, update);

    expect(next.shortDescription).toBe("Güncel özet");
    expect(next.longDescription).toBe("Güncel detay");
    expect(next.contact.phone).toBe("+90 216 333 33 33");
    expect(next.contact.email).toBe("guncel@test.edu.tr");
    expect(next.contact.whatsappNumber).toBe("+90 555 111 22 33");
    expect(next.location.address).toBe("Güncel Cad. No:9");
    expect(next.location.googleMapsUrl).toBe("https://maps.app.goo.gl/abc");
    expect(next.location.cityId).toBe("city_istanbul");
    expect(next.promoVideoUrl).toBe("https://vimeo.com/123456789");
    expect(next.amenities).toEqual(["library", "security"]);
    expect(next.educationPrograms).toEqual(["lgs", "tyt"]);
    expect(next.faqs).toEqual([
      { id: "faq_1", question: "Nasıl kayıt olunur?", answer: "Online başvuru ile." },
    ]);
    expect(next.socialLinks.websiteUrl).toBe("https://guncel.example.com/");
    expect(next.socialLinks.facebookUrl).toBeUndefined();
    expect(next.programsSummary).toBe("Programlar korunmalı");
    expect(next.name).toBe("Profil Test Koleji");
    expect(next.updatedAt).toBe(NOW);
    expect(next.updatedByUserId).toBe("owner_demo");
  });
});

describe("contact and location validation", () => {
  it("rejects phone without digits", () => {
    expect(() => createInstitutionContact({ phone: "abc" })).toThrow(/phone/);
  });

  it("rejects invalid googleMapsUrl on location", () => {
    expect(() =>
      createInstitutionLocation({
        cityId: "city_a",
        districtId: "dist_a",
        address: "Adres",
        googleMapsUrl: "ftp://maps.example.com",
      }),
    ).toThrow(/googleMapsUrl/);
  });
});
