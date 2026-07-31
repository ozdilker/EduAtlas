import { ContentPageView } from "@eduatlas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik",
};

export default function PrivacyPage() {
  return (
    <ContentPageView
      title="Gizlilik"
      description="Gizlilik politikası yer tutucusu — yasal metin sonraki sprintte yayınlanacaktır."
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "privacy", label: "Gizlilik" },
      ]}
    />
  );
}
