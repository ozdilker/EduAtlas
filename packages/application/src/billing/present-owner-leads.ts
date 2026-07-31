import {
  maskEmail,
  maskMessage,
  maskPersonName,
  maskPhone,
  resolveLeadVisibility,
  type Lead,
} from "@eduatlas/domain";
import type { InstitutionBillingAccess } from "./resolve-institution-billing-access";

export type PresentedOwnerLead = Readonly<{
  readonly lead: Lead;
  readonly locked: boolean;
  readonly parentName: string;
  readonly phone: string;
  readonly email?: string;
  readonly message: string;
  /** 1-based lifetime ordinal (oldest = 1). */
  readonly lifetimeOrdinal: number;
}>;

const UPGRADE_MESSAGE =
  "Yeni veli taleplerini görüntülemek için Premium'a geçin. Premium ile sınırsız lead, detaylı analiz, öne çıkma ve daha fazlasına erişebilirsiniz.";

export function ownerLeadUpgradeMessage(): string {
  return UPGRADE_MESSAGE;
}

/**
 * Present leads for owner UI. Ordinal is lifetime by createdAt ascending.
 * Storage is never mutated — masking is presentation-only.
 */
export function presentOwnerLeads(
  leads: readonly Lead[],
  access: InstitutionBillingAccess,
): readonly PresentedOwnerLead[] {
  const chronological = [...leads].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const ordinalById = new Map<string, number>();
  chronological.forEach((lead, index) => {
    ordinalById.set(lead.id.value, index + 1);
  });

  return leads.map((lead) => {
    const lifetimeOrdinal = ordinalById.get(lead.id.value) ?? chronological.length;
    const visibility = resolveLeadVisibility({
      ordinal: lifetimeOrdinal,
      entitlements: access.entitlements,
    });
    if (visibility === "full") {
      return {
        lead,
        locked: false,
        parentName: lead.parentName,
        phone: lead.phone,
        ...(lead.email ? { email: lead.email } : {}),
        message: lead.message,
        lifetimeOrdinal,
      };
    }
    return {
      lead,
      locked: true,
      parentName: maskPersonName(lead.parentName),
      phone: maskPhone(lead.phone),
      ...(lead.email ? { email: maskEmail(lead.email) } : {}),
      message: maskMessage(lead.message),
      lifetimeOrdinal,
    };
  });
}
