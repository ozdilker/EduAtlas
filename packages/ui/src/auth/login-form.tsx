"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";
import { type AuthFormState, EMPTY_AUTH_FORM_STATE } from "./auth-form-state";

export type LoginFormProps = {
  action: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  nextPath?: string;
  /** Which portal this form belongs to — used for role-aware redirects. */
  portal?: "parent" | "owner";
  initialState?: AuthFormState;
  className?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      {pending ? "Giriş yapılıyor…" : "Giriş yap"}
    </Button>
  );
}

/**
 * Email/password login — posts to a server action; no Firebase in UI.
 */
export function LoginForm({
  action,
  nextPath = "/owner",
  portal = "owner",
  initialState = EMPTY_AUTH_FORM_STATE,
  className,
}: LoginFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form className={cn("ea-auth-form", className)} action={formAction} noValidate>
      <input type="hidden" name="next" value={nextPath} />
      <input type="hidden" name="portal" value={portal} />

      {state.message ? (
        <p
          className={cn(
            "ea-auth-form__status",
            state.ok ? "ea-auth-form__status--success" : "ea-auth-form__status--error",
          )}
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="ea-auth-form__field">
        <label className="ea-auth-form__label" htmlFor="auth-login-email">
          E-posta
        </label>
        <Input
          id="auth-login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={Boolean(state.message) && !state.ok}
        />
      </div>

      <div className="ea-auth-form__field">
        <label className="ea-auth-form__label" htmlFor="auth-login-password">
          Şifre
        </label>
        <Input
          id="auth-login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={10}
          error={Boolean(state.message) && !state.ok}
        />
      </div>

      <div className="ea-auth-form__actions">
        <SubmitButton />
        <a href="/forgot-password" className="ea-auth-form__link">
          Şifremi unuttum
        </a>
      </div>
    </form>
  );
}
