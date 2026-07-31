import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { getHomePopularTypes } from "./home-content";

export type HomeCategoriesProps = {
  className?: string;
};

/**
 * Category discovery grid — 3×2 storytelling cards with category photography.
 */
export function HomeCategories({ className }: HomeCategoriesProps) {
  const types = getHomePopularTypes();

  return (
    <section
      className={cn("ea-home-categories", className)}
      aria-labelledby="home-categories-heading"
    >
      <Container size="xl">
        <header className="ea-home-section-header">
          <p className="ea-marketing-eyebrow">Keşif</p>
          <h2 id="home-categories-heading" className="ea-home-section-title">
            Kategorilere göre keşfedin
          </h2>
          <p className="ea-home-section-lede">
            Ailenizin ihtiyacına uygun kurum türünü seçin; doğru kapıdan başlayın.
          </p>
        </header>

        <ul className="ea-home-categories__grid">
          {types.map((item) => (
            <li key={item.id}>
              <a href={item.href} className="ea-home-categories__card">
                <span className="ea-home-categories__media" aria-hidden="true">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="ea-home-categories__image"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="ea-home-categories__icon" data-type={item.id} />
                  )}
                </span>
                <span className="ea-home-categories__body">
                  <span className="ea-home-categories__name">{item.label}</span>
                  <span className="ea-home-categories__meta">{item.countLabel ?? "Keşfet"}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
