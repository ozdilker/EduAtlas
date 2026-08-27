"use client";

import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import type { ButtonSize, ButtonVariant } from "../components/button-classes";
import { cn } from "../lib/cn";

export type LogoutButtonProps = {
  action: () => Promise<void>;
  className?: string;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function PendingLabel({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? "Çıkış yapılıyor…" : label}</>;
}

/**
 * Logout control — server action clears session cookie; no client role state.
 */
export function LogoutButton({
  action,
  className,
  label = "Çıkış yap",
  variant = "secondary",
  size = "sm",
}: LogoutButtonProps) {
  return (
    <form action={action} className={cn("ea-logout-form", className)}>
      <Button type="submit" variant={variant} size={size}>
        <PendingLabel label={label} />
      </Button>
    </form>
  );
}
