import { PublicStatusBlock } from "../layout/public-status";
import { cn } from "../lib/cn";
import { getInstitutionCardEmptyClassName } from "./institution-card-classes";
import { getInstitutionCardEmptyMessage } from "./institution-card-content";

export type InstitutionCardEmptyProps = {
  message?: string;
  className?: string;
};

/**
 * Empty placeholder when no institution cards are available.
 */
export function InstitutionCardEmpty({
  message = getInstitutionCardEmptyMessage(),
  className,
}: InstitutionCardEmptyProps) {
  return (
    <div className={cn(getInstitutionCardEmptyClassName(className))}>
      <PublicStatusBlock
        title="Kurum bulunamadı"
        message={message}
        tone="empty"
        centered
        titleAs="h2"
        primaryAction={{ id: "search", label: "Aramaya git", href: "/search" }}
        actions={[
          { id: "cities", label: "Şehirler", href: "/cities" },
          { id: "categories", label: "Kurum tipleri", href: "/categories" },
        ]}
        className="ea-institution-card__empty-surface"
      />
    </div>
  );
}
