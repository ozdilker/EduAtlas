import { MetadataEngine } from "@eduatlas/seo";
import { CategoryLandingPage } from "@eduatlas/ui";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getCategoryLandingView } from "@/server/categories/get-category-landing-view";
import { getInstitutionTypeSlug, InstitutionType } from "@eduatlas/domain";

type CategoryLandingRouteProps = {
  params: Promise<{
    category: string;
  }>;
};

export async function generateMetadata({ params }: CategoryLandingRouteProps) {
  const { category } = await params;
  const landing = await getCategoryLandingView(category);
  return MetadataEngine.resolve("category", getSeoSiteConfig(), {
    categorySlug: landing?.slug ?? category,
    categoryName: landing?.name,
    description: landing?.description,
  }).metadata;
}

const CATEGORY_SLUG_ALIASES: Record<string, InstitutionType> = Object.freeze({
  "dil-kursu": InstitutionType.LanguageSchool,
});

export async function generateStaticParams(): Promise<{ category: string }[]> {
  const typeSlugs = Object.values(InstitutionType).map((t) => getInstitutionTypeSlug(t));
  const aliasSlugs = Object.keys(CATEGORY_SLUG_ALIASES);
  const allSlugs = [...new Set([...typeSlugs, ...aliasSlugs])];
  return allSlugs.map((category) => ({ category }));
}

export const revalidate = 1800;

export default async function CategoryLandingRoute({ params }: CategoryLandingRouteProps) {
  const { category } = await params;
  const landing = await getCategoryLandingView(category);

  if (!landing) {
    notFound();
  }

  const pageSeo = MetadataEngine.resolve("category", getSeoSiteConfig(), {
    categorySlug: landing.slug,
    categoryName: landing.name,
    description: landing.description,
  });

  return (
    <>
      <JsonLd data={pageSeo.jsonLd} />
      <CategoryLandingPage categorySlug={landing.slug} category={landing} />
    </>
  );
}
