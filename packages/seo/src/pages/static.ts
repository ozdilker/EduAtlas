import { buildBreadcrumbJsonLd } from "../json-ld/breadcrumb";
import { buildMetadata } from "../metadata";
import type { SeoSiteConfig } from "../types";
import type { PageSeoResult } from "./home";

export type StaticPageSeoId =
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "cookies"
  | "kvkk"
  | "cities-index"
  | "categories-index"
  | "institutions-index";

type StaticPageDefinition = Readonly<{
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly breadcrumbLabel: string;
}>;

const STATIC_PAGES: Readonly<Record<StaticPageSeoId, StaticPageDefinition>> = Object.freeze({
  about: {
    path: "/about",
    title: "Hakkımızda",
    description:
      "EduAtlas, ailelerin Türkiye'deki eğitim kurumlarını bilinçli ve güvenilir şekilde keşfetmesi için hayata geçirildi.",
    breadcrumbLabel: "Hakkımızda",
  },
  contact: {
    path: "/contact",
    title: "İletişim",
    description: "EduAtlas ile iletişime geçin — info@eduatlas.com.tr",
    breadcrumbLabel: "İletişim",
  },
  privacy: {
    path: "/privacy",
    title: "Gizlilik Politikası",
    description:
      "EduAtlas'ın kişisel verileri nasıl topladığı, kullandığı ve koruduğuna dair gizlilik politikası.",
    breadcrumbLabel: "Gizlilik",
  },
  terms: {
    path: "/terms",
    title: "Kullanım Koşulları",
    description:
      "EduAtlas platformunu kullanırken geçerli olan kullanım koşulları ve hizmet şartları.",
    breadcrumbLabel: "Kullanım koşulları",
  },
  cookies: {
    path: "/cookies",
    title: "Çerez Politikası",
    description: "EduAtlas'ın çerez ve benzeri teknolojileri nasıl kullandığına dair bilgilendirme.",
    breadcrumbLabel: "Çerezler",
  },
  kvkk: {
    path: "/kvkk",
    title: "KVKK Aydınlatma Metni",
    description: "6698 sayılı KVKK kapsamında EduAtlas kişisel veri işleme aydınlatma metni.",
    breadcrumbLabel: "KVKK",
  },
  "cities-index": {
    path: "/cities",
    title: "Şehirler",
    description: "Türkiye'de eğitim kurumlarını şehir bazında keşfedin.",
    breadcrumbLabel: "Şehirler",
  },
  "categories-index": {
    path: "/categories",
    title: "Kurum tipleri",
    description: "Anaokulundan dershaneye kurum türlerine göre keşfedin.",
    breadcrumbLabel: "Kurum tipleri",
  },
  "institutions-index": {
    path: "/institutions",
    title: "Kurumlar",
    description: "Türkiye'deki yayınlı eğitim kurumlarını keşfedin.",
    breadcrumbLabel: "Kurumlar",
  },
});

/**
 * Static / index page SEO from a fixed catalog (Open/Closed: add entries here).
 */
export function buildStaticPageSeo(
  site: SeoSiteConfig,
  options: {
    pageId: StaticPageSeoId;
    title?: string;
    description?: string;
  },
): PageSeoResult {
  const def = STATIC_PAGES[options.pageId];
  const title = options.title?.trim() || def.title;
  const description = options.description?.trim() || def.description;

  const metadata = buildMetadata({
    site,
    title: [title],
    description,
    path: def.path,
  });

  return {
    metadata,
    jsonLd: [
      buildBreadcrumbJsonLd(
        [{ name: "Ana sayfa", path: "/" }, { name: def.breadcrumbLabel }],
        site,
      ),
    ],
  };
}

export function listStaticPageSeoIds(): readonly StaticPageSeoId[] {
  return Object.keys(STATIC_PAGES) as StaticPageSeoId[];
}
