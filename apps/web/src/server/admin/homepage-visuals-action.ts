"use server";

import {
  getHomepageVisuals,
  isHomepageVisualValidationError,
  listCities,
  updateHomepageVisual,
} from "@eduatlas/application";
import {
  HOMEPAGE_POPULAR_CITY_IDS,
  createHomepageVisuals,
  isHomepageVisualSlot,
  resolveHomepageCityImageUrl,
  resolveHomepageHeroImageUrl,
  type HomepageVisualSlot,
} from "@eduatlas/domain";
import { createSeededGeographyRepositories } from "@eduatlas/firebase/server";
import { revalidatePath } from "next/cache";
import { assertAdminPortalAccess } from "../auth/guards";
import { getCityRepository } from "../geography/repository";
import { getObjectStorage } from "../media/repository";
import {
  discoverLocalHomepageVisualUrls,
  getHomepageVisualsRepository,
} from "../site/homepage-visuals-repository";

export type AdminVisualSlotView = Readonly<{
  readonly slot: string;
  readonly label: string;
  readonly imageUrl: string;
  readonly hasCustomImage: boolean;
  readonly section: "hero" | "popular" | "cities";
}>;

export type AdminVisualsPageData = Readonly<{
  readonly title: string;
  readonly subtitle: string;
  readonly heroSlot: AdminVisualSlotView;
  readonly popularSlots: readonly AdminVisualSlotView[];
  readonly citySlots: readonly AdminVisualSlotView[];
  readonly updatedAtLabel?: string;
}>;

const POPULAR_CITY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  istanbul: "İstanbul",
  ankara: "Ankara",
  izmir: "İzmir",
  bursa: "Bursa",
  antalya: "Antalya",
  gaziantep: "Gaziantep",
});

async function loadAdminCities() {
  try {
    const cityRepository = await getCityRepository();
    const cities = await listCities({}, { cityRepository });
    if (cities.length > 0) {
      return cities;
    }
  } catch (error) {
    console.warn(
      "[eduatlas] Admin visuals city list failed, using seeded catalog:",
      error instanceof Error ? error.message : error,
    );
  }
  const { cityRepository } = await createSeededGeographyRepositories();
  return listCities({}, { cityRepository });
}

export async function getAdminVisualsPageData(): Promise<AdminVisualsPageData> {
  await assertAdminPortalAccess("/admin/visuals");

  const homepageVisualsRepository = await getHomepageVisualsRepository();
  let visuals = await getHomepageVisuals({ homepageVisualsRepository });

  // Merge disk uploads when metadata is sparse (local Storage fallback leftovers).
  try {
    const discovered = await discoverLocalHomepageVisualUrls();
    const cityImages: Record<string, { imageUrl?: string; storagePath?: string }> = {};
    for (const [slug, visual] of Object.entries(visuals.cityImages)) {
      if (visual) {
        cityImages[slug] = { ...visual };
      }
    }
    for (const [slug, url] of Object.entries(discovered.cityImageUrls)) {
      if (slug && url && !cityImages[slug]?.imageUrl) {
        cityImages[slug] = { imageUrl: url };
      }
    }
    visuals = createHomepageVisuals({
      heroImageUrl: visuals.heroImageUrl?.trim() || discovered.heroImageUrl,
      heroStoragePath: visuals.heroStoragePath,
      cityImages,
      updatedAt: visuals.updatedAt,
      updatedByUserId: visuals.updatedByUserId,
    });
  } catch {
    // ignore discovery errors
  }

  const cities = await loadAdminCities();
  const sortedCities = [...cities].sort((a, b) => a.nameTr.localeCompare(b.nameTr, "tr"));

  const heroSlot: AdminVisualSlotView = {
    slot: "hero",
    label: "Varsayılan hero",
    imageUrl: resolveHomepageHeroImageUrl(visuals),
    hasCustomImage: Boolean(visuals.heroImageUrl?.trim()),
    section: "hero",
  };

  const popularSlots = HOMEPAGE_POPULAR_CITY_IDS.map((cityId) => {
    const imageUrl = resolveHomepageCityImageUrl(visuals, cityId);
    return {
      slot: cityId,
      label: POPULAR_CITY_LABELS[cityId] ?? cityId,
      imageUrl: imageUrl ?? "",
      hasCustomImage: Boolean(imageUrl),
      section: "popular" as const,
    };
  });

  const citySlots = sortedCities.map((city) => {
    const imageUrl = resolveHomepageCityImageUrl(visuals, city.slug);
    return {
      slot: city.slug,
      label: city.nameTr,
      imageUrl: imageUrl ?? "",
      hasCustomImage: Boolean(imageUrl),
      section: "cities" as const,
    };
  });

  return {
    title: "Site görselleri",
    subtitle:
      "Varsayılan hero, popüler şehir kartları ve tüm şehirlerin hero görsellerini buradan yönetin.",
    heroSlot,
    popularSlots,
    citySlots,
    updatedAtLabel: visuals.updatedAt
      ? new Date(visuals.updatedAt).toLocaleString("tr-TR")
      : undefined,
  };
}

export type UpdateAdminHomepageVisualState = {
  ok: boolean;
  message: string;
  slot?: HomepageVisualSlot;
  imageUrl?: string;
};

/**
 * Admin upload for a homepage visual slot (hero or any city slug).
 */
export async function updateAdminHomepageVisualAction(
  formData: FormData,
): Promise<UpdateAdminHomepageVisualState> {
  await assertAdminPortalAccess("/admin/visuals");

  const slotRaw = String(formData.get("slot") ?? "").trim();
  const file = formData.get("file");

  if (!isHomepageVisualSlot(slotRaw)) {
    return { ok: false, message: "Geçersiz görsel alanı." };
  }
  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, message: "Lütfen bir görsel seçin." };
  }

  try {
    const [homepageVisualsRepository, objectStorage, cityRepository] = await Promise.all([
      getHomepageVisualsRepository(),
      getObjectStorage(),
      getCityRepository(),
    ]);

    const seeded = await createSeededGeographyRepositories();

    const saved = await updateHomepageVisual(
      {
        slot: slotRaw,
        fileName: file.name,
        contentType: file.type || "",
        data: new Uint8Array(await file.arrayBuffer()),
      },
      {
        homepageVisualsRepository,
        objectStorage,
        assertCitySlug:
          slotRaw === "hero"
            ? undefined
            : async (slug) => {
                const fromPrimary = await cityRepository.getBySlug(slug);
                if (fromPrimary) {
                  return true;
                }
                return Boolean(await seeded.cityRepository.getBySlug(slug));
              },
      },
    );

    revalidatePath("/");
    revalidatePath("/admin/visuals");

    const imageUrl =
      slotRaw === "hero"
        ? resolveHomepageHeroImageUrl(saved)
        : resolveHomepageCityImageUrl(saved, slotRaw);

    return {
      ok: true,
      message: "Görsel güncellendi.",
      slot: slotRaw,
      imageUrl,
    };
  } catch (error) {
    console.error("[eduatlas] updateAdminHomepageVisualAction failed:", error);
    if (isHomepageVisualValidationError(error)) {
      return { ok: false, message: error.message, slot: slotRaw };
    }
    const message = error instanceof Error ? error.message : "Görsel kaydedilemedi.";
    if (/RESOURCE_EXHAUSTED|Quota exceeded/i.test(message)) {
      return {
        ok: false,
        message:
          "Veritabanı kotası doldu. Görsel yerel olarak saklanmayı denedi; sayfayı yenileyip tekrar deneyin.",
        slot: slotRaw,
      };
    }
    return {
      ok: false,
      message,
      slot: slotRaw,
    };
  }
}
