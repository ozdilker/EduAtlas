import { Container } from "../components/container";
import { InstitutionCard } from "../institution/institution-card";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { cn } from "../lib/cn";

export type HomeFeaturedProps = {
  institutions?: readonly InstitutionCardViewData[];
  className?: string;
};

/**
 * Featured institution strip on the homepage.
 */
export function HomeFeatured({ institutions = [], className }: HomeFeaturedProps) {
  if (institutions.length === 0) {
    return (
      <section className={cn("ea-home-featured", className)} aria-labelledby="home-featured-heading">
        <Container size="xl">
          <header className="ea-home-section-header">
            <p className="ea-marketing-eyebrow">Keşfet</p>
            <h2 id="home-featured-heading" className="ea-home-section-title">
              Yayınlı kurumlar
            </h2>
            <p className="ea-home-section-lede">
              Henüz öne çıkarılacak yayınlı kurum yok. Arama sayfasından keşfe devam edin.
            </p>
          </header>
          <p className="ea-home-featured__more">
            <a href="/search">Arama sayfasına git</a>
          </p>
        </Container>
      </section>
    );
  }

  return (
    <section className={cn("ea-home-featured", className)} aria-labelledby="home-featured-heading">
      <Container size="xl">
        <header className="ea-home-section-header">
          <p className="ea-marketing-eyebrow">Keşfet</p>
          <h2 id="home-featured-heading" className="ea-home-section-title">
            Öne çıkan kurumlar
          </h2>
          <p className="ea-home-section-lede">
            Yayınlı kurumlardan bir seçki — tümünü arama sayfasında filtreleyebilirsiniz.
          </p>
        </header>

        <ul className="ea-home-featured__grid">
          {institutions.map((institution) => (
            <li key={institution.id}>
              <InstitutionCard
                data={institution}
                layout="vertical"
                actions={{ showFavorite: true, showCta: true }}
              />
            </li>
          ))}
        </ul>

        <p className="ea-home-featured__more">
          <a href="/search">Tüm arama sonuçlarını gör</a>
        </p>
      </Container>
    </section>
  );
}
