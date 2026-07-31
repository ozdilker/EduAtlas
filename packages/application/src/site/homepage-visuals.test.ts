import {
  createEmptyHomepageVisuals,
  createHomepageVisuals,
  HOMEPAGE_POPULAR_CITY_IDS,
  resolveHomepageCityImageUrl,
  resolveHomepageHeroImageUrl,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { updateHomepageVisual } from "./update-homepage-visual";
import type { HomepageVisualsRepository } from "./homepage-visuals-repository";
import type { ObjectStorage } from "../media/object-storage";

class MemoryVisualsRepo implements HomepageVisualsRepository {
  current = createEmptyHomepageVisuals("2026-01-01T00:00:00.000Z");
  async get() {
    return this.current;
  }
  async save(visuals: typeof this.current) {
    this.current = visuals;
    return visuals;
  }
}

class MemoryStorage implements ObjectStorage {
  files = new Map<string, Uint8Array>();
  async put(input: { path: string; data: Uint8Array; contentType: string }) {
    this.files.set(input.path, input.data);
    return { path: input.path, url: `/media/${input.path}` };
  }
  async delete(path: string) {
    this.files.delete(path);
  }
  async getUrl(path: string) {
    return `/media/${path}`;
  }
}

describe("homepage visuals", () => {
  it("resolves default hero and empty city images", () => {
    expect(resolveHomepageHeroImageUrl(undefined)).toBe("/images/home-hero.png");
    expect(resolveHomepageCityImageUrl(undefined, "istanbul")).toBeUndefined();
  });

  it("uploads hero and arbitrary city slots", async () => {
    const repo = new MemoryVisualsRepo();
    const storage = new MemoryStorage();
    const bytes = new Uint8Array([1, 2, 3]);

    const afterHero = await updateHomepageVisual(
      {
        slot: "hero",
        fileName: "hero.png",
        contentType: "image/png",
        data: bytes,
        now: "2026-07-25T00:00:00.000Z",
      },
      { homepageVisualsRepository: repo, objectStorage: storage },
    );

    expect(afterHero.heroImageUrl).toMatch(/^\/media\/marketing\/homepage\/hero\//);
    expect(resolveHomepageHeroImageUrl(afterHero)).toBe(afterHero.heroImageUrl);

    const afterCity = await updateHomepageVisual(
      {
        slot: "konya",
        fileName: "konya.jpg",
        contentType: "image/jpeg",
        data: bytes,
        now: "2026-07-25T01:00:00.000Z",
      },
      { homepageVisualsRepository: repo, objectStorage: storage },
    );

    expect(resolveHomepageCityImageUrl(afterCity, "konya")).toMatch(
      /^\/media\/marketing\/homepage\/cities\/konya\//,
    );
    expect(HOMEPAGE_POPULAR_CITY_IDS).toContain("gaziantep");
  });

  it("rejects invalid types", async () => {
    await expect(
      updateHomepageVisual(
        {
          slot: "hero",
          fileName: "x.gif",
          contentType: "image/gif",
          data: new Uint8Array([1]),
        },
        {
          homepageVisualsRepository: new MemoryVisualsRepo(),
          objectStorage: new MemoryStorage(),
        },
      ),
    ).rejects.toThrow(/JPG/);
  });

  it("createHomepageVisuals freezes city map", () => {
    const visuals = createHomepageVisuals({
      cityImages: { istanbul: { imageUrl: "/a.jpg" } },
    });
    expect(visuals.cityImages.istanbul?.imageUrl).toBe("/a.jpg");
  });
});
