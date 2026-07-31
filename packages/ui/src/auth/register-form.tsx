"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";
import { type AuthFormState, EMPTY_AUTH_FORM_STATE } from "./auth-form-state";

export type RegisterFormProps = {
  action: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  nextPath?: string;
  /** Hidden account type for server-side role assignment (`parent` | `owner`). */
  accountType?: "parent" | "owner";
  initialState?: AuthFormState;
  className?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      {pending ? "Kaydediliyor…" : "Hesap oluştur"}
    </Button>
  );
}

/**
 * Email/password registration — verification email is triggered server-side.
 */
export function RegisterForm({
  action,
  nextPath = "/owner",
  accountType,
  initialState = EMPTY_AUTH_FORM_STATE,
  className,
}: RegisterFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form className={cn("ea-auth-form", className)} action={formAction} noValidate>
      <input type="hidden" name="next" value={nextPath} />
      {accountType ? <input type="hidden" name="accountType" value={accountType} /> : null}

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
        <label className="ea-auth-form__label" htmlFor="auth-register-name">
          Ad soyad
        </label>
        <Input
          id="auth-register-name"
          name="displayName"
          type="text"
          autoComplete="name"
          maxLength={120}
        />
      </div>

      <div className="ea-auth-form__field">
        <label className="ea-auth-form__label" htmlFor="auth-register-email">
          E-posta
        </label>
        <Input
          id="auth-register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={Boolean(state.message) && !state.ok}
        />
      </div>

      <div className="ea-auth-form__field">
        <label className="ea-auth-form__label" htmlFor="auth-register-password">
          Şifre
        </label>
        <Input
          id="auth-register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          error={Boolean(state.message) && !state.ok}
        />
        <p className="ea-auth-form__hint">En az 10 karakter.</p>
      </div>

      <div className="ea-auth-form__actions">
        <SubmitButton />
        <a href={accountType === "parent" ? "/veli/giris" : "/login"} className="ea-auth-form__link">
          Zaten hesabım var
        </a>
      </div>
    </form>
  );
}
