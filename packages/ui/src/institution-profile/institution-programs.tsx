import { cn } from "../lib/cn";
import type { InstitutionProgramItem } from "./institution-profile-content";

export type InstitutionProgramsProps = {
  programs: InstitutionProgramItem[];
  className?: string;
};

/**
 * Education programs as equal-sized cards inside the section.
 */
export function InstitutionPrograms({ programs, className }: InstitutionProgramsProps) {
  if (programs.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-programs", className)}
      aria-labelledby="institution-programs-heading"
    >
      <h2 id="institution-programs-heading" className="ea-profile-section__title">
        Eğitim programları
      </h2>
      <ul className="ea-profile-programs__list">
        {programs.map((program) => (
          <li key={program.id} className="ea-profile-programs__item">
            <h3 className="ea-profile-programs__name">{program.name}</h3>
            {program.summary ? (
              <p className="ea-profile-programs__summary">{program.summary}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
