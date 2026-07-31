import { Breadcrumb } from "../city-landing/breadcrumb";
import type { CityBreadcrumbItem } from "../city-landing/city-landing-content";
import { getButtonClassName } from "../components/button-classes";
import { Container } from "../components/container";
import { cn } from "../lib/cn";
import type { NavItem } from "./navigation";
import { PublicNextSteps } from "./public-next-steps";

export type HubPlaceholderPageProps = {
  title: string;
  description: string;
  breadcrumbs: CityBreadcrumbItem[];
  primaryHref: string;
  primaryLabel: string;
  nextSteps?: NavItem[];
  className?: string;
};

/**
 * Lightweight hub placeholder so nested city/district/type URLs are not dead ends.
 */
export function HubPlaceholderPage({
  title,
  description,
  breadcrumbs,
  primaryHref,
  primaryLabel,
  nextSteps,
  className,
}: HubPlaceholderPageProps) {
  return (
    <div className={cn("ea-hub-placeholder", className)}>
      <Container size="md" className="ea-hub-placeholder__inner">
        <Breadcrumb items={breadcrumbs} />
        <header className="ea-hub-placeholder__header">
          <h1 className="ea-hub-placeholder__title">{title}</h1>
          <p className="ea-hub-placeholder__description">{description}</p>
          <a
            href={primaryHref}
            className={cn(getButtonClassName({ variant: "primary", size: "md" }))}
          >
            {primaryLabel}
          </a>
        </header>
        <PublicNextSteps
          links={
            nextSteps ?? [
              { id: "search", label: "Arama", href: "/search" },
              { id: "cities", label: "Şehirler", href: "/cities" },
              { id: "categories", label: "Kurum tipleri", href: "/categories" },
              { id: "institutions", label: "Kurumlar", href: "/institutions" },
            ]
          }
        />
      </Container>
    </div>
  );
}
