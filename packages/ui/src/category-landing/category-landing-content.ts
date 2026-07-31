import type { CityBreadcrumbItem } from "../city-landing/city-landing-content";
import type { InstitutionCardViewData } from "../institution/institution-card-content";

export type CategoryStatItem = {
  id: string;
  label: string;
  value: string;
};

export type CategoryCityItem = {
  id: string;
  label: string;
  href: string;
};

export type RelatedCategoryItem = {
  id: string;
  label: string;
  href: string;
  description: string;
};

export type BuyingGuideSection = {
  id: string;
  title: string;
  body: string;
};

export type CategoryFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type CategoryLandingViewData = {
  slug: string;
  /** Domain InstitutionType id used in /search?type=… */
  typeId: string;
  name: string;
  title: string;
  description: string;
  breadcrumbs: CityBreadcrumbItem[];
  statistics: CategoryStatItem[];
  popularCities: CategoryCityItem[];
  featuredInstitutions: InstitutionCardViewData[];
  relatedCategories: RelatedCategoryItem[];
  buyingGuide: BuyingGuideSection[];
  faqs: CategoryFaqItem[];
};

const CATEGORY_LABELS: Record<string, string> = {
  dershane: "Dershane",
  anaokulu: "Anaokulu",
  kres: "Kreş",
  "ozel-okul": "Özel Okul",
  "etut-merkezi": "Etüt Merkezi",
  "dil-kursu": "Dil Kursu",
};

const CATEGORY_TYPE_IDS: Readonly<Record<string, string>> = Object.freeze({
  dershane: "dershane",
  anaokulu: "kindergarten",
  kres: "preschool",
  "ozel-okul": "private_school",
  "etut-merkezi": "etut_merkezi",
  "dil-kursu": "language_school",
  "dil-okulu": "language_school",
});

function getCategoryName(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}

/**
 * Static national category/type hub data (UI only).
 * Route shape: `/categories/{slug}` — city×category links use `/cities/{city}/types/{slug}`.
 */
export function getStaticCategoryLanding(slug = "dershane"): CategoryLandingViewData {
  const name = getCategoryName(slug);
  const categoryPath = `/categories/${slug}`;

  return {
    slug,
    typeId: CATEGORY_TYPE_IDS[slug] ?? slug,
    name,
    title: `Türkiye’de ${name}ler`,
    description: `${name} kurumlarını şehir ve ilçe bazında keşfedin.`,
    breadcrumbs: [
      { id: "home", label: "Ana sayfa", href: "/" },
      { id: "categories", label: "Kategoriler", href: "/categories" },
      { id: "current", label: name },
    ],
    statistics: [
      { id: "institutions", label: "Kurum profili", value: "80+" },
      { id: "cities", label: "Şehir", value: "10+" },
      { id: "guides", label: "Rehber maddesi", value: "5" },
      { id: "faqs", label: "SSS", value: "4" },
    ],
    popularCities: [
      { id: "istanbul", label: "İstanbul", href: `/cities/istanbul/types/${slug}` },
      { id: "ankara", label: "Ankara", href: `/cities/ankara/types/${slug}` },
      { id: "izmir", label: "İzmir", href: `/cities/izmir/types/${slug}` },
      { id: "bursa", label: "Bursa", href: `/cities/bursa/types/${slug}` },
      { id: "antalya", label: "Antalya", href: `/cities/antalya/types/${slug}` },
      { id: "gaziantep", label: "Gaziantep", href: `/cities/gaziantep/types/${slug}` },
    ],
    featuredInstitutions: [
      {
        id: `${slug}-feat-1`,
        name: `Örnek ${name} İstanbul`,
        href: `/institutions/ornek-${slug}-istanbul`,
        typeLabel: name,
        city: "İstanbul",
        district: "Kadıköy",
        snippet: "Kategori hub’ında öne çıkan statik kurum kartı.",
        badges: { verified: true, premium: true },
        ctaLabel: "İncele",
      },
      {
        id: `${slug}-feat-2`,
        name: `Örnek ${name} Ankara`,
        href: `/institutions/ornek-${slug}-ankara`,
        typeLabel: name,
        city: "Ankara",
        district: "Çankaya",
        snippet: "Statik öne çıkan kurum örneği.",
        badges: { verified: true },
        ctaLabel: "İncele",
      },
      {
        id: `${slug}-feat-3`,
        name: `Örnek ${name} İzmir`,
        href: `/institutions/ornek-${slug}-izmir`,
        typeLabel: name,
        city: "İzmir",
        district: "Karşıyaka",
        snippet: "Kategori sayfası için örnek kart.",
        badges: { featured: true },
        ctaLabel: "İncele",
      },
      {
        id: `${slug}-feat-4`,
        name: `Örnek ${name} Bursa`,
        href: `/institutions/ornek-${slug}-bursa`,
        typeLabel: name,
        city: "Bursa",
        district: "Nilüfer",
        snippet: "Statik featured kurum kartı.",
        badges: { premium: true },
        ctaLabel: "İncele",
      },
      {
        id: `${slug}-feat-5`,
        name: `Örnek ${name} Antalya`,
        href: `/institutions/ornek-${slug}-antalya`,
        typeLabel: name,
        city: "Antalya",
        district: "Muratpaşa",
        snippet: "Hub listesi için yer tutucu kart.",
        badges: { verified: true },
        ctaLabel: "İncele",
      },
      {
        id: `${slug}-feat-6`,
        name: `Örnek ${name} Gaziantep`,
        href: `/institutions/ornek-${slug}-gaziantep`,
        typeLabel: name,
        city: "Gaziantep",
        district: "Şahinbey",
        snippet: "Statik kategori hub kurum örneği.",
        badges: {},
        ctaLabel: "İncele",
      },
    ],
    relatedCategories: [
      {
        id: "anaokulu",
        label: "Anaokulu",
        href: "/categories/anaokulu",
        description: "Okul öncesi kurumlar",
      },
      {
        id: "kres",
        label: "Kreş",
        href: "/categories/kres",
        description: "Kreş ve bakım seçenekleri",
      },
      {
        id: "ozel-okul",
        label: "Özel Okul",
        href: "/categories/ozel-okul",
        description: "Özel okul alternatifleri",
      },
      {
        id: "etut-merkezi",
        label: "Etüt Merkezi",
        href: "/categories/etut-merkezi",
        description: "Etüt ve destek programları",
      },
      {
        id: "dil-kursu",
        label: "Dil Kursu",
        href: "/categories/dil-kursu",
        description: "Dil eğitimi kurumları",
      },
      {
        id: "dershane",
        label: "Dershane",
        href: "/categories/dershane",
        description: "Sınav ve dershane seçenekleri",
      },
    ].filter((item) => item.id !== slug),
    buyingGuide: [
      {
        id: "needs",
        title: "İhtiyacı netleştirin",
        body: `${name} seçerken yaş grubu, program ve ulaşım önceliklerinizi listeleyin.`,
      },
      {
        id: "compare",
        title: "Birkaç kurumu karşılaştırın",
        body: "Konum, program özeti ve iletişim seçeneklerini yan yana değerlendirin.",
      },
      {
        id: "visit",
        title: "Bilgi alın ve ziyaret planlayın",
        body: "İlgilendiğiniz kurumlara bilgi talebi bırakın; mümkünse yerinde görün.",
      },
      {
        id: "verify",
        title: "Doğrulama sinyallerine bakın",
        body: "Doğrulanmış ve sahiplenilmiş profiller güven için yardımcı işaretlerdir.",
      },
      {
        id: "decide",
        title: "Kararınızı belgeleyin",
        body: "Ücret, saat ve kayıt koşullarını yazılı olarak netleştirin.",
      },
    ],
    faqs: [
      {
        id: "faq-1",
        question: `${name} nasıl seçilir?`,
        answer:
          "Önce ihtiyaçlarınızı belirleyin, ardından şehir ve ilçe filtreleriyle adayları daraltın. Bu sayfa yalnızca arayüz örneğidir.",
      },
      {
        id: "faq-2",
        question: "Şehir bazlı sayfalar var mı?",
        answer: `Evet. Örneğin Ankara için ${categoryPath} ile uyumlu şehir×kategori yolu /cities/ankara/types/${slug} şeklindedir.`,
      },
      {
        id: "faq-3",
        question: "Kurum bilgileri güncel mi?",
        answer:
          "Bu sprintte veriler statik yer tutucudur. Canlı katalog sonraki sprintlerde bağlanacaktır.",
      },
      {
        id: "faq-4",
        question: "Bilgi talebi gönderebilir miyim?",
        answer:
          "Profil sayfalarında görsel bilgi formu vardır; gönderim mantığı bu sprintte yoktur.",
      },
    ],
  };
}
