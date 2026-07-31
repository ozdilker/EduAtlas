"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { cn } from "../lib/cn";
import type {
  OwnerNotificationSettingsFormState,
  OwnerNotificationSettingsView,
} from "./owner-notifications-content";

export type OwnerNotificationSettingsFormProps = {
  settings: OwnerNotificationSettingsView;
  action: (
    prevState: OwnerNotificationSettingsFormState,
    formData: FormData,
  ) => Promise<OwnerNotificationSettingsFormState>;
  initialState?: OwnerNotificationSettingsFormState;
  className?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="md" disabled={pending}>
      {pending ? "Kaydediliyor…" : "Tercihleri kaydet"}
    </Button>
  );
}

/**
 * Email + in-app notification preference form (no provider logic).
 */
export function OwnerNotificationSettingsForm({
  settings,
  action,
  initialState = { ok: false, message: "" },
  className,
}: OwnerNotificationSettingsFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form className={cn("ea-owner-notif-settings", className)} action={formAction}>
      {state.message ? (
        <p
          className={cn(
            "ea-owner-notif-settings__status",
            state.ok
              ? "ea-owner-notif-settings__status--success"
              : "ea-owner-notif-settings__status--error",
          )}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <fieldset className="ea-owner-notif-settings__fieldset">
        <legend className="ea-owner-notif-settings__legend">Kanallar</legend>
        <label className="ea-owner-notif-settings__check">
          <input type="checkbox" name="inAppEnabled" defaultChecked={settings.inAppEnabled} />
          <span>Uygulama içi bildirimler</span>
        </label>
        <label className="ea-owner-notif-settings__check">
          <input type="checkbox" name="emailEnabled" defaultChecked={settings.emailEnabled} />
          <span>E-posta bildirimleri</span>
        </label>
      </fieldset>

      <fieldset className="ea-owner-notif-settings__fieldset">
        <legend className="ea-owner-notif-settings__legend">Olay türleri</legend>
        <p className="ea-owner-notif-settings__hint">
          İşaretli türler tercih ettiğiniz kanallara gönderilir. Pazarlama e-postası yoktur.
        </p>
        {settings.types.map((type) => (
          <label key={type.id} className="ea-owner-notif-settings__check">
            <input type="checkbox" name={`type_${type.id}`} defaultChecked={type.enabled} />
            <span>{type.label}</span>
          </label>
        ))}
      </fieldset>

      <SubmitButton />
    </form>
  );
}
