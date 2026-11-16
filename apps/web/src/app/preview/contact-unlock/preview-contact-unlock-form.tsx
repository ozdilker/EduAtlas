"use client";

import { InstitutionLeadCTA, type LeadFormActionState } from "@eduatlas/ui";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { PREVIEW_UNLOCK_INSTITUTION } from "./fixture-data";
import {
  previewContactUnlockFailureAction,
  previewContactUnlockSuccessAction,
} from "./actions";

const failureInitialState: LeadFormActionState = { ok: false, message: "" };

export function PreviewContactUnlockForm() {
  const router = useRouter();

  return (
    <InstitutionLeadCTA
      institutionName={PREVIEW_UNLOCK_INSTITUTION.name}
      institutionId={PREVIEW_UNLOCK_INSTITUTION.id}
      action={previewContactUnlockSuccessAction}
      variant="panel"
      onContactUnlocked={() => {
        router.refresh();
      }}
    />
  );
}

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
