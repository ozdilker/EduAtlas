import { cn } from "../lib/cn";
import type { CityBreadcrumbItem } from "./city-landing-content";

export type BreadcrumbProps = {
  items: CityBreadcrumbItem[];
  className?: string;
  label?: string;
};

/**
 * Reusable breadcrumb trail for public hub pages.
 */
export function Breadcrumb({ items, className, label = "Breadcrumb" }: BreadcrumbProps) {
  return (
    <nav className={cn("ea-breadcrumb", className)} aria-label={label}>
      <ol className="ea-breadcrumb__list">
        {items.map((item, index) => {
          const current = index === items.length - 1;

          return (
            <li key={item.id} className="ea-breadcrumb__item">
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
