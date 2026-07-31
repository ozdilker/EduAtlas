import { buildCanonical } from "./canonical";
import { buildDescription } from "./description";
import { buildOpenGraph } from "./open-graph";
import { buildTitle } from "./title";
import { buildTwitterCard } from "./twitter";
import type { SeoMetadata, SeoMetadataInput, SeoSiteConfig } from "./types";

export type BuildMetadataOptions = {
  site: SeoSiteConfig;
  title: string | string[];
  description: string;
  path: string;
  absoluteTitle?: boolean;
  includeSiteNameInTitle?: boolean;
  robots?: SeoMetadataInput["robots"];
  openGraphType?: "website" | "article";
  images?: string[];
};

/**
 * Composes title, description, canonical, Open Graph, and Twitter Card metadata.
 */
export function buildMetadata(options: BuildMetadataOptions): SeoMetadata {
  const title =
    typeof options.title === "string"
      ? options.includeSiteNameInTitle === false
        ? options.title
        : buildTitle([options.title], {
            siteName: options.site.siteName,
            includeSiteName: options.absoluteTitle ?? true,
          })
      : buildTitle(options.title, {
          siteName: options.site.siteName,
          includeSiteName: options.includeSiteNameInTitle ?? options.absoluteTitle ?? true,
        });

  const description = buildDescription(
    options.description || options.site.defaultDescription || "",
  );
  const canonical = buildCanonical(options.site.siteUrl, options.path);
  const absoluteTitle = options.absoluteTitle ?? true;

  const openGraph = buildOpenGraph(
    {
      title,
      description,
      url: canonical,
      type: options.openGraphType ?? "website",
      images: options.images,
    },
    options.site,
  );

  const twitter = buildTwitterCard(
    {
      title,
      description,
      images: options.images,
    },
    options.site,
  );

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
    },
    ...(options.robots ? { robots: options.robots } : {}),
    openGraph,
    twitter,
  };
}
