"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";

export type OwnerChangePasswordFormState = {
  ok: boolean;
  message: string;
};

export type OwnerChangePasswordFormProps = {
  action: (
    prevState: OwnerChangePasswordFormState,
    formData: FormData,
  ) => Promise<OwnerChangePasswordFormState>;
  className?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="md" disabled={pending}>
      {pending ? "Kaydediliyor…" : "Şifreyi güncelle"}
    </Button>
  );
}

/**
 * Owner account password change (current + new + confirm).
 */
export function OwnerChangePasswordForm({ action, className }: OwnerChangePasswordFormProps) {
  const [state, formAction] = useActionState(action, { ok: false, message: "" });

  return (
    <form className={cn("ea-owner-change-password", className)} action={formAction}>
      <h2 className="ea-owner-portal__section-title">Şifre değiştir</h2>
      <p className="ea-owner-change-password__hint">
        Geçici şifreyle giriş yaptıysanız buradan yeni bir şifre belirleyin.
      </p>

      {state.message ? (
        <p
          className={cn(
            "ea-owner-change-password__status",
            state.ok
              ? "ea-owner-change-password__status--success"
              : "ea-owner-change-password__status--error",
          )}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <div className="ea-owner-change-password__fields">
        <label className="ea-owner-change-password__field">
          <span>Mevcut şifre</span>
          <Input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <label className="ea-owner-change-password__field">
          <span>Yeni şifre</span>
          <Input name="newPassword" type="password" autoComplete="new-password" required />
        </label>
        <label className="ea-owner-change-password__field">
          <span>Yeni şifre (tekrar)</span>
          <Input name="confirmPassword" type="password" autoComplete="new-password" required />
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}
