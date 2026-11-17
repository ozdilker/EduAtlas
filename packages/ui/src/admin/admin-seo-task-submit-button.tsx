"use client";

import { useFormStatus } from "react-dom";

/**
 * Pending-aware submit for SEO task forms (react-dom useFormStatus).
 */
export function AdminSeoTaskSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined}>
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </button>
  );
}
