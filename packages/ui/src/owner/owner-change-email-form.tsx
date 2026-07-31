"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";

export type OwnerChangeEmailFormState = {
  ok: boolean;
  message: string;
};

export type OwnerChangeEmailFormProps = {
  currentEmail: string;
  action: (
    prevState: OwnerChangeEmailFormState,
    formData: FormData,
  ) => Promise<OwnerChangeEmailFormState>;
  className?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="md" disabled={pending}>
      {pending ? "Kaydediliyor…" : "E-postayı güncelle"}
    </Button>
  );
}

/**
 * Owner account login email change (new email + confirm + current password).
 */
export function OwnerChangeEmailForm({
  currentEmail,
  action,
  className,
}: OwnerChangeEmailFormProps) {
  const [state, formAction] = useActionState(action, { ok: false, message: "" });

  return (
    <form className={cn("ea-owner-change-email", className)} action={formAction}>
      <h2 className="ea-owner-portal__section-title">Giriş e-postasını değiştir</h2>
      <p className="ea-owner-change-email__hint">
        Kurumu sahiplenirken kullandığınız giriş e-postasını güncelleyin. Kurum iletişim e-postasından
        ayrıdır.
      </p>

      <p className="ea-owner-change-email__current">
        Mevcut giriş e-postası: <strong>{currentEmail}</strong>
      </p>

      {state.message ? (
        <p
          className={cn(
            "ea-owner-change-email__status",
            state.ok
              ? "ea-owner-change-email__status--success"
              : "ea-owner-change-email__status--error",
          )}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <div className="ea-owner-change-email__fields">
        <label className="ea-owner-change-email__field">
          <span>Yeni e-posta</span>
          <Input
            name="newEmail"
            type="email"
            autoComplete="email"
            required
            placeholder="yeni@ornek.com"
          />
        </label>
        <label className="ea-owner-change-email__field">
          <span>Yeni e-posta (tekrar)</span>
          <Input name="confirmEmail" type="email" autoComplete="email" required />
        </label>
        <label className="ea-owner-change-email__field">
          <span>Mevcut şifre</span>
          <Input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}
