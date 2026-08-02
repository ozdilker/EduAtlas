import {
  ContentPageView,
  LEGAL_CONTACT_EMAIL,
  LEGAL_PAGE_NEXT_STEPS,
} from "@eduatlas/ui";
import { MetadataEngine } from "@eduatlas/seo";
import { getSeoSiteConfig } from "@/lib/seo-site";

export const metadata = MetadataEngine.resolve("static", getSeoSiteConfig(), {
  pageId: "contact",
}).metadata;

export default function ContactPage() {
  return (
    <ContentPageView
      title="İletişim"
      description="Sorularınız, önerileriniz ve kurum başvurularınız için bize ulaşın."
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "contact", label: "İletişim" },
      ]}
      nextSteps={[
        { id: "about", label: "Hakkımızda", href: "/about" },
        { id: "claim", label: "Kurumunu Sahiplen", href: "/register" },
        ...LEGAL_PAGE_NEXT_STEPS.filter((item) => item.id !== "contact"),
      ]}
    >
      <p>
        EduAtlas ekibine e-posta ile ulaşabilirsiniz. Kurum sahiplenme, teknik destek, iş birliği
        ve KVKK başvuruları için:
      </p>
      <p>
        <a className="ea-contact-email" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
          {LEGAL_CONTACT_EMAIL}
        </a>
      </p>
      <p>
        Mümkün olduğunca kısa sürede dönüş yapmaya çalışırız. Kurum profili ve lead yönetimi için{" "}
        <a href="/login">Kurum Girişi</a> veya <a href="/register">Kurumunu Sahiplen</a>{" "}
        adımlarını kullanabilirsiniz.
      </p>
    </ContentPageView>
  );
}
