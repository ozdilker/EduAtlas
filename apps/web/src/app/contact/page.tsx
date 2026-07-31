import { ContentPageView } from "@eduatlas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
};

export default function ContactPage() {
  return (
    <ContentPageView
      title="İletişim"
      description="EduAtlas ile ilgili sorularınız için iletişim sayfası yer tutucusu."
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "contact", label: "İletişim" },
      ]}
    >
      <p>
        İletişim formu bu sprintte bağlı değildir. Keşfe hub ve arama sayfalarından devam
        edebilirsiniz.
      </p>
    </ContentPageView>
  );
}
