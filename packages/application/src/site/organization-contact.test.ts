import { type OrganizationContact } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  getOrganizationContact,
  updateOrganizationContact,
} from "./organization-contact";
import type { OrganizationContactRepository } from "./organization-contact-repository";

function memoryRepo(seed: OrganizationContact | null = null): OrganizationContactRepository {
  let current = seed;
  return {
    async get() {
      return current;
    },
    async save(contact) {
      current = contact;
      return contact;
    },
  };
}

describe("getOrganizationContact", () => {
  it("returns defaults when repository is empty", async () => {
    const contact = await getOrganizationContact({
      organizationContactRepository: memoryRepo(null),
    });
    expect(contact.displayName).toBe("EduAtlas");
    expect(contact.email).toBe("info@eduatlas.com.tr");
  });
});

describe("updateOrganizationContact", () => {
  it("persists trimmed fields and returns resolved contact", async () => {
    const repo = memoryRepo();
    const saved = await updateOrganizationContact(
      {
        displayName: " EduAtlas A.Ş. ",
        email: " Destek@EduAtlas.com.tr ",
        phone: "0212 111 22 33",
        streetAddress: "Örnek Mah. No:5",
        addressLocality: "Beşiktaş",
        addressRegion: "İstanbul",
        postalCode: "34353",
        updatedByUserId: "admin_1",
      },
      { organizationContactRepository: repo },
    );
    expect(saved.displayName).toBe("EduAtlas A.Ş.");
    expect(saved.email).toBe("destek@eduatlas.com.tr");
    const raw = await repo.get();
    expect(raw?.updatedByUserId).toBe("admin_1");
    expect(raw?.phone).toBe("0212 111 22 33");
  });

  it("rejects invalid email", async () => {
    await expect(
      updateOrganizationContact(
        { email: "bad", updatedByUserId: "admin_1" },
        { organizationContactRepository: memoryRepo() },
      ),
    ).rejects.toThrow(/email/i);
  });
});
