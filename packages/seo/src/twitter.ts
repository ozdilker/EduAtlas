import type { SeoSiteConfig, SeoTwitterCard, SeoTwitterCardInput } from "./types";

/**
 * Builds a Twitter Card object.
 */
export function buildTwitterCard(
  input: SeoTwitterCardInput,
  site?: Pick<SeoSiteConfig, "twitterHandle" | "defaultImageUrl">,
): SeoTwitterCard {
  const images = resolveImages(input.images, site?.defaultImageUrl);
  const siteHandle = input.site ?? site?.twitterHandle;

  return {
    card: input.card ?? "summary_large_image",
    title: input.title,
    description: input.description,
    ...(images ? { images } : {}),
    ...(siteHandle ? { site: siteHandle } : {}),
  };
}

function resolveImages(images: string[] | undefined, fallback?: string): string[] | undefined {
  const urls = images?.filter((url) => url.trim().length > 0) ?? [];

  if (urls.length === 0 && fallback) {
    return [fallback];
  }

  if (urls.length === 0) {
    return undefined;
  }

  return urls;
}
