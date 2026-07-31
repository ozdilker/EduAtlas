import type { ReactNode } from "react";
import { Breadcrumb } from "../city-landing/breadcrumb";
import type { CityBreadcrumbItem } from "../city-landing/city-landing-content";
import { getButtonClassName } from "../components/button-classes";
import { Container } from "../components/container";
import { cn } from "../lib/cn";
import type { NavItem } from "./navigation";
import { PublicNextSteps } from "./public-next-steps";

export type ContentPageViewProps = {
  title: string;
  description: string;
  breadcrumbs?: CityBreadcrumbItem[];
  nextSteps?: NavItem[];
  children?: ReactNode;
  className?: string;
};

/**
 * Simple static content page shell for about/contact/legal/auth placeholders.
 */
export function ContentPageView({
  title,
  description,
  breadcrumbs,
  nextSteps = [
    { id: "search", label: "Aramaya git", href: "/search" },
    { id: "cities", label: "Şehirleri keşfet", href: "/cities" },
    { id: "categories", label: "Kurum tipleri", href: "/categories" },
    { id: "home", label: "Ana sayfa", href: "/" },
  ],
  children,
  className,
}: ContentPageViewProps) {
  return (
    <div className={cn("ea-content-page", className)}>
      <Container size="md" className="ea-content-page__inner">
        {breadcrumbs ? <Breadcrumb items={breadcrumbs} /> : null}
        <header className="ea-content-page__header">
          <h1 className="ea-content-page__title">{title}</h1>
          <p className="ea-content-page__description">{description}</p>
        </header>
        {children ? <div className="ea-content-page__body">{children}</div> : null}
        <PublicNextSteps links={nextSteps} />
      </Container>
    </div>
  );
}

export type AuthPlaceholderPageProps = {
  title: string;
  description: string;
  className?: string;
};

export function AuthPlaceholderPage({ title, description, className }: AuthPlaceholderPageProps) {
  return (
    <ContentPageView
      title={title}
      description={description}
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "current", label: title },
      ]}
      nextSteps={[
        { id: "home", label: "Ana sayfaya dön", href: "/" },
        { id: "claim", label: "Kurumunu Sahiplen", href: "/register" },
        { id: "search", label: "Kurum ara", href: "/search" },
      ]}
      className={className}
    >
      <p className="ea-content-page__note">
        Kimlik doğrulama bu sprintte bağlı değildir. Bu sayfa yalnızca gezinme sürekliliği için yer
        tutucudur.
      </p>
      <a href="/" className={cn(getButtonClassName({ variant: "primary", size: "md" }))}>
        Ana sayfaya dön
      </a>
    </ContentPageView>
  );
}
