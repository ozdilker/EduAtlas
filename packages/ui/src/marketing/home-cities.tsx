import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { getHomePopularCities } from "./home-content";

export type HomeCitiesProps = {
  /** Optional per-city image URLs keyed by city id (istanbul, ankara, …). */
  cityImageUrls?: Readonly<Partial<Record<string, string>>>;
  className?: string;
};

/**
 * Popular cities as educational hubs — not a flat directory list.
 */
export function HomeCities({ cityImageUrls, className }: HomeCitiesProps) {
  const cities = getHomePopularCities();

  return (
    <section className={cn("ea-home-cities", className)} aria-labelledby="home-cities-heading">
      <Container size="xl">
        <header className="ea-home-section-header">
          <p className="ea-marketing-eyebrow">Yerel atlas</p>
          <h2 id="home-cities-heading" className="ea-home-section-title">
            Popüler şehirlerdeki kurumlar
          </h2>
          <p className="ea-home-section-lede">
            Şehir hub’larıyla mahallenize yakın seçenekleri keşfedin.
          </p>
        </header>

        <ul className="ea-home-cities__grid">
          {cities.map((item) => {
            const imageUrl = cityImageUrls?.[item.id]?.trim();
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  className={cn(
                    "ea-home-cities__card",
                    imageUrl && "ea-home-cities__card--photo",
                  )}
                  data-city={item.id}
                >
                  <span
                    className="ea-home-cities__visual"
                    aria-hidden="true"
                    style={
                      imageUrl
                        ? { ["--ea-home-city-image" as string]: `url("${imageUrl}")` }
                        : undefined
                    }
                  />
                  <span className="ea-home-cities__body">
                    <span className="ea-home-cities__name">{item.label}</span>
                    <span className="ea-home-cities__meta">{item.countLabel ?? "Kurumları gör"}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
