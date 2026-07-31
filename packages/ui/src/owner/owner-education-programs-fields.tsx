"use client";

import { cn } from "../lib/cn";

export type OwnerEducationProgramOption = {
  id: string;
  label: string;
  selected: boolean;
};

export type OwnerEducationProgramsFieldsProps = {
  options: readonly OwnerEducationProgramOption[];
  className?: string;
};

/**
 * Multi-select education programs — posts checkbox values as `educationPrograms`.
 * Options come from the catalog so new programs only need a catalog entry.
 */
export function OwnerEducationProgramsFields({
  options,
  className,
}: OwnerEducationProgramsFieldsProps) {
  return (
    <div className={cn("ea-owner-profile-programs", className)}>
      <p className="ea-owner-profile-form__section-text">
        Sunduğunuz eğitim programlarını işaretleyin. Birden fazla seçebilirsiniz.
      </p>
      <ul className="ea-owner-profile-programs__list">
        {options.map((option) => (
          <li key={option.id} className="ea-owner-profile-programs__item">
            <label className="ea-owner-profile-programs__label">
              <input
                type="checkbox"
                name="educationPrograms"
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
