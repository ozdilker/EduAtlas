import { getOwnerInstitutionProfile, updateInstitutionProfile } from "@eduatlas/application";
import { createInstitutionId, institutionIdAsString } from "@eduatlas/domain";
import { createSeededInstitutionRepository } from "@eduatlas/firebase/server";
import { describe, expect, it } from "vitest";
import { getOwnerInstitutionProfileView } from "./get-owner-institution-profile";
import { OWNER_DEMO_INSTITUTION_ID } from "./owner-demo-context";

describe("owner institution profile", () => {
  it("loads editable published fields for the demo institution", async () => {
    const institutionRepository = await createSeededInstitutionRepository();
    const view = await getOwnerInstitutionProfileView({
      institutionId: OWNER_DEMO_INSTITUTION_ID,
      institutionRepository,
    });

    expect(view).not.toBeNull();
    expect(view?.form.institutionId).toBe(OWNER_DEMO_INSTITUTION_ID);
    expect(view?.form.shortDescription.length).toBeGreaterThan(0);
    expect(view?.form.publicProfileHref).toContain("/institutions/");
    expect(view?.form.workingHours.monday).toEqual({
      isOpen: false,
      openTime: "09:00",
      closeTime: "18:00",
    });
    expect(view?.form.workingHours.sunday.isOpen).toBe(false);
    expect(view?.form.address.length).toBeGreaterThan(0);
    expect(view?.form.whatsappNumber).toBeDefined();
    expect(view?.form.googleMapsUrl).toBeDefined();
    expect(view?.form.amenityOptions.length).toBeGreaterThan(0);
    expect(view?.form.amenityOptions.every((item) => item.id && item.label)).toBe(true);
    expect(view?.form.educationProgramOptions.length).toBeGreaterThan(0);
    expect(view?.form.educationProgramOptions.every((item) => item.id && item.label)).toBe(true);
    expect(Array.isArray(view?.form.faqs)).toBe(true);
  });

  it("updates allowlisted fields through the application service", async () => {
    const institutionRepository = await createSeededInstitutionRepository();
    const before = await getOwnerInstitutionProfile(
      { institutionId: OWNER_DEMO_INSTITUTION_ID },
      { institutionRepository },
    );
    expect(before).not.toBeNull();
    if (!before) return;

    const marker = "task-015-profile-test";
    const result = await updateInstitutionProfile(
      {
        institutionId: institutionIdAsString(before.id),
        shortDescription: `${before.shortDescription} ${marker}`.slice(0, 500),
        longDescription: `Uzun açıklama ${marker}`,
        phone: before.contact.phone ?? "+90 216 330 45 67",
        email: before.contact.email ?? "iletisim@marmarakoleji.k12.tr",
        whatsappNumber: "+90 532 100 20 30",
        address: `${before.location.address} ${marker}`.slice(0, 500),
        googleMapsUrl: "https://maps.google.com/?q=Kadikoy",
        websiteUrl: "https://www.marmarakoleji.k12.tr",
        instagramUrl: "https://instagram.com/marmarakoleji",
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:30:00.000Z",
      },
      { institutionRepository },
    );

    const after = await institutionRepository.getById(
      createInstitutionId(OWNER_DEMO_INSTITUTION_ID),
    );
    expect(after?.shortDescription).toContain(marker);
    expect(after?.longDescription).toContain(marker);
    expect(after?.contact.whatsappNumber).toBe("+90 532 100 20 30");
    expect(after?.location.address).toContain(marker);
    expect(after?.location.googleMapsUrl).toBe("https://maps.google.com/?q=Kadikoy");
    expect(after?.updatedByUserId).toBe("owner_demo");
    expect(after?.name).toBe(before.name);
    expect(result.institution.updatedAt).toBe("2026-07-14T21:30:00.000Z");
  });
});
