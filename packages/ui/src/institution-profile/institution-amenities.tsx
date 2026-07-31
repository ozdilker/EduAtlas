import { cn } from "../lib/cn";

export type InstitutionAmenityItem = {
  id: string;
  label: string;
};

export type InstitutionAmenitiesProps = {
  items: readonly InstitutionAmenityItem[];
  className?: string;
};

/**
 * Institution amenities / facilities list from the owner profile catalog.
 */
export function InstitutionAmenities({ items, className }: InstitutionAmenitiesProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-amenities", className)}
      aria-labelledby="institution-amenities-heading"
    >
      <h2 id="institution-amenities-heading" className="ea-profile-section__title">
        Kurum özellikleri
      </h2>
      <ul className="ea-profile-amenities__list">
        {items.map((item) => (
          <li key={item.id} className="ea-profile-amenities__item">
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
