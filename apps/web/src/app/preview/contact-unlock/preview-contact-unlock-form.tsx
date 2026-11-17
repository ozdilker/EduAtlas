"use client";

import type { LeadFormActionState } from "@eduatlas/ui";
import { useActionState } from "react";
import { previewContactUnlockFailureAction } from "./actions";

const failureInitialState: LeadFormActionState = { ok: false, message: "" };

export function PreviewContactUnlockFailureForm() {
  const [state, formAction] = useActionState(
    previewContactUnlockFailureAction,
    failureInitialState,
  );

  return (
    <form action={formAction}>
      <button type="submit">Başarısız akışı dene</button>
      {state.message ? <p role="alert">{state.message}</p> : null}
    </form>
  );
}
