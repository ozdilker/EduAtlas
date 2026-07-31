import { InstitutionCard } from "../institution/institution-card";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { cn } from "../lib/cn";

export type SearchRecommendationsStripProps = {
  institutions?: readonly InstitutionCardViewData[];
  className?: string;
};

/**
 * Static “AI ile size özel öneriler” rail — presentation only for now.
 */
export function SearchRecommendationsStrip({
  institutions = [],
  className,
}: SearchRecommendationsStripProps) {
  if (institutions.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-search-results__recommend", className)}
      aria-labelledby="search-recommendations-heading"
    >
      <header className="ea-search-results__recommend-header">
        <div>
          <p className="ea-search-results__recommend-eyebrow">AI ile size özel öneriler</p>
          <h2 id="search-recommendations-heading" className="ea-search-results__recommend-title">
            Size en uygun {institutions.length} kurum önerisi
          </h2>
          <p className="ea-search-results__recommend-copy">
            Konum, kurum türü ve güven işaretlerine göre öne çıkan örnekler. Kişisel model henüz
            bağlı değil — öneriler statiktir ve sıralamayı değiştirmez.
          </p>
          <p className="ea-search-results__recommend-why">
            Neden öneriyoruz? Karar vermeyi kolaylaştıran, güvenilir ve karşılaştırılabilir
            seçenekler.
          </p>
        </div>
        <span className="ea-search-results__recommend-badge">Statik</span>
      </header>

      <ul className="ea-search-results__recommend-list">
        {institutions.map((institution) => (
          <li key={institution.id} className="ea-search-results__recommend-item">
            <InstitutionCard
              data={institution}
              layout="compact"
              actions={{ showFavorite: true, showCta: true }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
