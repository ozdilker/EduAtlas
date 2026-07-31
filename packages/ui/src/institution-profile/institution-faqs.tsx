import { cn } from "../lib/cn";
import type { InstitutionFaqItem } from "./institution-profile-content";

export type InstitutionFaqsProps = {
  faqs: InstitutionFaqItem[];
  className?: string;
};

/**
 * Public FAQ section using native details/summary.
 */
export function InstitutionFaqs({ faqs, className }: InstitutionFaqsProps) {
  if (faqs.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-faqs", className)}
      aria-labelledby="institution-faqs-heading"
    >
      <h2 id="institution-faqs-heading" className="ea-profile-section__title">
        Sık sorulan sorular
      </h2>
      <div className="ea-profile-faqs__list">
        {faqs.map((faq) => (
          <details key={faq.id} className="ea-profile-faqs__item">
            <summary className="ea-profile-faqs__summary">{faq.question}</summary>
            <p className="ea-profile-faqs__answer">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
