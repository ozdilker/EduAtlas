import type { ReactNode } from "react";

export type LegalSection = Readonly<{
  id: string;
  title: string;
  children: ReactNode;
}>;

export type LegalDocumentProps = {
  updatedAtLabel: string;
  sections: readonly LegalSection[];
};

/**
 * Structured legal prose for static trust pages.
 */
export function LegalDocument({ updatedAtLabel, sections }: LegalDocumentProps) {
  return (
    <div className="ea-legal-doc">
      <p className="ea-legal-doc__meta">Son güncelleme: {updatedAtLabel}</p>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="ea-legal-doc__section">
          <h2 className="ea-legal-doc__heading">{section.title}</h2>
          <div className="ea-legal-doc__content">{section.children}</div>
        </section>
      ))}
    </div>
  );
}

export const LEGAL_UPDATED_AT_LABEL = "31 Temmuz 2026";

export const LEGAL_CONTACT_EMAIL = "info@eduatlas.com.tr";

export const LEGAL_PAGE_NEXT_STEPS = [
  { id: "privacy", label: "Gizlilik Politikası", href: "/privacy" },
  { id: "terms", label: "Kullanım Koşulları", href: "/terms" },
  { id: "kvkk", label: "KVKK", href: "/kvkk" },
  { id: "cookies", label: "Çerez Politikası", href: "/cookies" },
  { id: "contact", label: "İletişim", href: "/contact" },
] as const;
