"use client";

import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { cn } from "../lib/cn";

export type LogoutButtonProps = {
  action: () => Promise<void>;
  className?: string;
  label?: string;
};

function PendingLabel({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? "Çıkış yapılıyor…" : label}</>;
}

/**
 * Logout control — server action clears session cookie; no client role state.
 */
export function LogoutButton({ action, className, label = "Çıkış yap" }: LogoutButtonProps) {
  return (
    <form action={action} className={cn("ea-logout-form", className)}>
      <Button type="submit" variant="secondary" size="sm">
        <PendingLabel label={label} />
      </Button>
    </form>
  );
}
