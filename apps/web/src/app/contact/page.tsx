import { formatOrganizationAddressMultiline } from "@eduatlas/domain";
import { MetadataEngine } from "@eduatlas/seo";
import { ContentPageView, LEGAL_PAGE_NEXT_STEPS } from "@eduatlas/ui";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getPublicOrganizationContact } from "@/server/site/get-public-organization-contact";

export const metadata = MetadataEngine.resolve("static", getSeoSiteConfig(), {
  pageId: "contact",
}).metadata;

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

export default async function ContactPage() {
  const contact = await getPublicOrganizationContact();
  const address = formatOrganizationAddressMultiline(contact);
  const phoneHref = telHref(contact.phone);

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
        <strong>{contact.displayName}</strong>
      </p>
      <p>
        E-posta:{" "}
        <a className="ea-contact-email" href={`mailto:${contact.email}`}>
          {contact.email}
        </a>
      </p>
      {contact.phone ? (
        <p>
          Telefon:{" "}
          {phoneHref ? (
            <a className="ea-contact-email" href={phoneHref}>
              {contact.phone}
            </a>
          ) : (
            contact.phone
          )}
        </p>
      ) : null}
      {address.trim() ? (
        <address className="ea-contact-address">
          {address.split("\n").map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </address>
      ) : null}
      <p>
        Mümkün olduğunca kısa sürede dönüş yapmaya çalışırız. Kurum profili ve lead yönetimi için{" "}
        <a href="/login">Kurum Girişi</a> veya <a href="/register">Kurumunu Sahiplen</a>{" "}
        adımlarını kullanabilirsiniz.
      </p>
    </ContentPageView>
  );
}
