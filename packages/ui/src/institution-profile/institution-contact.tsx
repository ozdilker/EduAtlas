import { cn } from "../lib/cn";
import type { InstitutionContactItem } from "./institution-profile-content";

export type InstitutionContactProps = {
  items: InstitutionContactItem[];
  className?: string;
};

/**
 * Contact links — visual/link-only; no lead submission.
 */
export function InstitutionContact({ items, className }: InstitutionContactProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-contact", className)}
      aria-labelledby="institution-contact-heading"
    >
      <h2 id="institution-contact-heading" className="ea-profile-section__title">
        İletişim
      </h2>
      <ul className="ea-profile-contact__list">
        {items.map((item) => (
          <li key={item.id} className="ea-profile-contact__item">
            <span className="ea-profile-contact__label">{item.label}</span>
            {item.href ? (
              <a
                href={item.href}
                className="ea-profile-contact__value"
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                target={item.href.startsWith("http") ? "_blank" : undefined}
              >
                {item.value}
              </a>
            ) : (
              <span className="ea-profile-contact__value">{item.value}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
