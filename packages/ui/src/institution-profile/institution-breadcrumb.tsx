import { cn } from "../lib/cn";
import type { InstitutionBreadcrumbItem } from "./institution-profile-content";

export type InstitutionBreadcrumbProps = {
  items: InstitutionBreadcrumbItem[];
  className?: string;
};

/**
 * Profile breadcrumb trail — static links only.
 */
export function InstitutionBreadcrumb({ items, className }: InstitutionBreadcrumbProps) {
  return (
    <nav className={cn("ea-profile-breadcrumb", className)} aria-label="Breadcrumb">
      <ol className="ea-profile-breadcrumb__list">
        {items.map((item, index) => {
          const current = index === items.length - 1;

          return (
            <li key={item.id} className="ea-profile-breadcrumb__item">
              {current || !item.href ? (
                <span aria-current={current ? "page" : undefined}>{item.label}</span>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
