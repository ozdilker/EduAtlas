"use client";

import { cn } from "../lib/cn";

export type OwnerAmenityOption = {
  id: string;
  label: string;
  selected: boolean;
};

export type OwnerAmenitiesFieldsProps = {
  options: readonly OwnerAmenityOption[];
  className?: string;
};

/**
 * Multi-select institution amenities — posts checkbox values as `amenities`.
 * Options come from the catalog so new amenities only need a catalog entry.
 */
export function OwnerAmenitiesFields({ options, className }: OwnerAmenitiesFieldsProps) {
  return (
    <div className={cn("ea-owner-profile-amenities", className)}>
      <p className="ea-owner-profile-form__section-text">
        Kurumunuzun sunduğu imkanları işaretleyin. Birden fazla seçebilirsiniz.
      </p>
      <ul className="ea-owner-profile-amenities__list">
        {options.map((option) => (
          <li key={option.id} className="ea-owner-profile-amenities__item">
            <label className="ea-owner-profile-amenities__label">
              <input
                type="checkbox"
                name="amenities"
                value={option.id}
                defaultChecked={option.selected}
              />
              <span>{option.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
