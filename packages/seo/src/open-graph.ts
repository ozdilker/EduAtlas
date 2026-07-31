import type { SeoOpenGraph, SeoOpenGraphInput, SeoSiteConfig } from "./types";

/**
 * Builds an Open Graph object for social previews.
 */
export function buildOpenGraph(
  input: SeoOpenGraphInput,
  site?: Pick<SeoSiteConfig, "siteName" | "locale" | "defaultImageUrl">,
): SeoOpenGraph {
  const images = resolveImages(input.images, site?.defaultImageUrl);

  return {
    title: input.title,
    description: input.description,
    url: input.url,
    type: input.type ?? "website",
    siteName: input.siteName ?? site?.siteName ?? "EduAtlas",
    locale: input.locale ?? site?.locale ?? "tr_TR",
    ...(images ? { images } : {}),
  };
}

function resolveImages(
  images: string[] | undefined,
  fallback?: string,
): Array<{ url: string }> | undefined {
  const urls = images?.filter((url) => url.trim().length > 0) ?? [];

  if (urls.length === 0 && fallback) {
    return [{ url: fallback }];
  }

  if (urls.length === 0) {
    return undefined;
  }

  return urls.map((url) => ({ url }));
}
