import { Badge } from "../components/badge";
import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { getHomePopularCities, getHomePopularTypes } from "./home-content";

export type HomeDiscoveryProps = {
  className?: string;
};

/**
 * Popular types and cities shortcuts — static UI links only.
 */
export function HomeDiscovery({ className }: HomeDiscoveryProps) {
  const types = getHomePopularTypes();
  const cities = getHomePopularCities();

  return (
    <div className={cn("ea-home-discovery", className)}>
      <Container size="lg" className="ea-home-discovery__inner">
        <section className="ea-home-discovery__section" aria-labelledby="home-types-heading">
          <h2 id="home-types-heading" className="ea-home-section-title">
            Popüler kurum türleri
          </h2>
          <ul className="ea-home-chip-list">
            {types.map((item) => (
              <li key={item.id}>
                <a href={item.href} className="ea-home-chip">
                  <Badge tone="primary">{item.label}</Badge>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="ea-home-discovery__section" aria-labelledby="home-cities-heading">
          <h2 id="home-cities-heading" className="ea-home-section-title">
            Popüler şehirler
          </h2>
          <ul className="ea-home-chip-list">
            {cities.map((item) => (
              <li key={item.id}>
                <a href={item.href} className="ea-home-chip">
                  <Badge tone="secondary">{item.label}</Badge>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </div>
  );
}
