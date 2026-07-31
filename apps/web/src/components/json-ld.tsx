import { type JsonLdObject, serializeJsonLd } from "@eduatlas/seo";

type JsonLdProps = {
  data: JsonLdObject | JsonLdObject[];
};

/**
 * Renders JSON-LD as a script tag for App Router pages.
 */
export function JsonLd({ data }: JsonLdProps) {
  if (Array.isArray(data) && data.length === 0) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be an inline script payload
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
