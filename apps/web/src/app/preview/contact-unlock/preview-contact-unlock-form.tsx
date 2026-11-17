"use client";

import { Button, type LeadFormActionState } from "@eduatlas/ui";
import { useActionState } from "react";
import { previewContactUnlockFailureAction } from "./actions";

const failureInitialState: LeadFormActionState = { ok: false, message: "" };

export function PreviewContactUnlockFailureForm() {
  const [state, formAction] = useActionState(
    previewContactUnlockFailureAction,
    failureInitialState,
  );

  return (
    <section className="ea-profile-section" aria-label="Başarısız önizleme akışı">
      <form className="ea-profile-lead__form" action={formAction}>
        <Button type="submit" variant="secondary">
          Başarısız akışı dene
        </Button>
        {state.message ? (
          <p className="ea-profile-lead__note ea-profile-lead__note--error" role="alert">
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
