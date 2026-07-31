"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";
import { type AuthFormState, EMPTY_AUTH_FORM_STATE } from "./auth-form-state";

export type ForgotPasswordFormProps = {
  action: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  initialState?: AuthFormState;
  className?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      {pending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
    </Button>
  );
}

/**
 * Password reset request — server action only; no Firebase in UI.
 */
export function ForgotPasswordForm({
  action,
  initialState = EMPTY_AUTH_FORM_STATE,
  className,
}: ForgotPasswordFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form className={cn("ea-auth-form", className)} action={formAction} noValidate>
      {state.message ? (
        <p
          className={cn(
            "ea-auth-form__status",
            state.ok ? "ea-auth-form__status--success" : "ea-auth-form__status--error",
          )}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <div className="ea-auth-form__field">
        <label className="ea-auth-form__label" htmlFor="auth-forgot-email">
          E-posta
        </label>
        <Input
          id="auth-forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={Boolean(state.message) && !state.ok}
        />
      </div>

      <div className="ea-auth-form__actions">
        <SubmitButton />
        <a href="/login" className="ea-auth-form__link">
          Girişe dön
        </a>
      </div>
    </form>
  );
}
