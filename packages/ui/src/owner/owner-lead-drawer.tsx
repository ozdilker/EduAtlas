"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { cn } from "../lib/cn";

export type OwnerLeadDrawerProps = {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  className?: string;
};

/**
 * Right-side lead detail drawer — native dialog focus trap, Esc, backdrop close.
 * Open/close is controlled by the parent so history can dismiss without a reload.
 */
export function OwnerLeadDrawer({ children, open, onClose, className }: OwnerLeadDrawerProps) {
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
      className={cn("ea-owner-portal__drawer-dialog", className)}
      aria-labelledby={titleId}
      aria-modal="true"
    >
      <div ref={panelRef} className="ea-owner-portal__drawer-panel" tabIndex={-1}>
        <h2 id={titleId} className="ea-sr-only">
          Talep detayı
        </h2>
        {children}
        <button type="button" className="ea-owner-portal__drawer-close" onClick={onClose}>
          Detayı kapat
        </button>
      </div>
    </dialog>
  );
}
