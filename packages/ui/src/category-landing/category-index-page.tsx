import { Breadcrumb } from "../city-landing/breadcrumb";
import { Badge } from "../components/badge";
import { getButtonClassName } from "../components/button-classes";
import { Container } from "../components/container";
import { getPriorityCategoryLinks } from "../layout/navigation";
import { PublicNextSteps } from "../layout/public-next-steps";
import { cn } from "../lib/cn";

export type CategoryIndexPageProps = {
  className?: string;
};

/**
 * Static /categories index — links into category hubs.
 */
export function CategoryIndexPage({ className }: CategoryIndexPageProps) {
  const categories = getPriorityCategoryLinks();

  return (
    <div className={cn("ea-hub-index", className)}>
      <Container size="xl" className="ea-hub-index__inner">
        <Breadcrumb
          items={[
            { id: "home", label: "Ana sayfa", href: "/" },
            { id: "categories", label: "Kurum tipleri" },
          ]}
        />
        <header className="ea-hub-index__header">
          <h1 className="ea-hub-index__title">Kurum tipleri</h1>
          <p className="ea-hub-index__description">
            Anaokulundan dershaneye, kurum türüne göre keşfe başlayın.
          </p>
          <a
            href="/cities"
            className={cn(getButtonClassName({ variant: "secondary", size: "md" }))}
          >
            Şehirlere göz at
          </a>
        </header>

        <ul className="ea-hub-index__grid">
          {categories.map((category) => (
            <li key={category.id}>
              <a href={category.href} className="ea-hub-index__card">
                <Badge tone="secondary">{category.label}</Badge>
                <span className="ea-hub-index__card-text">Türkiye’de {category.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <PublicNextSteps
          links={[
            { id: "cities", label: "Şehirler", href: "/cities" },
            { id: "search", label: "Arama", href: "/search" },
            { id: "institutions", label: "Kurumlar", href: "/institutions" },
            {
              id: "sample-category",
              label: "Dershane hub’ı",
              href: "/categories/dershane",
            },
          ]}
        />
      </Container>
    </div>
  );
}
