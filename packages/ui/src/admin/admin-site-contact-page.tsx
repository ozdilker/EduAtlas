import { AdminShell } from "./admin-shell";
import { buildAdminNavItems } from "./admin-nav";

export type AdminSiteContactFormValues = Readonly<{
  displayName: string;
  email: string;
  phone: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
}>;

export type AdminSiteContactPageProps = {
  values: AdminSiteContactFormValues;
  updateAction: (formData: FormData) => Promise<void>;
  statusMessage?: string;
  errorMessage?: string;
};

/**
 * Admin editor for EduAtlas public organization contact & Turkish address.
 */
export function AdminSiteContactPage({
  values,
  updateAction,
  statusMessage,
  errorMessage,
}: AdminSiteContactPageProps) {
  return (
    <AdminShell activeNavId="site-contact" navItems={buildAdminNavItems()}>
      <header className="ea-admin-page-header">
        <h1 className="ea-admin-page-title">İletişim bilgileri</h1>
        <p className="ea-admin-muted">
          Bu bilgiler /contact, footer, yasal sayfalar ve PayTR ödeme yedek alanlarında kullanılır.
        </p>
      </header>

      {statusMessage ? (
        <p className="ea-admin-visuals__status" role="status">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="ea-admin-visuals__status" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <form action={updateAction} className="ea-admin-site-contact">
        <label className="ea-admin-visuals__hint">
          Unvan
          <input
            className="ea-admin-visuals__input"
            type="text"
            name="displayName"
            defaultValue={values.displayName}
            autoComplete="organization"
          />
        </label>
        <label className="ea-admin-visuals__hint">
          E-posta
          <input
            className="ea-admin-visuals__input"
            type="email"
            name="email"
            defaultValue={values.email}
            autoComplete="email"
          />
        </label>
        <label className="ea-admin-visuals__hint">
          Telefon
          <input
            className="ea-admin-visuals__input"
            type="tel"
            name="phone"
            defaultValue={values.phone}
            autoComplete="tel"
          />
        </label>
        <label className="ea-admin-visuals__hint">
          Açık adres
          <input
            className="ea-admin-visuals__input"
            type="text"
            name="streetAddress"
            defaultValue={values.streetAddress}
            autoComplete="street-address"
          />
        </label>
        <label className="ea-admin-visuals__hint">
          İlçe
          <input
            className="ea-admin-visuals__input"
            type="text"
            name="addressLocality"
            defaultValue={values.addressLocality}
            autoComplete="address-level2"
          />
        </label>
        <label className="ea-admin-visuals__hint">
          İl
          <input
            className="ea-admin-visuals__input"
            type="text"
            name="addressRegion"
            defaultValue={values.addressRegion}
            autoComplete="address-level1"
          />
        </label>
        <label className="ea-admin-visuals__hint">
          Posta kodu
          <input
            className="ea-admin-visuals__input"
            type="text"
            name="postalCode"
            defaultValue={values.postalCode}
            autoComplete="postal-code"
          />
        </label>
        <button type="submit" className="ea-button ea-button--primary">
          Kaydet
        </button>
      </form>
    </AdminShell>
  );
}
