import { describe, expect, it } from "vitest";
import {
  createOrganizationContact,
  formatOrganizationAddressLine,
  resolveOrganizationContact,
} from "./organization-contact";

describe("createOrganizationContact", () => {
  it("trims fields and forces TR country", () => {
    const contact = createOrganizationContact({
      displayName: "  EduAtlas Yazılım  ",
      email: " Info@EduAtlas.com.tr ",
      phone: " 0212 000 00 00 ",
      streetAddress: " Örnek Cad. No:1 ",
      addressLocality: " Kadıköy ",
      addressRegion: " İstanbul ",
      postalCode: " 34710 ",
    });
    expect(contact.displayName).toBe("EduAtlas Yazılım");
    expect(contact.email).toBe("info@eduatlas.com.tr");
    expect(contact.addressCountry).toBe("TR");
  });

  it("rejects invalid email when provided", () => {
    expect(() => createOrganizationContact({ email: "not-an-email" })).toThrow(/email/i);
  });
});

describe("resolveOrganizationContact", () => {
  it("fills defaults for blank name and email", () => {
    const resolved = resolveOrganizationContact(createOrganizationContact({}));
    expect(resolved.displayName).toBe("EduAtlas");
    expect(resolved.email).toBe("info@eduatlas.com.tr");
  });
});

describe("formatOrganizationAddressLine", () => {
  it("joins non-empty parts", () => {
    const contact = resolveOrganizationContact(
      createOrganizationContact({
        streetAddress: "Örnek Cad. No:1",
        addressLocality: "Kadıköy",
        addressRegion: "İstanbul",
        postalCode: "34710",
      }),
    );
    expect(formatOrganizationAddressLine(contact)).toContain("Kadıköy");
    expect(formatOrganizationAddressLine(contact)).toContain("İstanbul");
  });
});
