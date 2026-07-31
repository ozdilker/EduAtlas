import { ContentPageView } from "@eduatlas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
};

export default function TermsPage() {
  return (
    <ContentPageView
      title="Kullanım Koşulları"
      description="Kullanım koşulları yer tutucusu — yasal metin sonraki sprintte yayınlanacaktır."
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "terms", label: "Kullanım Koşulları" },
      ]}
    />
  );
}
