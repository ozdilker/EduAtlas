import { Badge } from "../components/badge";
import { cn } from "../lib/cn";

export type OwnerRecommendationView = {
  id: string;
  type: string;
  priority: "high" | "medium" | "low";
  priorityLabel: string;
  ruleId: string;
  title: string;
  message: string;
};

export type OwnerRecommendationsView = {
  title: string;
  description: string;
  count: number;
  items: readonly OwnerRecommendationView[];
};

export type OwnerRecommendationsWidgetProps = {
  recommendations: OwnerRecommendationsView;
  className?: string;
};

function priorityTone(
  priority: OwnerRecommendationView["priority"],
): "info" | "warning" | "neutral" {
  switch (priority) {
    case "high":
      return "warning";
    case "medium":
      return "info";
    default:
      return "neutral";
  }
}

/**
 * Live profile + lead rule recommendations — read-only, no automatic actions.
 */
export function OwnerRecommendationsWidget({
  recommendations,
  className,
}: OwnerRecommendationsWidgetProps) {
  return (
    <section
      className={cn("ea-owner-widget", "ea-owner-widget--recommendations", className)}
      aria-labelledby="owner-recommendations-heading"
    >
      <header className="ea-owner-widget__header">
        <h2 id="owner-recommendations-heading" className="ea-owner-widget__title">
          {recommendations.title}
        </h2>
        <span className="ea-owner-pipeline__column-count">{recommendations.count}</span>
      </header>
      <p className="ea-owner-widget__description">{recommendations.description}</p>

      {recommendations.items.length === 0 ? (
        <p className="ea-owner-leads-empty" role="status">
          Şu an için öneri yok. Profil ve talep durumunuz sağlıklı göründüğünde burası boş kalır.
        </p>
      ) : (
        <ul className="ea-owner-recommendations-list">
          {recommendations.items.map((item) => (
            <li key={item.id} className="ea-owner-recommendations-list__item">
              <div className="ea-owner-recommendations-list__top">
                <h3 className="ea-owner-recommendations-list__title">{item.title}</h3>
                <Badge tone={priorityTone(item.priority)}>{item.priorityLabel}</Badge>
              </div>
              <p className="ea-owner-recommendations-list__message">{item.message}</p>
              <p className="ea-owner-recommendations-list__meta">{item.ruleId}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
