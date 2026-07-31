import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import type { InstitutionProfileViewData } from "./institution-profile-content";

export type InstitutionTrustStripProps = {
  profile: InstitutionProfileViewData;
  className?: string;
};

/**
 * Verification / trust signals under the hero — no teacher lists.
 */
export function InstitutionTrustStrip({ profile, className }: InstitutionTrustStripProps) {
  const signals = [
    profile.verified
      ? { id: "verified", label: "Doğrulanmış kurum", tone: "success" as const }
      : null,
    { id: "type", label: profile.typeLabel, tone: "primary" as const },
    profile.premium ? { id: "premium", label: "Premium profil", tone: "warning" as const } : null,
    { id: "local", label: `${profile.district}, ${profile.city}`, tone: "neutral" as const },
    { id: "contact", label: "Bilgi talebi açık", tone: "info" as const },
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    tone: "success" | "primary" | "warning" | "neutral" | "info";
  }>;

  return (
    <section
      className={cn("ea-profile-trust", className)}
      aria-labelledby="institution-trust-heading"
    >
      <h2 id="institution-trust-heading" className="ea-sr-only">
        Güven işaretleri
      </h2>
      <ul className="ea-profile-trust__list">
        {signals.map((signal) => (
          <li key={signal.id} className="ea-profile-trust__item">
            <Badge tone={signal.tone}>{signal.label}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
