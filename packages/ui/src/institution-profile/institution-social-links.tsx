import { cn } from "../lib/cn";
import {
  PRODUCT_ANALYTICS_EVENTS,
  trackProductEvent,
} from "../analytics/track-product-event";
import type { InstitutionSocialLinkItem } from "./institution-profile-content";

export type InstitutionSocialLinksProps = {
  items: readonly InstitutionSocialLinkItem[];
  className?: string;
};

function socialPlatform(item: InstitutionSocialLinkItem): string {
  const id = item.id.toLowerCase();
  if (id.includes("instagram")) return "instagram";
  if (id.includes("facebook")) return "facebook";
  if (id.includes("youtube")) return "youtube";
  if (id.includes("linkedin")) return "linkedin";
  if (id.includes("twitter") || id === "x") return "x";
  return "other";
}

/**
 * Social media links box — only platforms the institution has configured.
 */
export function InstitutionSocialLinks({ items, className }: InstitutionSocialLinksProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-social", className)}
      aria-labelledby="institution-social-heading"
    >
      <h2 id="institution-social-heading" className="ea-profile-section__title">
        Sosyal medya
      </h2>
      <ul className="ea-profile-social__list">
        {items.map((item) => (
          <li key={item.id} className="ea-profile-social__item">
            <span className="ea-profile-social__label">{item.label}</span>
            <a
              href={item.href}
              className="ea-profile-social__value"
              rel="noopener noreferrer"
              target="_blank"
              onClick={() =>
                trackProductEvent(PRODUCT_ANALYTICS_EVENTS.SocialClick, {
                  platform: socialPlatform(item),
                })
              }
            >
              {item.value}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
