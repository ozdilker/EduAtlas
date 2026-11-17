import type { LeadFormActionState } from "@eduatlas/ui";

/**
 * Lead persistence and contact unlock are separate.
 * A saved lead stays successful even when the unlock cookie cannot be issued.
 */
export function leadSubmitSuccessState(contactUnlocked: boolean): LeadFormActionState {
  if (contactUnlocked) {
    return {
      ok: true,
      contactUnlocked: true,
      message:
        "Talebiniz alındı. Bu kurumun iletişim bilgileri artık görüntülenebilir; sayfa yenileniyor.",
    };
  }

  return {
    ok: true,
    contactUnlocked: false,
    message:
      "Talebiniz alındı. Kurum en kısa sürede sizinle iletişime geçebilir. İletişim bilgileri şu anda açılamadı; formu yeniden göndermeniz gerekmez.",
  };
}

export function leadSubmitFailureState(message: string): LeadFormActionState {
  return {
    ok: false,
    contactUnlocked: false,
    message,
  };
}
