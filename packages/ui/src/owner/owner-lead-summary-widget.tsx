import { cn } from "../lib/cn";
import type { OwnerLeadSummaryView } from "./owner-portal-content";

export type OwnerLeadSummaryWidgetProps = {
  summary: OwnerLeadSummaryView;
  className?: string;
};

/**
 * Lead summary counts widget for the owner dashboard.
 */
export function OwnerLeadSummaryWidget({ summary, className }: OwnerLeadSummaryWidgetProps) {
  const items = [
    { id: "total", label: "Toplam", value: summary.total },
    { id: "pending", label: "Bekleyen", value: summary.pending },
    { id: "new", label: "Yeni", value: summary.newCount },
    { id: "contacted", label: "İletişim", value: summary.contactedCount },
    { id: "appointment", label: "Randevu", value: summary.appointmentCount },
    { id: "enrolled", label: "Kayıt", value: summary.enrolledCount },
    { id: "lost", label: "Kayıp", value: summary.lostCount },
  ] as const;

  return (
    <section
      className={cn("ea-owner-widget", "ea-owner-widget--lead-summary", className)}
      aria-labelledby="owner-lead-summary-heading"
    >
      <h2 id="owner-lead-summary-heading" className="ea-owner-widget__title">
        Talep özeti
      </h2>
      <ul className="ea-owner-stat-grid">
        {items.map((item) => (
          <li key={item.id} className="ea-owner-stat-grid__item">
            <p className="ea-owner-stat-grid__value">{item.value}</p>
            <p className="ea-owner-stat-grid__label">{item.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
