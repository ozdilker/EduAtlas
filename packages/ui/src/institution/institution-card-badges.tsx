import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import {
  getInstitutionCardBadgeLabels,
  type InstitutionCardBadgeFlags,
} from "./institution-card-content";

export type InstitutionCardBadgesProps = {
  typeLabel?: string;
  badges?: InstitutionCardBadgeFlags;
  programLabels?: readonly string[];
  /** Prefer trust (verified/premium) vs program chips. */
  variant?: "trust" | "programs" | "all";
  className?: string;
};

/**
 * Type + status badges — visual labels only.
 */
export function InstitutionCardBadges({
  typeLabel,
  badges,
  programLabels = [],
  variant = "all",
  className,
}: InstitutionCardBadgesProps) {
  const statusBadges = getInstitutionCardBadgeLabels(badges);
  const showTrust = variant === "trust" || variant === "all";
  const showPrograms = variant === "programs" || variant === "all";
  const programs = showPrograms
    ? [
        ...(typeLabel ? [{ id: "type", label: typeLabel, tone: "primary" as const }] : []),
        ...programLabels.map((label, index) => ({
          id: `program-${index}`,
          label,
          tone: "neutral" as const,
        })),
      ]
    : [];
  const trust = showTrust ? statusBadges : [];

  if (trust.length === 0 && programs.length === 0) {
    return null;
  }

  return (
    <ul
      className={cn(
        "ea-institution-card__badges",
        variant === "trust" && "ea-institution-card__badges--trust",
        variant === "programs" && "ea-institution-card__badges--programs",
        className,
      )}
      aria-label={variant === "trust" ? "Güven işaretleri" : "Kurum etiketleri"}
    >
      {trust.map((badge) => (
        <li key={badge.id}>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </li>
      ))}
      {programs.map((badge) => (
        <li key={badge.id}>
          <Badge tone={badge.tone === "neutral" ? "neutral" : badge.tone}>{badge.label}</Badge>
        </li>
      ))}
    </ul>
  );
}
