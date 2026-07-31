import type { ReactNode } from "react";
import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { OwnerNotificationSettingsForm } from "./owner-notification-settings-form";
import type {
  OwnerNotificationSettingsFormState,
  OwnerNotificationsPageViewData,
} from "./owner-notifications-content";
import { OwnerPortalShell } from "./owner-portal-shell";

export type OwnerNotificationsPageProps = {
  data: OwnerNotificationsPageViewData;
  institutionName: string;
  institutionLogoUrl?: string;
  markReadAction: (formData: FormData) => Promise<void>;
  markAllReadAction: () => Promise<void>;
  settingsAction: (
    prevState: OwnerNotificationSettingsFormState,
    formData: FormData,
  ) => Promise<OwnerNotificationSettingsFormState>;
  className?: string;
};

/**
 * Owner Notification Center — unread list, mark as read, channel settings.
 */
export function OwnerNotificationsPage({
  data,
  institutionName,
  institutionLogoUrl,
  markReadAction,
  markAllReadAction,
  settingsAction,
  className,
}: OwnerNotificationsPageProps) {
  return (
    <OwnerPortalShell
      institutionName={institutionName}
      institutionLogoUrl={institutionLogoUrl}
      className={className}
    >
      <Container size="lg" className="ea-owner-notifications">
        <header className="ea-owner-notifications__hero">
          <div>
            <p className="ea-owner-notifications__eyebrow">Bildirim merkezi</p>
            <h1 className="ea-owner-notifications__title">Bildirimler</h1>
            <p className="ea-owner-notifications__description">
              Önemli hesap ve kurum olayları. E-posta sağlayıcı UI’da yoktur; sunucu üzerinden
              iletilir.
            </p>
          </div>
          {data.unreadCount > 0 ? (
            <form action={markAllReadAction}>
              <button type="submit" className="ea-owner-notifications__mark-all">
                Tümünü okundu işaretle
              </button>
            </form>
          ) : null}
        </header>

        <section
          className="ea-owner-notifications__list-section"
          aria-labelledby="owner-notifications-list-heading"
        >
          <h2
            id="owner-notifications-list-heading"
            className="ea-owner-notifications__section-title"
          >
            Gelen kutusu
            {data.unreadCount > 0 ? (
              <span className="ea-owner-notifications__badge">
                {data.unreadCount}
                <span className="ea-sr-only"> okunmamış</span>
              </span>
            ) : null}
          </h2>

          {data.notifications.length === 0 ? (
            <p className="ea-owner-notifications__empty" role="status">
              Henüz bildiriminiz yok.
            </p>
          ) : (
            <ul className="ea-owner-notifications__list">
              {data.notifications.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "ea-owner-notifications__item",
                    item.unread && "ea-owner-notifications__item--unread",
                  )}
                >
                  <article aria-labelledby={`notif-title-${item.id}`}>
                    <header className="ea-owner-notifications__item-header">
                      <h3
                        id={`notif-title-${item.id}`}
                        className="ea-owner-notifications__item-title"
                      >
                        {item.title}
                      </h3>
                      <time className="ea-owner-notifications__item-time" dateTime={item.createdAt}>
                        {item.createdAtLabel}
                      </time>
                    </header>
                    <p className="ea-owner-notifications__item-body">{item.body}</p>
                    <div className="ea-owner-notifications__item-actions">
                      {item.href ? (
                        <a href={item.href} className="ea-owner-notifications__item-link">
                          Detaya git
                        </a>
                      ) : null}
                      {item.unread ? (
                        <form action={markReadAction}>
                          <input type="hidden" name="notificationId" value={item.id} />
                          <button type="submit" className="ea-owner-notifications__item-read">
                            Okundu
                          </button>
                        </form>
                      ) : (
                        <span className="ea-owner-notifications__item-read-state">Okundu</span>
                      )}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="ea-owner-notifications__settings-section"
          aria-labelledby="owner-notifications-settings-heading"
        >
          <h2
            id="owner-notifications-settings-heading"
            className="ea-owner-notifications__section-title"
          >
            Bildirim ayarları
          </h2>
          <p className="ea-owner-notifications__settings-intro">
            E-posta ve uygulama içi tercihlerinizi yönetin. Varsayılan olarak her iki kanal açıktır.
          </p>
          <OwnerNotificationSettingsForm settings={data.settings} action={settingsAction} />
        </section>
      </Container>
    </OwnerPortalShell>
  );
}

export type OwnerNotificationSettingsPageProps = {
  data: OwnerNotificationsPageViewData;
  institutionName: string;
  institutionLogoUrl?: string;
  settingsAction: OwnerNotificationsPageProps["settingsAction"];
  children?: ReactNode;
};

/**
 * Dedicated settings surface (ROUTES `/owner/settings`).
 */
export function OwnerNotificationSettingsPage({
  data,
  institutionName,
  institutionLogoUrl,
  settingsAction,
}: OwnerNotificationSettingsPageProps) {
  return (
    <OwnerPortalShell
      institutionName={institutionName}
      institutionLogoUrl={institutionLogoUrl}
    >
      <Container size="md" className="ea-owner-notifications">
        <header className="ea-owner-notifications__hero">
          <div>
            <p className="ea-owner-notifications__eyebrow">Hesap</p>
            <h1 className="ea-owner-notifications__title">Bildirim ayarları</h1>
            <p className="ea-owner-notifications__description">
              E-posta ve uygulama içi kanallar. Pazarlama e-postası gönderilmez.
            </p>
          </div>
        </header>
        <OwnerNotificationSettingsForm settings={data.settings} action={settingsAction} />
      </Container>
    </OwnerPortalShell>
  );
}
