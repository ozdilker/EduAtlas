import { cn } from "../lib/cn";
import type { CategoryFaqItem } from "./category-landing-content";

export type FAQPreviewProps = {
  faqs: CategoryFaqItem[];
  className?: string;
};

/**
 * FAQ preview using native details/summary — no accordion state management.
 */
export function FAQPreview({ faqs, className }: FAQPreviewProps) {
  if (faqs.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-category-section", "ea-category-faq", className)}
      aria-labelledby="category-faq-heading"
    >
      <h2 id="category-faq-heading" className="ea-category-section__title">
        Sıkça sorulan sorular
      </h2>
      <div className="ea-category-faq__list">
        {faqs.map((faq) => (
          <details key={faq.id} className="ea-category-faq__item">
            <summary className="ea-category-faq__summary">{faq.question}</summary>
            <p className="ea-category-faq__answer">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
