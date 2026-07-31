import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import type { OwnerLeadDetailView } from "./owner-portal-content";

export type OwnerLeadDetailProps = {
  lead: OwnerLeadDetailView;
  className?: string;
};

/**
 * Read-only lead detail panel/page content.
 */
export function OwnerLeadDetail({ lead, className }: OwnerLeadDetailProps) {
  return (
    <article
      className={cn("ea-owner-lead-detail", className)}
      aria-labelledby="owner-lead-detail-title"
    >
      <header className="ea-owner-lead-detail__header">
        <div>
          <p className="ea-owner-lead-detail__eyebrow">Bilgi talebi</p>
          <h2 id="owner-lead-detail-title" className="ea-owner-lead-detail__title">
            {lead.parentName}
          </h2>
        </div>
        <Badge tone={lead.status === "new" ? "info" : "neutral"}>{lead.statusLabel}</Badge>
      </header>

      <dl className="ea-owner-lead-detail__facts">
        <div>
          <dt>Durum</dt>
          <dd>{lead.statusLabel}</dd>
        </div>
        <div>
          <dt>Telefon</dt>
          <dd>
            <a href={`tel:${lead.phone.replaceAll(/\s+/g, "")}`}>{lead.phone}</a>
          </dd>
        </div>
        {lead.email ? (
          <div>
            <dt>E-posta</dt>
            <dd>
              <a href={`mailto:${lead.email}`}>{lead.email}</a>
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Rol</dt>
          <dd>{lead.roleLabel}</dd>
        </div>
        {lead.preferredContactTime ? (
          <div>
            <dt>Tercih edilen zaman</dt>
            <dd>{lead.preferredContactTime}</dd>
          </div>
        ) : null}
        <div>
          <dt>Gönderim</dt>
          <dd>{lead.createdAtLabel}</dd>
        </div>
        <div>
          <dt>Onay</dt>
          <dd>{lead.consentAcceptedAtLabel}</dd>
        </div>
      </dl>

      <section
        className="ea-owner-lead-detail__message"
        aria-labelledby="owner-lead-message-heading"
      >
        <h3 id="owner-lead-message-heading">Mesaj</h3>
        <p>{lead.message}</p>
      </section>

      <p className="ea-owner-lead-detail__note">
        Bu ekran yalnızca okuma amaçlıdır. Durum güncelleme, bildirim ve CRM bu sprintte yoktur.
      </p>
    </article>
  );
}
