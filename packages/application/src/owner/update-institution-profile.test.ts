import {
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  InstitutionNotFoundError,
  InstitutionProfileValidationError,
  type InstitutionRepository,
} from "../institutions";
import { getOwnerInstitutionProfile, updateInstitutionProfile } from "./update-institution-profile";

class StubInstitutionRepository implements Pick<InstitutionRepository, "getById" | "update"> {
  constructor(private institution: Awaited<ReturnType<InstitutionRepository["getById"]>>) {}

  async getById() {
    return this.institution;
  }

  async update(institution: NonNullable<Awaited<ReturnType<InstitutionRepository["getById"]>>>) {
    this.institution = institution;
    return institution;
  }
}

function published() {
  return createPublishedInstitution({
    id: "seed_inst_ist_kolej_1",
    name: "Kadıköy Marmara Koleji",
    slug: "kadikoy-marmara-koleji",
    primaryType: InstitutionType.PrivateSchool,
    verification: InstitutionVerification.Verified,
    location: {
      cityId: "city_istanbul",
      districtId: "dist_kadikoy",
      address: "Caferağa Mah. Moda Cad. No:42",
    },
    contact: {
      phone: "+90 216 330 45 67",
      email: "iletisim@marmarakoleji.k12.tr",
    },
    shortDescription: "Eski kısa açıklama",
    programsSummary: "İlkokul–lise",
    publishedAt: "2026-07-01T10:00:00.000Z",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
  });
}

describe("updateInstitutionProfile", () => {
  it("updates allowlisted fields and audits updatedAt/updatedBy", async () => {
    const repo = new StubInstitutionRepository(published());
    const result = await updateInstitutionProfile(
      {
        institutionId: "seed_inst_ist_kolej_1",
        shortDescription: "Yeni kısa açıklama",
        longDescription: "Yeni uzun açıklama",
        phone: "+90 216 999 88 77",
        email: "yeni@marmarakoleji.k12.tr",
        address: "Caferağa Mah. Moda Cad. No:42",
        websiteUrl: "https://www.marmarakoleji.k12.tr",
        instagramUrl: "https://instagram.com/marmarakoleji",
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(result.institution.shortDescription).toBe("Yeni kısa açıklama");
    expect(result.institution.longDescription).toBe("Yeni uzun açıklama");
    expect(result.institution.contact.phone).toBe("+90 216 999 88 77");
    expect(result.institution.socialLinks.websiteUrl).toBe("https://www.marmarakoleji.k12.tr/");
    expect(result.institution.programsSummary).toBe("İlkokul–lise");
    expect(result.institution.updatedAt).toBe("2026-07-14T21:00:00.000Z");
    expect(result.institution.updatedByUserId).toBe("owner_demo");
    expect(result.update.updatedBy).toBe("owner_demo");
  });

  it("persists contact details including WhatsApp, address, and maps link", async () => {
    const repo = new StubInstitutionRepository(published());
    const result = await updateInstitutionProfile(
      {
        institutionId: "seed_inst_ist_kolej_1",
        shortDescription: "Yeni kısa açıklama",
        phone: "+90 216 999 88 77",
        email: "yeni@marmarakoleji.k12.tr",
        whatsappNumber: "+90 532 111 22 33",
        address: "Moda Cad. No:100",
        googleMapsUrl: "https://maps.google.com/?q=Moda",
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(result.institution.contact.whatsappNumber).toBe("+90 532 111 22 33");
    expect(result.institution.location.address).toBe("Moda Cad. No:100");
    expect(result.institution.location.googleMapsUrl).toBe("https://maps.google.com/?q=Moda");
    expect(result.institution.location.cityId).toBe("city_istanbul");
  });

  it("rejects invalid contact or maps values", async () => {
    const repo = new StubInstitutionRepository(published());
    await expect(
      updateInstitutionProfile(
        {
          institutionId: "seed_inst_ist_kolej_1",
          shortDescription: "Yeni kısa açıklama",
          phone: "+90 216 999 88 77",
          address: "Adres",
          googleMapsUrl: "maps-without-scheme",
          updatedBy: "owner_demo",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionProfileValidationError);
  });

  it("persists all social media URLs", async () => {
    const repo = new StubInstitutionRepository(published());
    const result = await updateInstitutionProfile(
      {
        institutionId: "seed_inst_ist_kolej_1",
        shortDescription: "Yeni kısa açıklama",
        phone: "+90 216 999 88 77",
        address: "Caferağa Mah. Moda Cad. No:42",
        websiteUrl: "https://www.marmarakoleji.k12.tr",
        instagramUrl: "https://instagram.com/marmarakoleji",
        facebookUrl: "https://facebook.com/marmarakoleji",
        twitterUrl: "https://x.com/marmarakoleji",
        linkedinUrl: "https://linkedin.com/company/marmarakoleji",
        youtubeUrl: "https://youtube.com/@marmarakoleji",
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(result.institution.socialLinks).toEqual({
      websiteUrl: "https://www.marmarakoleji.k12.tr/",
      instagramUrl: "https://instagram.com/marmarakoleji",
      facebookUrl: "https://facebook.com/marmarakoleji",
      twitterUrl: "https://x.com/marmarakoleji",
      linkedinUrl: "https://linkedin.com/company/marmarakoleji",
      youtubeUrl: "https://youtube.com/@marmarakoleji",
    });
  });

  it("rejects invalid social media URLs", async () => {
    const repo = new StubInstitutionRepository(published());
    await expect(
      updateInstitutionProfile(
        {
          institutionId: "seed_inst_ist_kolej_1",
          shortDescription: "Yeni kısa açıklama",
          phone: "+90 216 999 88 77",
          address: "Adres",
          twitterUrl: "not-a-url",
          updatedBy: "owner_demo",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionProfileValidationError);
  });

  it("persists a YouTube promo video URL", async () => {
    const repo = new StubInstitutionRepository(published());
    const result = await updateInstitutionProfile(
      {
        institutionId: "seed_inst_ist_kolej_1",
        shortDescription: "Yeni kısa açıklama",
        phone: "+90 216 999 88 77",
        address: "Caferağa Mah. Moda Cad. No:42",
        promoVideoUrl: "https://youtu.be/dQw4w9WgXcQ",
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(result.institution.promoVideoUrl).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("rejects unsupported promo video hosts", async () => {
    const repo = new StubInstitutionRepository(published());
    await expect(
      updateInstitutionProfile(
        {
          institutionId: "seed_inst_ist_kolej_1",
          shortDescription: "Yeni kısa açıklama",
          phone: "+90 216 999 88 77",
          address: "Adres",
          promoVideoUrl: "https://example.com/video.mp4",
          updatedBy: "owner_demo",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionProfileValidationError);
  });

  it("persists selected amenities", async () => {
    const repo = new StubInstitutionRepository(published());
    const result = await updateInstitutionProfile(
      {
        institutionId: "seed_inst_ist_kolej_1",
        shortDescription: "Yeni kısa açıklama",
        phone: "+90 216 999 88 77",
        address: "Caferağa Mah. Moda Cad. No:42",
        amenities: ["library", "gym", "unknown_skip", "parking"],
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(result.institution.amenities).toEqual(["parking", "library", "gym"]);
  });

  it("persists selected education programs", async () => {
    const repo = new StubInstitutionRepository(published());
    const result = await updateInstitutionProfile(
      {
        institutionId: "seed_inst_ist_kolej_1",
        shortDescription: "Yeni kısa açıklama",
        phone: "+90 216 999 88 77",
        address: "Caferağa Mah. Moda Cad. No:42",
        educationPrograms: ["yks", "coding", "unknown_skip", "preschool"],
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(result.institution.educationPrograms).toEqual(["preschool", "yks", "coding"]);
  });

  it("persists FAQ list order", async () => {
    const repo = new StubInstitutionRepository(published());
    const result = await updateInstitutionProfile(
      {
        institutionId: "seed_inst_ist_kolej_1",
        shortDescription: "Yeni kısa açıklama",
        phone: "+90 216 999 88 77",
        address: "Caferağa Mah. Moda Cad. No:42",
        faqs: [
          { id: "faq_fees", question: "Ücretler?", answer: "Yıllık plan mevcut." },
          { id: "faq_bus", question: "Servis?", answer: "Evet." },
        ],
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(result.institution.faqs).toEqual([
      { id: "faq_fees", question: "Ücretler?", answer: "Yıllık plan mevcut." },
      { id: "faq_bus", question: "Servis?", answer: "Evet." },
    ]);
  });

  it("persists highlight list order", async () => {
    const repo = new StubInstitutionRepository(published());
    const result = await updateInstitutionProfile(
      {
        institutionId: "seed_inst_ist_kolej_1",
        shortDescription: "Yeni kısa açıklama",
        phone: "+90 216 999 88 77",
        address: "Caferağa Mah. Moda Cad. No:42",
        highlights: [
          { id: "hl_campus", title: "Kampüs", description: "Geniş bahçe." },
          { id: "hl_staff", title: "Kadromuz", description: "Deneyimli öğretmenler." },
        ],
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(result.institution.highlights).toEqual([
      { id: "hl_campus", title: "Kampüs", description: "Geniş bahçe." },
      { id: "hl_staff", title: "Kadromuz", description: "Deneyimli öğretmenler." },
    ]);
  });

  it("persists weekly working hours", async () => {
    const repo = new StubInstitutionRepository(published());
    const result = await updateInstitutionProfile(
      {
        institutionId: "seed_inst_ist_kolej_1",
        shortDescription: "Yeni kısa açıklama",
        phone: "+90 216 999 88 77",
        address: "Caferağa Mah. Moda Cad. No:42",
        workingHours: {
          monday: { isOpen: true, openTime: "09:00", closeTime: "17:30" },
          saturday: { isOpen: true, openTime: "10:00", closeTime: "14:00" },
          sunday: { isOpen: false },
        },
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(result.institution.workingHours?.monday).toEqual({
      isOpen: true,
      openTime: "09:00",
      closeTime: "17:30",
    });
    expect(result.institution.workingHours?.tuesday.isOpen).toBe(false);
    expect(result.institution.workingHours?.saturday.openTime).toBe("10:00");
    expect(result.institution.workingHours?.sunday).toEqual({ isOpen: false });
  });

  it("throws when institution is missing", async () => {
    const repo = new StubInstitutionRepository(null);
    await expect(
      updateInstitutionProfile(
        {
          institutionId: "missing",
          shortDescription: "Açıklama",
          phone: "+90 216 000 00 00",
          address: "Adres",
          updatedBy: "owner_demo",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionNotFoundError);
  });

  it("throws validation errors for empty short description", async () => {
    const repo = new StubInstitutionRepository(published());
    await expect(
      updateInstitutionProfile(
        {
          institutionId: "seed_inst_ist_kolej_1",
          shortDescription: "   ",
          phone: "+90 216 000 00 00",
          address: "Adres",
          updatedBy: "owner_demo",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionProfileValidationError);
  });

  it("getOwnerInstitutionProfile returns published institutions only", async () => {
    const repo = new StubInstitutionRepository(published());
    const profile = await getOwnerInstitutionProfile(
      { institutionId: "seed_inst_ist_kolej_1" },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );
    expect(profile?.name).toBe("Kadıköy Marmara Koleji");
  });
});
