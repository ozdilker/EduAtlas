import { cn } from "../lib/cn";
import type { InstitutionGalleryItem } from "./institution-profile-content";

export type InstitutionGalleryProps = {
  items: InstitutionGalleryItem[];
  className?: string;
};

/**
 * Institution gallery — real images when URLs exist, placeholder otherwise.
 */
export function InstitutionGallery({ items, className }: InstitutionGalleryProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-gallery", className)}
      aria-labelledby="institution-gallery-heading"
    >
      <h2 id="institution-gallery-heading" className="ea-profile-section__title">
        Galeri
      </h2>
      <ul className="ea-profile-gallery__list">
        {items.map((item) => {
          const imageUrl = item.imageUrl?.trim();
          return (
            <li key={item.id}>
              <figure className="ea-profile-gallery__figure">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.label}
                    className="ea-profile-gallery__image"
                    loading="lazy"
                  />
                ) : (
                  <div className="ea-profile-gallery__placeholder" aria-hidden="true" />
                )}
                <figcaption className="ea-sr-only">{item.label}</figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
