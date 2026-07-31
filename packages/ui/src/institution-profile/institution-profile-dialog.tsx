"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { Button } from "../components/button";
import { cn } from "../lib/cn";

export type InstitutionProfileDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

/**
 * Centered modal for institution profile lead / claim forms.
 */
export function InstitutionProfileDialog({
  open,
  onClose,
  title,
  children,
  className,
}: InstitutionProfileDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      panelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    function handleCancel(event: Event) {
      event.preventDefault();
      onCloseRef.current();
    }

    function handleClick(event: MouseEvent) {
      if (event.target === dialog) {
        onCloseRef.current();
      }
    }

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleClick);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={cn("ea-profile-dialog", className)}
      aria-labelledby={titleId}
      aria-modal="true"
    >
      <div ref={panelRef} className="ea-profile-dialog__panel" tabIndex={-1}>
        <div className="ea-profile-dialog__header">
          <h2 id={titleId} className="ea-profile-dialog__title">
            {title}
          </h2>
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            className="ea-profile-dialog__close"
            onClick={onClose}
          >
            Kapat
          </Button>
        </div>
        <div className="ea-profile-dialog__body">{children}</div>
      </div>
    </dialog>
  );
}
