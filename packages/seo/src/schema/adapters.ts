import { buildBreadcrumbJsonLd } from "../json-ld/breadcrumb";
import type { JsonLdObject } from "../types";
import {
  CollectionPageSchemaBuilder,
  OrganizationSchemaBuilder,
  WebSiteSchemaBuilder,
} from "./builders";
import type {
  SchemaBuilder,
  SchemaBuildContext,
  SchemaListInstitutionItem,
  SchemaPageKind,
} from "./types";

/**
 * Home: Organization (@id) + exactly one WebSite (publisher references Organization).
 */
export const homeSchemaAdapter: SchemaBuilder<"home"> = Object.freeze({
  kind: "home",
  build({ site, input }: SchemaBuildContext<"home">): readonly JsonLdObject[] {
    const description = input.description ?? site.defaultDescription ?? "";
    return Object.freeze([
      OrganizationSchemaBuilder.build(site, { description }),
      WebSiteSchemaBuilder.build({
        site,
        input: {
          description,
          ...(input.potentialAction ? { potentialAction: input.potentialAction } : {}),
        },
      }),
    ]);
  },
});

export const searchSchemaAdapter: SchemaBuilder<"search"> = Object.freeze({
  kind: "search",
  build(): readonly JsonLdObject[] {
    return Object.freeze([]);
  },
});

export const staticSchemaAdapter: SchemaBuilder<"static"> = Object.freeze({
  kind: "static",
  build({ site, input }: SchemaBuildContext<"static">): readonly JsonLdObject[] {
    return Object.freeze([
      buildBreadcrumbJsonLd(
        [{ name: "Ana sayfa", path: "/" }, { name: input.breadcrumbLabel }],
        site,
      ),
    ]);
  },
});

function collectionItems(
  items: readonly SchemaListInstitutionItem[] | undefined,
): readonly SchemaListInstitutionItem[] | undefined {
  return items?.length ? items : undefined;
}

export const citySchemaAdapter: SchemaBuilder<"city"> = Object.freeze({
  kind: "city",
  build({ site, input }: SchemaBuildContext<"city">): readonly JsonLdObject[] {
    const path = `/cities/${input.citySlug}`;
    return Object.freeze([
      buildBreadcrumbJsonLd(
        [
          { name: "Ana sayfa", path: "/" },
          { name: "Şehirler", path: "/cities" },
          { name: input.cityName },
        ],
        site,
      ),
      CollectionPageSchemaBuilder.build(site, {
        path,
        name: input.name,
        description: input.description,
        items: collectionItems(input.items),
      }),
    ]);
  },
});

export const districtSchemaAdapter: SchemaBuilder<"district"> = Object.freeze({
  kind: "district",
  build({ site, input }: SchemaBuildContext<"district">): readonly JsonLdObject[] {
    const path = `/cities/${input.citySlug}/${input.districtSlug}`;
    return Object.freeze([
      buildBreadcrumbJsonLd(
        [
          { name: "Ana sayfa", path: "/" },
          { name: "Şehirler", path: "/cities" },
          { name: input.cityName, path: `/cities/${input.citySlug}` },
          { name: input.districtName },
        ],
        site,
      ),
      CollectionPageSchemaBuilder.build(site, {
        path,
        name: input.name,
        description: input.description,
        items: collectionItems(input.items),
      }),
    ]);
  },
});

export const categorySchemaAdapter: SchemaBuilder<"category"> = Object.freeze({
  kind: "category",
  build({ site, input }: SchemaBuildContext<"category">): readonly JsonLdObject[] {
    const path = `/categories/${input.categorySlug}`;
    return Object.freeze([
      buildBreadcrumbJsonLd(
        [
          { name: "Ana sayfa", path: "/" },
          { name: "Kategoriler", path: "/categories" },
          { name: input.categoryName },
        ],
        site,
      ),
      CollectionPageSchemaBuilder.build(site, {
        path,
        name: input.name,
        description: input.description,
        items: collectionItems(input.items),
      }),
    ]);
  },
});

export const cityTypeSchemaAdapter: SchemaBuilder<"city-type"> = Object.freeze({
  kind: "city-type",
  build({ site, input }: SchemaBuildContext<"city-type">): readonly JsonLdObject[] {
    const path = `/cities/${input.citySlug}/types/${input.typeSlug}`;
    return Object.freeze([
      buildBreadcrumbJsonLd(
        [
          { name: "Ana sayfa", path: "/" },
          { name: "Şehirler", path: "/cities" },
          { name: input.cityName, path: `/cities/${input.citySlug}` },
          { name: input.typeLabel },
        ],
        site,
      ),
      CollectionPageSchemaBuilder.build(site, {
        path,
        name: input.name,
        description: input.description,
        items: collectionItems(input.items),
      }),
    ]);
  },
});

export const institutionSchemaAdapter: SchemaBuilder<"institution"> = Object.freeze({
  kind: "institution",
  build({ site, input }: SchemaBuildContext<"institution">): readonly JsonLdObject[] {
    return Object.freeze([
      buildBreadcrumbJsonLd(
        [
          { name: "Ana sayfa", path: "/" },
          { name: input.city, path: `/cities/${input.citySlug}` },
          { name: input.district, path: `/cities/${input.citySlug}/${input.districtSlug}` },
          { name: input.typeLabel, path: `/categories/${input.typeSlug}` },
          { name: input.name },
        ],
        site,
      ),
    ]);
  },
});

export const DEFAULT_SCHEMA_ADAPTERS: {
  readonly [K in SchemaPageKind]: SchemaBuilder<K>;
} = Object.freeze({
  home: homeSchemaAdapter,
  static: staticSchemaAdapter,
  city: citySchemaAdapter,
  district: districtSchemaAdapter,
  category: categorySchemaAdapter,
  "city-type": cityTypeSchemaAdapter,
  institution: institutionSchemaAdapter,
  search: searchSchemaAdapter,
});
