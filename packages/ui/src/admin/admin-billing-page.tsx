import { AdminShell } from "./admin-shell";
import { buildAdminNavItems } from "./admin-nav";

export type AdminBillingPlanRow = Readonly<{
  id: string;
  code: string;
  name: string;
  monthlyPriceTry: number;
  yearlyPriceTry: number;
  trialDays: number;
  active: boolean;
  sortOrder: number;
}>;

export type AdminBillingPageProps = {
  plans: readonly AdminBillingPlanRow[];
  updateAction: (formData: FormData) => Promise<void>;
  statusMessage?: string;
};

/**
 * Admin plan price / trial editor — entitlements remain in Firestore for now.
 */
export function AdminBillingPage({ plans, updateAction, statusMessage }: AdminBillingPageProps) {
  return (
    <AdminShell activeNavId="billing" navItems={buildAdminNavItems()}>
      <header className="ea-admin-page-header">
        <h1 className="ea-admin-page-title">Üyelik paketleri</h1>
        <p className="ea-admin-muted">
          Fiyatlar ve deneme süreleri burada yönetilir. Ödeme altyapısı henüz aktif değildir.
        </p>
      </header>

      {statusMessage ? (
        <p className="ea-admin-visuals__status" role="status">
          {statusMessage}
        </p>
      ) : null}

      <ul className="ea-admin-visuals__grid">
        {plans.map((plan) => (
          <li key={plan.id} className="ea-admin-visuals__card">
            <div className="ea-admin-visuals__body">
              <h2 className="ea-admin-visuals__label">
                {plan.name} <span className="ea-admin-muted">({plan.code})</span>
              </h2>
              <form action={updateAction} className="ea-admin-visuals__body">
                <input type="hidden" name="planId" value={plan.id} />
                <label className="ea-admin-visuals__hint">
                  Aylık (₺)
                  <input
                    className="ea-admin-visuals__input"
                    type="number"
                    name="monthlyPriceTry"
                    min={0}
                    defaultValue={plan.monthlyPriceTry}
                    required
                  />
                </label>
                <label className="ea-admin-visuals__hint">
                  Yıllık (₺)
                  <input
                    className="ea-admin-visuals__input"
                    type="number"
                    name="yearlyPriceTry"
                    min={0}
                    defaultValue={plan.yearlyPriceTry}
                    required
                  />
                </label>
                <label className="ea-admin-visuals__hint">
                  Deneme (gün)
                  <input
                    className="ea-admin-visuals__input"
                    type="number"
                    name="trialDays"
                    min={0}
                    defaultValue={plan.trialDays}
                    required
                  />
                </label>
                <label className="ea-admin-visuals__hint">
                  <input type="checkbox" name="active" value="1" defaultChecked={plan.active} /> Aktif
                </label>
                <button type="submit" className="ea-button ea-button--primary">
                  Kaydet
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
