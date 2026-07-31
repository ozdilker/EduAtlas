import { cn } from "../lib/cn";

export type InstitutionAboutProps = {
  description?: string;
  className?: string;
};

/**
 * Long-form institution description shown above highlights on the public profile.
 */
export function InstitutionAbout({ description, className }: InstitutionAboutProps) {
  const text = description?.trim();
  if (!text) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-about", className)}
      aria-labelledby="institution-about-heading"
    >
      <h2 id="institution-about-heading" className="ea-profile-section__title">
        Detaylı açıklama
      </h2>
      <div className="ea-profile-about__body">
        <p className="ea-profile-about__text">{text}</p>
      </div>
    </section>
  );
}
