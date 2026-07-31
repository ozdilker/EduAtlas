"use client";

import { getButtonClassName } from "@eduatlas/ui";
import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="ea-status-page">
      <div
        className="ea-status-block ea-status-block--centered ea-status-block--error"
        role="alert"
      >
        <p className="ea-status-block__eyebrow">Hata</p>
        <h1 className="ea-status-block__title">Bir şeyler ters gitti</h1>
        <p className="ea-status-block__message">
          Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen yeniden deneyin.
        </p>
        <div className="ea-status-block__actions">
          <button
            type="button"
            onClick={reset}
            className={getButtonClassName({ variant: "primary", size: "md" })}
          >
            Yeniden dene
          </button>
          <Link href="/" className={getButtonClassName({ variant: "secondary", size: "md" })}>
            Ana sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
