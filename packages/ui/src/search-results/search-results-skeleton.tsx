import { InstitutionCardSkeleton } from "../institution/institution-card-skeleton";
import { cn } from "../lib/cn";

export type SearchResultsSkeletonProps = {
  count?: number;
  className?: string;
};

const SKELETON_SLOT_IDS = [
  "slot-a",
  "slot-b",
  "slot-c",
  "slot-d",
  "slot-e",
  "slot-f",
  "slot-g",
  "slot-h",
  "slot-i",
] as const;

/**
 * Results-area loading placeholders — presentation only.
 */
export function SearchResultsSkeleton({ count = 6, className }: SearchResultsSkeletonProps) {
  const slots = SKELETON_SLOT_IDS.slice(0, Math.max(1, Math.min(count, SKELETON_SLOT_IDS.length)));

  return (
    <section
      className={cn("ea-search-results__skeleton", className)}
      aria-busy="true"
      aria-live="polite"
      aria-label="Sonuçlar yükleniyor"
    >
      <ul className="ea-search-results__grid">
        {slots.map((slotId) => (
          <li key={slotId} className="ea-search-results__grid-item">
            <InstitutionCardSkeleton layout="horizontal" />
          </li>
        ))}
      </ul>
    </section>
  );
}
