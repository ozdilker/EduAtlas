import { Badge } from "../components/badge";
import { getButtonClassName } from "../components/button-classes";
import { Container } from "../components/container";
import { getPriorityCityLinks } from "../layout/navigation";
import { PublicNextSteps } from "../layout/public-next-steps";
import { cn } from "../lib/cn";
import { Breadcrumb } from "./breadcrumb";

export type CityIndexPageProps = {
  className?: string;
};

/**
 * Static /cities index — links into city hubs.
 */
export function CityIndexPage({ className }: CityIndexPageProps) {
  const cities = getPriorityCityLinks();

  return (
    <div className={cn("ea-hub-index", className)}>
      <Container size="xl" className="ea-hub-index__inner">
        <Breadcrumb
          items={[
            { id: "home", label: "Ana sayfa", href: "/" },
            { id: "cities", label: "Şehirler" },
          ]}
        />
        <header className="ea-hub-index__header">
          <h1 className="ea-hub-index__title">Şehirler</h1>
          <p className="ea-hub-index__description">
            Türkiye’de eğitim kurumlarını şehir bazında keşfedin.
          </p>
          <a
            href="/search"
            className={cn(getButtonClassName({ variant: "secondary", size: "md" }))}
          >
            Arama sayfasına git
          </a>
        </header>

        <ul className="ea-hub-index__grid">
          {cities.map((city) => (
            <li key={city.id}>
              <a href={city.href} className="ea-hub-index__card">
                <Badge tone="primary">{city.label}</Badge>
                <span className="ea-hub-index__card-text">{city.label} eğitim kurumları</span>
              </a>
            </li>
          ))}
        </ul>

        <PublicNextSteps
          links={[
            { id: "categories", label: "Kurum tipleri", href: "/categories" },
            { id: "institutions", label: "Kurumları incele", href: "/institutions" },
            { id: "search", label: "Arama", href: "/search" },
            { id: "sample", label: "Örnek kurum profili", href: "/institutions/ornek-anaokulu" },
          ]}
        />
      </Container>
    </div>
  );
}
