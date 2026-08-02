import { buildBreadcrumbJsonLd } from "../json-ld/breadcrumb";
import { buildOrganizationJsonLd } from "../json-ld/organization";
import { buildWebsiteJsonLd } from "../json-ld/website";
import type { JsonLdObject } from "../types";
import type {
  SchemaBuilder,
  SchemaBuildContext,
  SchemaPageKind,
} from "./types";

/**
 * Temporary adapters — wrap legacy json-ld helpers so behavior stays identical.
 * Later PRDs replace these with first-class SchemaBuilder implementations.
 */

export const homeSchemaAdapter: SchemaBuilder<"home"> = Object.freeze({
  kind: "home",
  build({ site }: SchemaBuildContext<"home">): readonly JsonLdObject[] {
    return Object.freeze([buildOrganizationJsonLd(site), buildWebsiteJsonLd(site)]);
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

export const citySchemaAdapter: SchemaBuilder<"city"> = Object.freeze({
  kind: "city",
  build({ site, input }: SchemaBuildContext<"city">): readonly JsonLdObject[] {
    return Object.freeze([
      buildBreadcrumbJsonLd(
        [
          { name: "Ana sayfa", path: "/" },
          { name: "Şehirler", path: "/cities" },
          { name: input.cityName },
        ],
        site,
      ),
    ]);
  },
});

export const districtSchemaAdapter: SchemaBuilder<"district"> = Object.freeze({
  kind: "district",
  build({ site, input }: SchemaBuildContext<"district">): readonly JsonLdObject[] {
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
    ]);
  },
});

export const categorySchemaAdapter: SchemaBuilder<"category"> = Object.freeze({
  kind: "category",
  build({ site, input }: SchemaBuildContext<"category">): readonly JsonLdObject[] {
    return Object.freeze([
      buildBreadcrumbJsonLd(
        [
          { name: "Ana sayfa", path: "/" },
          { name: "Kategoriler", path: "/categories" },
          { name: input.categoryName },
        ],
        site,
      ),
    ]);
  },
});

export const cityTypeSchemaAdapter: SchemaBuilder<"city-type"> = Object.freeze({
  kind: "city-type",
  build({ site, input }: SchemaBuildContext<"city-type">): readonly JsonLdObject[] {
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
