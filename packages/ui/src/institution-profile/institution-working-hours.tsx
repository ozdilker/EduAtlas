import { cn } from "../lib/cn";

export type InstitutionWorkingHoursDay = {
  id: string;
  label: string;
  isOpen: boolean;
  hoursLabel?: string;
};

export type InstitutionWorkingHoursProps = {
  days: readonly InstitutionWorkingHoursDay[];
  className?: string;
};

/**
 * Weekly working hours from the owner profile.
 */
export function InstitutionWorkingHours({ days, className }: InstitutionWorkingHoursProps) {
  if (days.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-hours", className)}
      aria-labelledby="institution-hours-heading"
    >
      <h2 id="institution-hours-heading" className="ea-profile-section__title">
        Çalışma saatleri
      </h2>
      <ul className="ea-profile-hours__list">
        {days.map((day) => (
          <li key={day.id} className="ea-profile-hours__row">
            <span className="ea-profile-hours__day">{day.label}</span>
            <span
              className={cn(
                "ea-profile-hours__value",
                !day.isOpen && "ea-profile-hours__value--closed",
              )}
            >
              {day.isOpen ? (day.hoursLabel ?? "Açık") : "Kapalı"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
